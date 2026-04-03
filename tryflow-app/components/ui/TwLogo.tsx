// TW monogram — dark navy background, white strokes, perfectly symmetric
export function TwLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="10" fill="#0D1528" />
      {/* T crossbar */}
      <line x1="21" y1="27" x2="79" y2="27" stroke="white" strokeWidth="8.5" strokeLinecap="round" />
      {/* Stem + W (perfectly symmetric around x=50) */}
      <path
        d="M50 27 L50 49 L21 81 L50 64 L79 81"
        stroke="white"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}