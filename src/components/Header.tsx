export function Header() {
  return (
    <div className="mx-auto flex w-[92%] max-w-[900px] items-center justify-between py-7">
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xl"
          aria-hidden
        >
          👑
        </span>
        <span className="text-2xl font-black tracking-tight text-blue-950">Tronito.</span>
      </div>
    </div>
  );
}
