import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ChatMessage from "./components/ChatMessage";
import Header from "./components/Header";
import InputBox from "./components/InputBox";

interface LanguagePair {
  name: string;
  label: string;
  prompt: string;
}

interface Message {
  type: "user" | "assistant";
  text: string;
  id: number;
}

function App() {
  const [pairs, setPairs] = useState<LanguagePair[]>([]);
  const [currentPairIdx, setCurrentPairIdx] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(0);

  useEffect(() => {
    loadPairs();
    loadApiKey();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTranslating]);

  const createMessage = (type: Message["type"], text: string): Message => {
    const id = nextMessageId.current;
    nextMessageId.current += 1;
    return { type, text, id };
  };

  const loadPairs = async () => {
    try {
      const languagePairs = await invoke<LanguagePair[]>("get_language_pairs");
      setPairs(languagePairs);
      setCurrentPairIdx((idx) => (languagePairs[idx] ? idx : 0));
    } catch (error) {
      console.error("Failed to load language pairs:", error);
    }
  };

  const loadApiKey = async () => {
    try {
      const key = await invoke<string>("get_api_key");
      setApiKey(key);
      if (!key) setShowSettings(true);
    } catch (error) {
      console.error("Failed to load API key:", error);
    }
  };

  const handleTranslate = async (text: string) => {
    const pair = pairs[currentPairIdx];
    if (!text.trim() || isTranslating || !pair) return;

    setMessages((prev) => [...prev, createMessage("user", text)]);
    setIsTranslating(true);

    try {
      const translation = await invoke<string>("translate", {
        pairName: pair.name,
        text,
      });
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", translation),
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", `Error: ${error}`),
      ]);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveApiKey = async (key: string) => {
    try {
      await invoke("set_api_key", { key });
      setApiKey(key);
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to save API key:", error);
    }
  };

  const handleClearChat = () => setMessages([]);

  return (
    <div className="flex h-screen flex-col bg-base text-text">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onClearChat={handleClearChat}
        pairs={pairs}
        currentIdx={currentPairIdx}
        onSelectPair={setCurrentPairIdx}
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-7">
          {messages.length === 0 && !isTranslating && (
            <div className="select-none pt-16 text-center text-[13px] text-overlay0">
              Type below to translate.
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isTranslating && (
            <div className="select-none text-[11px] uppercase tracking-[0.18em] text-overlay0">
              translating…
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <InputBox
        onSubmit={handleTranslate}
        disabled={isTranslating || !apiKey}
        hasApiKey={!!apiKey}
      />

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm select-none">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-mantle p-6 shadow-2xl shadow-black/40">
            <div className="mb-4">
              <h2 className="text-[15px] font-semibold tracking-tight text-text">
                OpenRouter API Key
              </h2>
              <p className="mt-1 text-[12px] text-overlay1">
                Stored locally in your config file.
              </p>
            </div>

            <input
              type="password"
              className="mb-5 w-full select-text rounded-md border border-white/[0.08] bg-base px-3 py-2 text-[13px] text-text outline-none transition placeholder:text-overlay0 focus:border-orange/60"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-or-..."
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-md px-3 py-1.5 text-[12px] text-overlay1 transition hover:bg-white/[0.06] hover:text-text"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveApiKey(apiKey)}
                className="rounded-md bg-orange px-3 py-1.5 text-[12px] font-medium text-black transition hover:bg-orange-soft"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
