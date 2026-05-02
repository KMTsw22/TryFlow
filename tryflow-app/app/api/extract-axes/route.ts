import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
// pdf-parse는 module load 시 디버그 코드가 ./test/data/05-versions-space.pdf 를 읽으려 시도해서
// Next 서버리스 환경에서 ENOENT 로 죽는 이슈가 있다. 내부 구현 파일을 직접 import 해서 회피.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PDF_MAX_BYTES = 10 * 1024 * 1024;
const MD_MAX_BYTES = 1 * 1024 * 1024;

// LLM 컨텍스트 폭주 방지. 보통 8~12 페이지 PDF 본문이 이 범위 안에 들어옴.
const TEXT_MAX_CHARS = 60_000;

const AXIS_KEYS = [
  "axis_market",
  "axis_problem",
  "axis_timing",
  "axis_product",
  "axis_defensibility",
  "axis_business_model",
] as const;
type AxisKey = (typeof AXIS_KEYS)[number];

const SYSTEM_PROMPT = `You extract structured startup-idea answers from a user-uploaded document (a deck, memo, or markdown).

Return strict JSON with these six keys, all string values:
- axis_market: Who feels this pain right now, and how many of them are there?
- axis_problem: What is the user doing today instead, and why is that broken?
- axis_timing: Why now? What changed in the last 12-24 months that makes this possible?
- axis_product: What does the product actually do? Describe the core flow in one paragraph.
- axis_defensibility: What makes this hard to copy 12 months in?
- axis_business_model: Who pays, how much, and why is it worth it to them?

Rules:
- Each answer 30-500 characters.
- Use only facts present in the document. Do not invent numbers, names, or claims.
- If the document does not address an axis, return an empty string for that key.
- Write in the same language as the document (Korean stays Korean, English stays English).
- Be concrete: real numbers, real workflows, real names beat abstractions.
- Do not include preamble or markdown — just the JSON object.`;

async function extractText(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const parsed = await pdfParse(buf);
    return parsed.text ?? "";
  }
  if (name.endsWith(".md") || name.endsWith(".markdown")) {
    return buf.toString("utf-8");
  }
  throw new Error("Unsupported file type");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use file upload." }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const isPdf = name.endsWith(".pdf");
    const isMd = name.endsWith(".md") || name.endsWith(".markdown");
    if (!isPdf && !isMd) {
      return NextResponse.json(
        { error: "Only .pdf and .md files are supported." },
        { status: 400 }
      );
    }

    const limit = isPdf ? PDF_MAX_BYTES : MD_MAX_BYTES;
    if (file.size > limit) {
      const limitMb = (limit / 1024 / 1024).toFixed(0);
      return NextResponse.json(
        { error: `File too large. Max ${limitMb}MB for ${isPdf ? "PDF" : "Markdown"}.` },
        { status: 413 }
      );
    }

    let text: string;
    try {
      text = await extractText(file);
    } catch {
      return NextResponse.json(
        { error: "Could not read this file. It may be corrupted or password-protected." },
        { status: 422 }
      );
    }

    const trimmed = text.trim();
    if (trimmed.length < 50) {
      return NextResponse.json(
        { error: "File has too little readable text to extract from." },
        { status: 422 }
      );
    }

    const truncated = trimmed.length > TEXT_MAX_CHARS
      ? trimmed.slice(0, TEXT_MAX_CHARS)
      : trimmed;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Document (${isPdf ? "PDF" : "Markdown"}, filename: ${file.name}):\n\n${truncated}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "AI response was malformed. Please try again." },
        { status: 502 }
      );
    }

    const axes = {} as Record<AxisKey, string>;
    for (const key of AXIS_KEYS) {
      const v = parsed[key];
      axes[key] = typeof v === "string" ? v.slice(0, 500) : "";
    }

    return NextResponse.json({ axes });
  } catch (err) {
    console.error("[extract-axes]", err);
    return NextResponse.json(
      { error: "Something went wrong while extracting." },
      { status: 500 }
    );
  }
}
