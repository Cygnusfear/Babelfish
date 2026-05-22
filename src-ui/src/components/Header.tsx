interface LanguagePair {
  name: string;
  label: string;
  prompt: string;
}

interface HeaderProps {
  onSettingsClick: () => void;
  onClearChat: () => void;
  pairs: LanguagePair[];
  currentIdx: number;
  onSelectPair: (idx: number) => void;
}

export default function Header({
  onSettingsClick,
  onClearChat,
  pairs,
  currentIdx,
  onSelectPair,
}: HeaderProps) {
  return (
    <header
      data-tauri-drag-region
      className="flex h-11 shrink-0 select-none items-center justify-between gap-4 border-b border-white/[0.06] px-3"
    >
      <div
        data-tauri-drag-region
        className="flex flex-1 items-center gap-1"
      >
        {pairs.map((pair, idx) => (
          <button
            key={pair.name}
            onClick={() => onSelectPair(idx)}
            className={`rounded-md px-2 py-1 text-[12px] tracking-tight transition ${
              idx === currentIdx
                ? "bg-white/[0.07] text-text"
                : "text-overlay1 hover:text-text"
            }`}
          >
            {pair.label}
          </button>
        ))}
      </div>

      <div data-tauri-drag-region className="flex items-center gap-1">
        <button
          onClick={onClearChat}
          title="Clear conversation"
          className="rounded-md px-2 py-1 text-[12px] text-overlay1 transition hover:bg-white/[0.06] hover:text-text"
        >
          Clear
        </button>
        <button
          onClick={onSettingsClick}
          title="Settings"
          className="rounded-md px-2 py-1 text-[12px] text-overlay1 transition hover:bg-white/[0.06] hover:text-text"
        >
          Settings
        </button>
      </div>
    </header>
  );
}
