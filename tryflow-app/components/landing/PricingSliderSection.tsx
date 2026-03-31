"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface SliderConfig {
  paymentType: "one-time" | "monthly";
  min: number;
  max: number;
}

interface Props {
  experimentId: string;
  config: SliderConfig;
  initialResponses: number[];
}

function buildBuckets(values: number[], min: number, max: number, bucketCount = 10) {
  const step = (max - min) / bucketCount;
  const buckets: { label: string; count: number }[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const lo = min + i * step;
    const hi = lo + step;
    buckets.push({
      label: `$${Math.round(lo)}`,
      count: values.filter(v => v >= lo && (i === bucketCount - 1 ? v <= hi : v < hi)).length,
    });
  }
  return buckets;
}

export function PricingSliderSection({ experimentId, config, initialResponses }: Props) {
  const { paymentType, min, max } = config;
  const mid = Math.round((min + max) / 2);
  const storageKey = `trywepp_price_${experimentId}`;

  const [value, setValue] = useState(mid);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<number[]>(initialResponses);
  const [ready, setReady] = useState(false);

  // Check localStorage on mount — if already responded, show results immediately
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      setValue(Number(saved));
      setSubmitted(true);
    }
    setReady(true);
  }, [storageKey]);

  const suffix = paymentType === "monthly" ? "/mo" : " (1회)";
  const avg = responses.length > 0
    ? Math.round(responses.reduce((a, b) => a + b, 0) / responses.length)
    : null;

  async function handleSubmit() {
    localStorage.setItem(storageKey, String(value));
    setSubmitted(true);
    setResponses(prev => [...prev, value]);

    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId,
        eventType: "price_slider_response",
        metadata: { value, paymentType },
      }),
    });
  }

  const buckets = buildBuckets(responses, min, max);
  const maxBucketCount = Math.max(...buckets.map(b => b.count), 1);
  const pct = Math.round(((value - min) / (max - min)) * 100);

  // Avoid hydration mismatch — don't render until localStorage is read
  if (!ready) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500">
          {submitted
            ? `내 응답: $${value}${suffix} · 총 ${responses.length}명 응답`
            : "슬라이더를 드래그해 얼마를 낼 의향이 있는지 알려주세요"}
        </p>
        {avg !== null && submitted && (
          <span className="text-xs text-gray-400">평균 ${avg}{suffix}</span>
        )}
      </div>

      {!submitted ? (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <p className="text-4xl font-black text-gray-900">
              ${value}
              <span className="text-base font-normal text-gray-400 ml-1">{suffix}</span>
            </p>
          </div>

          <div className="relative">
            <input
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={e => setValue(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-purple-600"
              style={{ background: `linear-gradient(to right, #9333ea ${pct}%, #e5e7eb ${pct}%)` }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>${min}</span>
              <span>${max}</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition-colors text-sm"
          >
            응답 제출
          </button>

          {responses.length > 0 && (
            <p className="text-center text-xs text-gray-400">
              {responses.length}명이 이미 응답했어요
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">
                ${value}{suffix} 응답 완료
              </p>
              {avg !== null && (
                <p className="text-xs text-purple-600 mt-0.5">
                  커뮤니티 평균: ${avg}{suffix}
                </p>
              )}
            </div>
          </div>

          {responses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                응답 분포 · {responses.length}명
              </p>
              <div className="flex items-end gap-1 h-24">
                {buckets.map((b, i) => {
                  const barPct = Math.round((b.count / maxBucketCount) * 100);
                  const bucketMin = min + i * ((max - min) / buckets.length);
                  const bucketMax = min + (i + 1) * ((max - min) / buckets.length);
                  const isUserBucket = value >= bucketMin && value < bucketMax;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                        <div
                          className={`w-full rounded-t transition-all duration-500 ${isUserBucket ? "bg-purple-600" : "bg-purple-200"}`}
                          style={{ height: `${Math.max(barPct, b.count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 whitespace-nowrap">{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
