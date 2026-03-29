"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WaitlistFormProps {
  experimentId: string;
  ctaText?: string;
}

export function WaitlistForm({
  experimentId,
  ctaText = "Join Waitlist",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, experimentId }),
    });

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-6 py-4">
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
        <p className="text-green-700 font-medium">
          You&apos;re on the list! We&apos;ll notify you at launch.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-3 max-w-md"
      data-testid="waitlist-form"
    >
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 h-12"
        data-testid="waitlist-email-input"
      />
      <Button
        type="submit"
        size="lg"
        disabled={loading}
        data-testid="waitlist-submit-btn"
        data-event="waitlist_submit"
        className="gap-2 shrink-0"
      >
        {ctaText}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}
