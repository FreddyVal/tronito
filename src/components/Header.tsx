export function Header() {
  return (
    <div className="mb-6 flex items-center gap-2">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1a3a6b"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M2 19h20M3 9l4 4 5-8 5 8 4-4 1 10H2L3 9z" />
      </svg>
      <span className="text-3xl font-extrabold tracking-tight text-[#1a3a6b]">
        tronito<span className="text-[#2a5fc4]">.</span>
      </span>
    </div>
  );
}
