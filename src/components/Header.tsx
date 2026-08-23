export function Header() {
  return (
    <div className="flex items-center justify-center gap-2 pt-8 pb-2">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xl"
        aria-hidden
      >
        👑
      </span>
      <span className="text-2xl font-black tracking-tight text-blue-950">Tronito.</span>
    </div>
  );
}
