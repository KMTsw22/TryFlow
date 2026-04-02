// TW monogram logo — teal-to-purple gradient strokes
export function TwLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tw-grad" x1="0" y1="18" x2="0" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* T crossbar */}
      <line x1="22" y1="18" x2="78" y2="18" stroke="url(#tw-grad)" strokeWidth="11" strokeLinecap="round" />
      {/* Stem + W */}
      <path
        d="M50 18 L50 50 L10 95 L50 68 L82 95"
        stroke="url(#tw-grad)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}