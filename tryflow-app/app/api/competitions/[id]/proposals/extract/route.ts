// POST /api/competitions/[id]/proposals/extract
//
// 출품용 파일(PDF/Markdown) 을 받아 텍스트 추출 → LLM 으로 제안서의 제목·팀·
// 요약을 자동 분리해 반환한다. 파일 자체는 저장하지 않고 응답 후 메모리에서
// 사라짐(데모 단계 단순화 — 파일 저장이 필요해지면 Supabase Storage bucket
// 추가하고 source_file_url 컬럼만 붙이면 됨).
//
// 패턴은 /api/extract-axes 와 동일하게 유지 — pdf-parse 내부 경로 import,
// gpt-4o-mini + JSON response_format, 본인 인증 요구.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
// pdf-parse 모듈 로드 시 내장 디버그 코드가 ./test/data/*.pdf 를 읽으려 하다
// ENOENT 로 죽는 이슈가 있어 내부 파일을 직접 import (extract-axes 와 동일).
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PDF_MAX_BYTES = 10 * 1024 * 1024;
const MD_MAX_BYTES = 1 * 1024 * 1024;
const TEXT_MAX_CHARS = 60_000; // LLM 컨텍스트 폭주 방지

const SYSTEM_PROMPT = `You read a contest/competition submission document (a proposal, deck, business plan, or any creative entry) and extract three fields:

Return strict JSON with these keys, all string values:
- title: The proposal's title or main idea name. Max 200 characters. If absent, generate a concise title from the document's core idea.
- team: The team name or author(s). Max 100 characters. If absent, return empty string.
- summary: A faithful summary of the submission, 200-800 characters. Cover what the idea is, who it's for, and the core mechanism. Stay close to the document — do not editorialize or score.

Rules:
- Use only facts present in the document. Do not invent numbers, names, or claims.
- Write in the same language as the document (Korean stays Korean, English stays English).
- If the summary would be shorter than 30 characters, you have not understood the document — try again with more detail (still factual).
- Do not include preamble or markdown — just the JSON object.`;

async function extractText(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const parsed = await pdfParse(buf);
    return parsed.text ?? "";
  }
  if (name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt")) {
    return buf.toString("utf-8");
  }
  throw new Error("Unsupported file type");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "파일 업로드를 사용하려면 로그인해주세요." },
        { status: 401 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "파일이 첨부되지 않았습니다." }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const isPdf = name.endsWith(".pdf");
    const isText =
      name.endsWith(".md") ||
      name.endsWith(".markdown") ||
      name.endsWith(".txt");
    if (!isPdf && !isText) {
      return NextResponse.json(
        { error: "지원하는 파일 형식: PDF, Markdown(.md), Text(.txt)." },
        { status: 400 }
      );
    }

    const limit = isPdf ? PDF_MAX_BYTES : MD_MAX_BYTES;
    if (file.size > limit) {
      const limitMb = (limit / 1024 / 1024).toFixed(0);
      return NextResponse.json(
        {
          error: `파일이 너무 큽니다. 최대 ${limitMb}MB (${
            isPdf ? "PDF" : "텍스트"
          }).`,
        },
        { status: 413 }
      );
    }

    // 텍스트 추출 — 이미지 PDF(스캔본) 는 빈 결과를 줘서 아래 50자 체크에서 걸림.
    let text: string;
    try {
      text = await extractText(file);
    } catch {
      return NextResponse.json(
        { error: "파일을 읽을 수 없습니다. 손상되었거나 암호가 걸려있을 수 있어요." },
        { status: 422 }
      );
    }

    const trimmed = text.trim();
    if (trimmed.length < 50) {
      return NextResponse.json(
        {
          error:
            "파일에서 읽을 수 있는 텍스트가 너무 적습니다. 이미지 스캔본 PDF 라면 텍스트 PDF 로 다시 저장해보세요.",
        },
        { status: 422 }
      );
    }

    const truncated =
      trimmed.length > TEXT_MAX_CHARS ? trimmed.slice(0, TEXT_MAX_CHARS) : trimmed;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Document (${isPdf ? "PDF" : "Text"}, filename: ${file.name}):\n\n${truncated}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "AI 응답 형식이 잘못되었습니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    // 출력 검증 — 길이 제한·문자열 형 확인. UI 의 제출 폼 제약과 일치시킨다.
    const title =
      typeof parsed.title === "string" ? parsed.title.trim().slice(0, 200) : "";
    const team =
      typeof parsed.team === "string" ? parsed.team.trim().slice(0, 100) : "";
    const summary =
      typeof parsed.summary === "string"
        ? parsed.summary.trim().slice(0, 5000)
        : "";

    if (!title) {
      return NextResponse.json(
        {
          error:
            "파일에서 제안서 제목을 추출하지 못했습니다. 직접 입력해주세요.",
        },
        { status: 422 }
      );
    }
    if (summary.length < 30) {
      return NextResponse.json(
        {
          error:
            "요약이 너무 짧게 추출되었습니다. 파일에 평가할 만한 내용이 충분한지 확인해주세요.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      title,
      team,
      summary,
      // 파일 원문 전체(컨텍스트 폭주 방지로 truncate 된 텍스트). summary 는 사람이
      // 보는 요약이고, 실제 AI 채점은 이 fullText(원문)로 판단한다.
      fullText: truncated,
      // 디버깅·표시용 — 어떤 파일에서 추출됐는지 UI 에 표시할 수 있게.
      sourceFileName: file.name,
    });
  } catch (err) {
    console.error("[proposals/extract]", err);
    return NextResponse.json(
      { error: "파일 처리 중 문제가 발생했습니다." },
      { status: 500 }
    );
  }
}
