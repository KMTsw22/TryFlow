// TW monogram logo — white strokes for teal/dark backgrounds
export function TwLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* T crossbar */}
      <line x1="22" y1="18" x2="78" y2="18" stroke="white" strokeWidth="11" strokeLinecap="round" />
      {/* Stem + W */}
      <path
        d="M50 18 L50 50 L10 95 L50 68 L82 95"
        stroke="white"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}