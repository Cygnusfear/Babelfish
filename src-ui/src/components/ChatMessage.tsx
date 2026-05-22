import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

interface Message {
  type: "user" | "assistant";
  text: string;
  id: number;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.type === "user";

  const handleCopy = async () => {
    if (window.getSelection()?.toString()) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const label = copied ? "copied" : isUser ? "source" : "translation";
  const labelTone = isUser
    ? copied
      ? "text-green/85"
      : "text-overlay0"
    : copied
      ? "text-green/85"
      : "text-orange/85";

  return (
    <section className="space-y-1.5">
      <div
        className={`select-none text-[10px] uppercase tracking-[0.18em] transition ${labelTone}`}
      >
        {label}
      </div>
      {isUser ? (
        <div
          onClick={handleCopy}
          title="Click to copy"
          className="select-text whitespace-pre-wrap break-words text-[14px] leading-7 text-overlay2"
        >
          {message.text}
        </div>
      ) : (
        <div
          onClick={handleCopy}
          title="Click to copy"
          className="markdown-body select-text text-[16px] leading-8 text-text"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.text}
          </ReactMarkdown>
        </div>
      )}
    </section>
  );
}
