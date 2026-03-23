"use client";

import { useConversation } from "@elevenlabs/react";
import { useEffect, useState, useRef } from "react";
import { Send, Volume2, PhoneOff } from "lucide-react";

interface Message {
  role: "agent" | "user";
  text: string;
}

const QUICK_ACTIONS = [
  { label: "Ask me an interview question", prompt: "Let's practice. Ask me a realistic interview question based on the signal packet. After I answer, tell me what worked, what to improve, and give me a stronger version." },
  { label: "How should I position myself?", prompt: "How should I position myself to stand out?" },
];

export default function CareerAdvisor({ agentId }: { agentId: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const hasStarted = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    textOnly: true,

    onConnect: () => {
      console.log("[agent] connected");
    },

    onDisconnect: () => {
      console.log("[agent] disconnected");
    },

    onMessage: (msg) => {
      console.log("[agent] message", msg);
      if (msg.source === "ai" && msg.message) {
        setMessages((prev) => [...prev, { role: "agent", text: msg.message }]);
        setIsSending(false);
      }
    },

    onError: (err) => {
      console.error("[agent] error", err);
      setIsSending(false);
    },
  });

  // Start session ONCE
  useEffect(() => {
    if (hasStarted.current) return;
    if (!agentId) return;

    hasStarted.current = true;

    async function start() {
      try {
        await conversation.startSession({
          agentId,
          connectionType: "websocket",
        });
      } catch (e) {
        console.error("[agent] Failed to start session", e);
        hasStarted.current = false;
      }
    }

    start();
  }, [agentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  // Send handler with lock
  async function handleSend(text?: string) {
    const value = text || input;
    if (!value.trim()) return;
    if (isSending) return;
    if (conversation.status !== "connected") {
      console.warn("[agent] Not connected, cannot send");
      return;
    }

    setIsSending(true);
    setMessages((prev) => [...prev, { role: "user", text: value.trim() }]);
    setInput("");

    try {
      conversation.sendUserMessage(value.trim());
    } catch (e) {
      console.error("[agent] Send failed", e);
      setIsSending(false);
    }
  }

  // Restart
  async function handleRestart() {
    await conversation.endSession().catch(() => {});
    hasStarted.current = false;
    setMessages([]);
    setIsSending(false);
    // Re-trigger the start effect
    setTimeout(async () => {
      hasStarted.current = true;
      try {
        await conversation.startSession({
          agentId,
          connectionType: "websocket",
        });
      } catch (e) {
        console.error("[agent] Restart failed", e);
        hasStarted.current = false;
      }
    }, 200);
  }

  const status = conversation.status;

  const statusText =
    status === "connecting"
      ? "Connecting..."
      : status === "connected"
        ? "Advisor active"
        : "Disconnected";

  const statusColor =
    status === "connected"
      ? "bg-emerald-500"
      : status === "connecting"
        ? "bg-amber-500"
        : "bg-slate-500";

  return (
    <div className="max-w-3xl mx-auto shadow-[0_0_40px_rgba(0,242,255,0.08)]">
      <div className="rounded-3xl p-px bg-linear-to-br from-prelume-neon-blue/40 via-prelume-neon-purple/30 to-prelume-neon-blue/20">
        <div className="glass-panel rounded-3xl relative overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-prelume-neon-blue" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Career Advisor
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-6">Ask anything about this role</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${statusColor} ${status !== "disconnected" ? "animate-pulse" : ""}`}
                />
                <span className="text-[10px] text-slate-500 font-medium">
                  {statusText}
                </span>
              </div>
              {status === "connected" && (
                <button
                  onClick={() => conversation.endSession()}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-200"
                >
                  <PhoneOff className="w-3 h-3 text-red-400" />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 h-80 overflow-y-auto px-8 py-4 space-y-4"
          >
            {status !== "connected" && messages.length === 0 && (
              <div className="flex justify-center py-8">
                <span className="text-sm text-slate-600">
                  {status === "connecting" ? "Connecting to advisor..." : "Starting your briefing..."}
                </span>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "agent"
                      ? "bg-white/5 border border-white/10 text-slate-300"
                      : "bg-prelume-neon-blue/15 border border-prelume-neon-blue/20 text-white"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:200ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:400ms]" />
                  <span className="text-xs text-slate-500 ml-1">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {status === "connected" && (
            <div className="px-8 pb-3 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  disabled={isSending}
                  className="px-4 py-2 rounded-full text-sm text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all duration-200 disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {status === "connected" && (
            <div className="px-8 pb-6 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Ask about this role..."
                  disabled={isSending}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-prelume-neon-blue/30 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isSending}
                  className="w-11 h-11 rounded-xl bg-prelume-neon-blue/20 border border-prelume-neon-blue/30 flex items-center justify-center hover:bg-prelume-neon-blue/30 transition-all duration-200 disabled:opacity-30"
                >
                  <Send className="w-4 h-4 text-prelume-neon-blue" />
                </button>
              </div>
            </div>
          )}

          {/* Disconnected / Restart */}
          {status === "disconnected" && hasStarted.current && (
            <div className="px-8 pb-6 pt-2 flex justify-center">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                Restart session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
