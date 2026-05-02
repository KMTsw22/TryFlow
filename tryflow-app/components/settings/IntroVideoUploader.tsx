"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "user-intro-videos";
const MAX_DURATION_SECONDS = 100;
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MiB
const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

interface Props {
  userId: string;
  initialUrl: string | null;
  initialDuration: number | null;
}

/**
 * IntroVideoUploader — settings/profile 의 자기소개 영상 업로드 섹션.
 *
 * 100초 이하 / 100MB 이하 영상을 본인 폴더 (uid/) 로 직접 Storage 업로드한 뒤
 * /api/profile/video 로 메타데이터를 등록한다. Vercel 의 4.5MB body 한도를
 *피하기 위해 파일 자체는 API 를 거치지 않고 클라이언트에서 직접 올린다.
 */
export function IntroVideoUploader({ userId, initialUrl, initialDuration }: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(initialUrl);
  const [duration, setDuration] = useState<number | null>(initialDuration);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only MP4, MOV, or WebM videos are supported.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`File is too large. Max size is 100 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }

    let detectedDuration: number;
    try {
      detectedDuration = await readVideoDuration(file);
    } catch {
      setError("Could not read this video. Try a different file.");
      return;
    }

    if (detectedDuration > MAX_DURATION_SECONDS) {
      setError(
        `Video is too long. Max ${MAX_DURATION_SECONDS}s (got ${Math.round(detectedDuration)}s).`
      );
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const supabase = createClient();

      // Stable filename so re-uploads overwrite (and so the old file gets
      // removed by the API's cleanup step regardless of extension change).
      const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase();
      const path = `${userId}/intro.${ext}`;

      const { error: uploadErr } = await supabase
        .storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      setProgress(60);

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      const res = await fetch("/api/profile/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_path: path,
          duration_seconds: detectedDuration,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to register video");
      }

      // Cache-bust so the <video> tag re-fetches if the same path was reused.
      setVideoUrl(`${body.intro_video_url}?t=${Date.now()}`);
      setDuration(body.intro_video_duration_seconds);
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm("Delete your intro video?")) return;
    setError("");
    setUploading(true);
    try {
      const res = await fetch("/api/profile/video", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete");
      }
      setVideoUrl(null);
      setDuration(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
        A short intro video (max <strong>{MAX_DURATION_SECONDS}s</strong>, 100 MB) shown on
        your public founder page. Tell investors who you are in your own voice.
      </p>

      {videoUrl ? (
        <div className="space-y-3">
          <div
            className="relative border overflow-hidden"
            style={{ borderColor: "var(--t-border-card)", background: "#000" }}
          >
            <video
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[360px]"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {duration ? `${duration}s` : ""} · uploaded
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold border transition-colors disabled:opacity-50"
                style={{
                  borderColor: "var(--t-input-border)",
                  color: "var(--text-secondary)",
                  background: "var(--input-bg)",
                }}
              >
                <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                Replace
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold border transition-colors disabled:opacity-50"
                style={{
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "var(--signal-danger)",
                }}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-10 border border-dashed transition-colors hover:opacity-80 disabled:opacity-50"
          style={{
            borderColor: "var(--t-input-border)",
            background: "var(--input-bg)",
            color: "var(--text-tertiary)",
          }}
        >
          <Video className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-sm font-medium">
            {uploading ? "Uploading…" : "Click to upload intro video"}
          </span>
          <span className="text-[11px]">MP4 / MOV / WebM · ≤ {MAX_DURATION_SECONDS}s · ≤ 100 MB</span>
        </button>
      )}

      {uploading && progress > 0 && progress < 100 && (
        <div className="h-1 w-full overflow-hidden" style={{ background: "var(--t-border-subtle)" }}>
          <div
            className="h-full transition-all"
            style={{ width: `${progress}%`, background: "var(--accent)" }}
          />
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: "var(--signal-danger)" }}>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      // Some encoders report Infinity until the file is fully scanned;
      // bail rather than letting an unknown duration through.
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        reject(new Error("Unknown duration"));
        return;
      }
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video metadata"));
    };
    video.src = url;
  });
}
