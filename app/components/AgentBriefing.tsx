"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useConversation } from "@elevenlabs/react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, PhoneOff, Send, Mic } from "lucide-react";
import type { SignalPacket } from "@/lib/types";
import { buildAgentPrompt, buildFirstMessage, formatPacketAsContext } from "@/lib/agent";

interface AgentBriefingProps {
  packet: SignalPacket;
  sources?: { title: string; url: string }[];
  onRefreshPacket?: (jobInput: string) => Promise<SignalPacket | null>;
}

interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
}

const QUICK_ACTIONS = [
  { label: "Ask me an interview question", prompt: "Let's practice. Ask me a realistic interview question based on the signal packet. After I answer, tell me what worked, what to improve, and give me a stronger version." },
  { label: "How should I position myself?", prompt: "How should I position myself to stand out?" },
];

export default function AgentBriefing({
  packet,
}: AgentBriefingProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [isMuted, setIsMuted] = useState(false);
  const hasStarted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "";
  const firstMessage = useMemo(() => buildFirstMessage(packet), [packet]);
  const promptText = useMemo(() => buildAgentPrompt(formatPacketAsContext(packet)), [packet]);

  // Hook with NO props — stable across renders
  const conversation = useConversation();

  // Start session — all config + callbacks passed here (set once, not on every render)
  const handleStart = useCallback(async () => {
    if (conversation.status === "connected" || conversation.status === "connecting") return;
    try {
      await conversation.startSession({
        agentId,
        connectionType: "websocket",
        textOnly: true,
        overrides: {
          agent: {
            prompt: { prompt: promptText },
            firstMessage,
          },
        },
        onConnect: () => {
          console.log("[agent] connected");
          setHasEnded(false);
        },
        onDisconnect: () => {
          console.log("[agent] disconnected");
          setHasEnded(true);
        },
        onError: (err: unknown) => {
          console.error("[agent] error", err);
        },
        onStatusChange: (status: unknown) => {
          console.log("[agent] status", status);
        },
        onMessage: (message: { source: string; message: string }) => {
          if (message.source === "ai" && message.message) {
            setIsWaiting(false);
            setTranscript((prev) => [
              ...prev,
              { role: "agent", text: message.message },
            ]);
          }
        },
      } as Parameters<typeof conversation.startSession>[0]);
    } catch (error) {
      console.error("[agent] Failed to start:", error);
    }
  }, [agentId, promptText, firstMessage, conversation]);

  // End session cleanly
  const handleEnd = useCallback(async () => {
    await conversation.endSession();
    hasStarted.current = false;
  }, [conversation]);

  // Restart: end → clear → start fresh
  const handleRestart = useCallback(async () => {
    await conversation.endSession().catch(() => {});
    hasStarted.current = false;
    setTranscript([]);
    setIsWaiting(false);
    setHasEnded(false);
    // Brief delay for cleanup, then start fresh
    setTimeout(() => handleStart(), 200);
  }, [conversation, handleStart]);

  // Send text message
  const handleSendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || conversation.status !== "connected") return;
      setTranscript((prev) => [...prev, { role: "user", text: text.trim() }]);
      setIsWaiting(true);
      conversation.sendUserMessage(text.trim());
      setInputValue("");
    },
    [conversation]
  );

  // Toggle volume
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      conversation.setVolume({ volume: next ? 0 : 1 });
      return next;
    });
  }, [conversation]);

  // Start agent when section becomes visible
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || hasStarted.current) return;
    hasStarted.current = true;
    handleStart();
  }, [isVisible, handleStart]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, isWaiting]);

  const status = conversation.status;

  const statusText =
    status === "connecting"
      ? "Connecting..."
      : status === "connected"
        ? conversation.isSpeaking
          ? "Speaking"
          : "Advisor active"
        : hasEnded
          ? "Session ended"
          : "Waiting...";

  const statusColor =
    status === "connected"
      ? "bg-emerald-500"
      : status === "connecting"
        ? "bg-amber-500"
        : "bg-slate-500";

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="max-w-3xl mx-auto shadow-[0_0_40px_rgba(0,242,255,0.08)]"
    >
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
              {/* Text / Voice toggle */}
              <div className="flex rounded-full bg-white/5 border border-white/10 p-0.5">
                <button
                  onClick={() => setInputMode("text")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    inputMode === "text" ? "bg-white/15 text-white" : "text-white/60"
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setInputMode("voice")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    inputMode === "voice" ? "bg-white/15 text-white" : "text-white/60"
                  }`}
                >
                  Voice
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${statusColor} ${status === "connected" || status === "connecting" ? "animate-pulse" : ""}`}
                />
                <span className="text-[10px] text-slate-500 font-medium">
                  {statusText}
                </span>
              </div>
              {status === "connected" && (
                <button
                  onClick={toggleMute}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isMuted
                      ? "bg-red-500/20 border border-red-500/30"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {isMuted ? (
                    <VolumeX className="w-3 h-3 text-red-400" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              )}
              {status === "connected" && (
                <button
                  onClick={handleEnd}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-200"
                >
                  <PhoneOff className="w-3 h-3 text-red-400" />
                </button>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div
            ref={scrollRef}
            className="flex-1 h-80 overflow-y-auto px-8 py-4 space-y-4"
          >
            <AnimatePresence>
              {status !== "connected" && transcript.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-8"
                >
                  <span className="text-sm text-slate-600">
                    {status === "connecting" ? "Connecting to advisor..." : "Starting your briefing..."}
                  </span>
                </motion.div>
              )}

              {transcript.map((entry, i) => (
                <motion.div
                  key={`msg-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      entry.role === "agent"
                        ? "bg-white/5 border border-white/10 text-slate-300"
                        : "bg-prelume-neon-blue/15 border border-prelume-neon-blue/20 text-white"
                    }`}
                  >
                    {entry.text}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isWaiting && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: i * 0.2,
                          ease: "easeInOut",
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400"
                      />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">Thinking...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          {(status === "connected" || status === "connecting") && (
            <div className={`px-8 pb-3 flex flex-wrap gap-2 ${status !== "connected" ? "opacity-50 pointer-events-none" : ""}`}>
              {QUICK_ACTIONS.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 12px rgba(255,255,255,0.06)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSendMessage(action.prompt)}
                  className="px-4 py-2 rounded-full text-sm text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all duration-200"
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          )}

          {/* Text Input */}
          {inputMode === "text" && (status === "connected" || status === "connecting") && (
            <div className={`px-8 pb-6 pt-2 ${status !== "connected" ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (status === "connected") conversation.sendUserActivity();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage(inputValue);
                  }}
                  placeholder="Ask about positioning, interviews, or fit..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-prelume-neon-blue/30 transition-colors"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || status !== "connected"}
                  className="w-11 h-11 rounded-xl bg-prelume-neon-blue/20 border border-prelume-neon-blue/30 flex items-center justify-center hover:bg-prelume-neon-blue/30 transition-all duration-200 disabled:opacity-30"
                >
                  <Send className="w-4 h-4 text-prelume-neon-blue" />
                </button>
              </div>
            </div>
          )}

          {/* Voice Indicator */}
          {inputMode === "voice" && (status === "connected" || status === "connecting") && (
            <div className={`px-8 pb-6 pt-2 flex justify-center ${status !== "connected" ? "opacity-50" : ""}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${
                status === "connected" && conversation.isSpeaking
                  ? "bg-prelume-neon-blue/20 border-prelume-neon-blue/30 shadow-[0_0_20px_rgba(0,242,255,0.15)]"
                  : "bg-white/5 border-white/10"
              }`}>
                <Mic className={`w-5 h-5 ${
                  status === "connected" && conversation.isSpeaking ? "text-prelume-neon-blue" : "text-slate-400"
                }`} />
              </div>
            </div>
          )}

          {/* Ended / Restart */}
          {status === "disconnected" && hasEnded && (
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
    </motion.div>
  );
}
