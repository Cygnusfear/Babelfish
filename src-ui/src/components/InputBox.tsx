import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface InputBoxProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
  hasApiKey: boolean;
}

export default function InputBox({
  onSubmit,
  disabled,
  hasApiKey,
}: InputBoxProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;
    onSubmit(input);
    setInput("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <footer className="shrink-0 border-t border-white/[0.06] bg-base px-6 pb-4 pt-3">
      <div className="mx-auto max-w-2xl">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            hasApiKey
              ? "Type or paste text"
              : "Add an OpenRouter API key in Settings"
          }
          className="block max-h-72 w-full resize-none select-text overflow-y-auto bg-transparent text-[14px] leading-7 text-text placeholder:text-overlay0 focus:outline-none disabled:cursor-not-allowed"
          rows={1}
          autoFocus
        />
      </div>
    </footer>
  );
}
