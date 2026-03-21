"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, PhoneOff, Send } from "lucide-react";
import type { SignalPacket } from "@/lib/types";
import { startAgentSession } from "@/actions/startAgent";
import { buildAgentPrompt, buildFirstMessage } from "@/lib/agent";
import { createAgentTools } from "@/lib/agentTools";

interface AgentBriefingProps {
  packet: SignalPacket;
  sources?: { title: string; url: string }[];
  onRefreshPacket?: (jobInput: string) => Promise<SignalPacket | null>;
}

type AgentState = "connecting" | "active" | "ended" | "failed";

interface TranscriptEntry {
  role: "agent" | "user";
  text: string;
}

const QUICK_ACTIONS = [
  { label: "Practice Interview", prompt: "Let's practice. Ask me a realistic interview question based on the signal packet. After I answer, tell me what worked, what to improve, and give me a stronger version." },
  { label: "Improve My Resume", prompt: "How should I improve my resume for this role?" },
  { label: "What Are My Weaknesses?", prompt: "What are my likely weaknesses for this role?" },
  { label: "How Should I Position Myself?", prompt: "How should I position myself to stand out?" },
];

export default function AgentBriefing({
  packet,
  sources,
  onRefreshPacket,
}: AgentBriefingProps) {
  const [agentState, setAgentState] = useState<AgentState>("connecting");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(-1);
  const hasStarted = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const firstMessage = buildFirstMessage(packet);
  const fallbackSentences = firstMessage.split(". ").filter((s) => s.trim());

  const conversation = useConversation({
    onConnect: () => {
      console.log("[agent] Connected");
      setAgentState("active");
    },
    onDisconnect: () => {
      console.log("[agent] Disconnected");
      setAgentState("ended");
    },
    onMessage: (message) => {
      if (message.source === "ai" && message.message) {
        setIsWaiting(false);
        setTranscript((prev) => [
          ...prev,
          { role: "agent", text: message.message },
        ]);
      }
    },
    onError: (error) => {
      console.error("[agent] Error:", error);
      setAgentState("failed");
    },
  });

  const handleStart = useCallback(async () => {
    setAgentState("connecting");
    setTranscript([]);
    setFallbackIndex(-1);
    try {
      const { signedUrl, context } = await startAgentSession(packet);
      const tools = createAgentTools(packet, {
        onRefresh: onRefreshPacket,
        sources,
      });

      await conversation.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: {
              prompt: buildAgentPrompt(context),
            },
            firstMessage,
          },
        },
        clientTools: tools,
      });
    } catch (error) {
      console.error("[agent] Failed to start:", error);
      setAgentState("failed");
    }
  }, [packet, conversation, sources, onRefreshPacket, firstMessage]);

  const handleEnd = useCallback(async () => {
    await conversation.endSession();
    setAgentState("ended");
  }, [conversation]);

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || agentState !== "active") return;
      setTranscript((prev) => [...prev, { role: "user", text: text.trim() }]);
      setIsWaiting(true);
      conversation.sendUserMessage(text.trim());
      setInputValue("");
    },
    [agentState, conversation]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      handleStart();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, fallbackIndex, isWaiting]);

  // Text fallback
  useEffect(() => {
    if (agentState !== "failed") return;
    const timer = setInterval(() => {
      setFallbackIndex((prev) => {
        if (prev >= fallbackSentences.length - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(timer);
  }, [agentState, fallbackSentences.length]);

  const statusText =
    agentState === "connecting"
      ? "Connecting..."
      : agentState === "active"
        ? conversation.isSpeaking
          ? "Speaking"
          : "Listening"
        : agentState === "failed"
          ? "Text mode"
          : "Session ended";

  const statusColor =
    agentState === "active"
      ? conversation.isSpeaking
        ? "bg-prelume-neon-blue"
        : "bg-emerald-500"
      : agentState === "connecting"
        ? "bg-amber-500"
        : "bg-slate-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className="rounded-3xl p-px bg-linear-to-br from-prelume-neon-blue/30 via-prelume-neon-purple/20 to-prelume-neon-blue/10">
        <div className="glass-panel rounded-3xl relative overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-8 pt-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-prelume-neon-blue" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Career Advisor
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${statusColor} ${agentState === "active" || agentState === "connecting" ? "animate-pulse" : ""}`}
                />
                <span className="text-[10px] text-slate-500 font-medium">
                  {statusText}
                </span>
              </div>
              {agentState === "active" && (
                <button
                  onClick={toggleMute}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isMuted
                      ? "bg-red-500/20 border border-red-500/30"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-3 h-3 text-red-400" />
                  ) : (
                    <Mic className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              )}
              {agentState === "active" && (
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
              {agentState === "connecting" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-8"
                >
                  <span className="text-sm text-slate-600">
                    Starting your briefing...
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

              {agentState === "failed" &&
                fallbackSentences.map((sentence, i) => (
                  <motion.div
                    key={`fallback-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{
                      opacity: i <= fallbackIndex ? 1 : 0,
                      y: i <= fallbackIndex ? 0 : 8,
                    }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-white/5 border border-white/10 text-slate-300">
                      {sentence.trim()}
                      {sentence.trim().endsWith(".") ? "" : "."}
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
          {agentState === "active" && (
            <div className="px-8 pb-3 flex flex-wrap gap-2">
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

          {/* Input */}
          {agentState === "active" && (
            <div className="px-8 pb-6 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage(inputValue);
                  }}
                  placeholder="Ask how to position yourself, practice interviews, or get advice..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-prelume-neon-blue/30 transition-colors"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim()}
                  className="w-11 h-11 rounded-xl bg-prelume-neon-blue/20 border border-prelume-neon-blue/30 flex items-center justify-center hover:bg-prelume-neon-blue/30 transition-all duration-200 disabled:opacity-30"
                >
                  <Send className="w-4 h-4 text-prelume-neon-blue" />
                </button>
              </div>
            </div>
          )}

          {/* Ended state */}
          {agentState === "ended" && (
            <div className="px-8 pb-6 pt-2 flex justify-center">
              <button
                onClick={handleStart}
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
