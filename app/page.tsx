"use client";

import Image from "next/image";
import { generateReport } from "@/lib/generateReport";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Zap,
  Shield,
  TrendingUp,
  Target,
  ArrowRight,
  ArrowDown,
  Globe,
  Briefcase,
  ChevronRight,
  Network,
  Volume2,
  Download,
  Share2,
} from "lucide-react";
import type { SignalPacket } from "@/lib/types";
import { analyzeRole } from "@/actions/analyze";
import CareerAdvisor from "@/app/components/CareerAdvisor";


// --- Components ---

const TopBar = ({ status }: { status: "idle" | "loading" | "complete" }) => {
  const config = {
    idle: { label: "Ready", dot: "bg-slate-400", glow: "" },
    loading: { label: "Analyzing signals...", dot: "bg-prelume-neon-blue animate-pulse", glow: "shadow-[0_0_8px_rgba(0,242,255,0.3)]" },
    complete: { label: "Analysis complete", dot: "bg-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.3)]" },
  };
  const c = config[status];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-prelume-bg">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex items-center gap-2 cursor-pointer"
      >
        <img src="/logo.png" alt="Prelume" className="w-8 h-8" />
        <span className="text-xl font-display font-bold tracking-tighter text-white">
          PRELUME
        </span>
      </button>
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8">
        <button
          onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          How it works
        </button>
        <button
          onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          About
        </button>
      </div>
      {status !== "idle" && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-400 transition-all duration-300 ${c.glow}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {c.label}
        </div>
      )}
    </nav>
  );
};

const ConfidenceMeter = ({ score }: { score: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="3"
        />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="url(#meterGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient
            id="meterGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="var(--color-prelume-neon-blue)" />
            <stop offset="100%" stopColor="var(--color-prelume-neon-purple)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-display font-black text-white">
          {score}%
        </span>
      </div>
    </div>
  );
};

const ShimmerCard = () => (
  <div className="glass-panel p-6 rounded-2xl space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg shimmer" />
      <div className="h-3 w-32 rounded shimmer" />
    </div>
    <div className="space-y-3">
      <div className="h-3 w-full rounded shimmer" />
      <div className="h-3 w-3/4 rounded shimmer" />
      <div className="h-3 w-5/6 rounded shimmer" />
    </div>
  </div>
);

interface SignalCardProps {
  title: string;
  icon: React.ElementType;
  accentColor: string;
  delay?: number;
  children: React.ReactNode;
}

const SignalCard = ({
  title,
  icon: Icon,
  accentColor,
  delay = 0,
  children,
}: SignalCardProps) => {
  const colorMap: Record<
    string,
    { border: string; iconBg: string; iconBorder: string; glow: string }
  > = {
    blue: {
      border: "from-prelume-neon-blue/30 to-transparent",
      iconBg: "bg-prelume-neon-blue/10",
      iconBorder: "border-prelume-neon-blue/20",
      glow: "group-hover:shadow-[0_0_20px_rgba(0,242,255,0.15)]",
    },
    violet: {
      border: "from-prelume-neon-purple/30 to-transparent",
      iconBg: "bg-prelume-neon-purple/10",
      iconBorder: "border-prelume-neon-purple/20",
      glow: "group-hover:shadow-[0_0_20px_rgba(188,19,254,0.15)]",
    },
    teal: {
      border: "from-emerald-500/30 to-transparent",
      iconBg: "bg-emerald-500/10",
      iconBorder: "border-emerald-500/20",
      glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    },
  };
  const c = colorMap[accentColor] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className={`glass-panel p-6 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:border-white/20 ${c.glow}`}
    >
      <div
        className={`absolute top-0 left-0 w-1 h-full bg-linear-to-b ${c.border}`}
      />
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`p-2 rounded-lg ${c.iconBg} border ${c.iconBorder} group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-5 h-5 text-slate-200" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
};

// --- Main Page ---

export default function Page() {
  const [jobUrl, setJobUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [packet, setPacket] = useState<SignalPacket | null>(null);
  const [scanPhase, setScanPhase] = useState(0);
  const [showCards, setShowCards] = useState(false);
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const packetRef = useRef<HTMLDivElement>(null);

  const scanMessages = [
    "Decoding market signals...",
    "Analyzing company intelligence...",
    "Mapping candidate positioning...",
  ];

  const handleShare = async () => {
    if (!packet) return;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalPacket: packet, sources, generatedAt }),
      });
      const { id } = await res.json();
      const url = `${window.location.origin}/signal/${id}`;
      await navigator.clipboard.writeText(url);
      setShareUrl(url);
      setTimeout(() => setShareUrl(null), 3000);
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleGenerate = async () => {
    if (!jobUrl) return;
    setIsGenerating(true);
    try {
      const isUrl = jobUrl.startsWith("http");
      const result = await analyzeRole(
        isUrl ? { jobUrl } : { jobText: jobUrl }
      );
      setPacket(result.signalPacket);
      setSources(result.sources);
      setGeneratedAt(result.generatedAt);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isGenerating) {
      setScanPhase(0);
      return;
    }
    const interval = setInterval(() => {
      setScanPhase((prev) => (prev + 1) % scanMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (packet) {
      setShowCards(false);
      const timer = setTimeout(() => setShowCards(true), 600);
      return () => clearTimeout(timer);
    }
  }, [packet]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Layer 0 — Base + animated gradient */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-prelume-bg" />
        <div className="absolute inset-0 ambient-gradient" />
      </div>

      {/* Layer 1 — Animated radial glows */}
      <motion.div className="fixed inset-0 z-1 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-prelume-neon-blue/8 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-prelume-neon-purple/8 blur-[120px] rounded-full"
        />
      </motion.div>

      {/* Layer 2 — Noise texture overlay */}
      <div className="fixed inset-0 z-2 noise-overlay pointer-events-none" />

      {/* Layer 3 — Full-screen glass + radial glow */}
      <div className="fixed inset-0 z-3 backdrop-blur-md bg-white/5 pointer-events-none" />
      <div className="fixed inset-0 z-4 radial-hero-glow pointer-events-none" />

      <TopBar status={isGenerating ? "loading" : packet ? "complete" : "idle"} />

      {/* Analyzing overlay — rendered outside main to avoid z-10 stacking context */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-16 z-20 flex flex-col items-center justify-center bg-prelume-bg"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="scan-line-full" />
            </div>

            <div className="absolute inset-0 grid-overlay pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{ scale: [0.95, 1, 0.95] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="rounded-full bg-black/30 backdrop-blur-sm p-6 mb-8 drop-shadow-[0_0_25px_rgba(0,242,255,0.3)]"
              >
                <Image src="/logo.png" alt="Prelume" width={64} height={64} className="opacity-90" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={scanPhase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="text-xl font-display font-bold text-white mb-3"
                >
                  {scanMessages[scanPhase]}
                </motion.p>
              </AnimatePresence>
              <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">
                Signal Intelligence Engine
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!packet && !isGenerating ? (
            <motion.section
              key="hero"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center mt-20"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-[#3ABEFF]/20 text-sm font-medium tracking-wide text-white/80"
              >
                Know before you apply
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-6xl md:text-8xl font-display font-bold tracking-tighter text-white mb-6"
              >
                Signal <span className="text-[#3ABEFF]">Briefing</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed"
              >
                Know how to position yourself before you apply. Prelume analyzes
                job postings, company context, and market signals to show you
                what actually matters.
              </motion.p>

              <div className="w-full max-w-3xl glass-panel p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl neon-glow-blue border-white/10 focus-within:border-blue-400/50 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.25)] transition-all duration-300">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Paste a job listing URL or description."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 py-4 pl-12 pr-4 text-white placeholder:text-slate-600 font-medium"
                  />
                </div>
                <motion.button
                  onClick={handleGenerate}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-linear-to-r from-prelume-neon-blue to-prelume-neon-purple text-[#FFFFFF] font-semibold px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(80,120,255,0.25)] hover:shadow-[0_0_35px_rgba(80,120,255,0.4)] hover:brightness-110 transition-all duration-300 group"
                >
                  Generate Signal Packet
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>

              <div className="mt-12 flex items-center gap-8 text-slate-600 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Encrypted Analysis
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Market Grounding
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" /> Precision Matching
                </div>
              </div>

              <button
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="mt-14 px-5 py-2.5 rounded-full bg-transparent border border-white/20 text-base text-white/80 font-medium flex items-center gap-2 hover:bg-white/10 hover:border-white/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                How it works
                <motion.span
                  animate={{ y: [0, 3, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowDown className="w-4 h-4" />
                </motion.span>
              </button>
            </motion.section>
          ) : packet ? (
            <motion.section
              key="packet"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-8"
            >
              <div ref={packetRef} className="space-y-8">
              {/* PDF Export Header — hidden in UI, visible during export */}
              <div className="export-header">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/logo.png" alt="Prelume" className="w-8 h-8" />
                  <span className="text-xl font-display font-bold tracking-tighter text-white">PRELUME</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Signal Packet</h2>
                <p className="text-lg text-slate-400">{packet?.roleName} at {packet?.companyName}</p>
                <p className="text-xs text-slate-500 mt-1">{generatedAt ? new Date(generatedAt).toLocaleString() : ""}</p>
              </div>

              {/* Header Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl p-px bg-linear-to-br from-prelume-neon-blue/30 via-prelume-neon-purple/20 to-transparent"
              >
                <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                          Signal Packet
                        </h2>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            Analysis Complete
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                        {generatedAt && (
                          <span>Generated just now</span>
                        )}
                        {sources.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                            {sources.length} source{sources.length !== 1 ? "s" : ""} analyzed
                          </span>
                        )}
                      </div>
                      <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                        {packet?.roleName}
                      </h3>
                      <p className="text-lg text-slate-400 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-prelume-neon-blue" />
                        {packet?.companyName}
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => packet && generateReport(packet)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3" />
                        Download PDF
                      </button>
                      <button
                        onClick={handleShare}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Share2 className="w-3 h-3" />
                        {shareUrl ? "Copied!" : "Share"}
                      </button>
                      <div className="flex flex-col items-center gap-1">
                        <ConfidenceMeter
                          score={packet?.confidenceScore ?? 0}
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Navigation */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => document.getElementById("signals-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:scale-[1.02] transition-all"
                >
                  View Signals
                </button>
                <button
                  onClick={() => document.getElementById("advisor-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-linear-to-r from-prelume-neon-blue/10 to-prelume-neon-purple/10 border border-prelume-neon-blue/20 text-white/80 hover:from-prelume-neon-blue/20 hover:to-prelume-neon-purple/20 hover:scale-[1.02] transition-all"
                >
                  Open Career Advisor
                </button>
              </div>

              {/* Your Edge */}
              {packet?.marketSignal.positioning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl p-px bg-linear-to-r from-[#3ABEFF]/40 via-prelume-neon-purple/30 to-[#3ABEFF]/20"
                >
                  <div className="glass-panel p-6 rounded-2xl text-center shadow-[0_0_30px_rgba(58,190,255,0.1)]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#3ABEFF]">
                      Your Edge
                    </span>
                    <p className="text-lg text-white mt-2 leading-relaxed">
                      {packet.marketSignal.positioning}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Signal Grid */}
              <div id="signals-section" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {!showCards ? (
                  <>
                    <ShimmerCard />
                    <ShimmerCard />
                    <ShimmerCard />
                  </>
                ) : (
                  <>
                    <SignalCard
                      title="Company Signal"
                      icon={Globe}
                      accentColor="teal"
                      delay={0.1}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Detected Pattern
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest">
                            Confidence: High
                          </span>
                        </div>
                        <p className="text-white font-medium mt-1">
                          {packet?.companySignal.urgency}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Growth Trajectory
                          </span>
                          <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">
                            Confidence: Medium
                          </span>
                        </div>
                        <p className="text-white font-medium mt-1">
                          {packet?.companySignal.growth}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Recent Events
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            {packet?.companySignal.events.length} detected
                          </span>
                        </div>
                        <ul className="space-y-2 mt-2">
                          {packet?.companySignal.events.map((e, i) => (
                            <li
                              key={i}
                              className="text-sm text-slate-400 flex gap-2"
                            >
                              <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </SignalCard>

                    <SignalCard
                      title="Role Signal"
                      icon={Zap}
                      accentColor="blue"
                      delay={0.2}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Hidden Expectations
                          </span>
                          <span className="text-[10px] font-bold text-prelume-neon-blue/70 uppercase tracking-widest">
                            Confidence: High
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {packet?.roleSignal.hiddenExpectations.map(
                            (e, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300"
                              >
                                {e}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Key Traits Detected
                          </span>
                          <span className="text-[10px] font-bold text-prelume-neon-blue/70 uppercase tracking-widest">
                            Confidence: High
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {packet?.roleSignal.keyTraits.map((e, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded bg-prelume-neon-blue/10 border border-prelume-neon-blue/20 text-[10px] text-prelume-neon-blue"
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Skill Gap Analysis
                          </span>
                          <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">
                            Confidence: Medium
                          </span>
                        </div>
                        <ul className="space-y-2 mt-2">
                          {packet?.roleSignal.skillGaps.map((e, i) => (
                            <li
                              key={i}
                              className="text-sm text-slate-400 flex gap-2"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-prelume-neon-blue mt-1.5 shrink-0" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </SignalCard>

                    <SignalCard
                      title="Market Signal"
                      icon={TrendingUp}
                      accentColor="violet"
                      delay={0.3}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Applicant Volume
                          </span>
                          <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">
                            Confidence: Medium
                          </span>
                        </div>
                        <p className="text-white font-medium mt-1">
                          {packet?.marketSignal.applicantVolume}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Competition Level
                          </span>
                          <span className="text-[10px] font-bold text-prelume-neon-purple/70 uppercase tracking-widest">
                            Confidence: High
                          </span>
                        </div>
                        <p className="text-white font-medium mt-1">
                          {packet?.marketSignal.competition}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-prelume-neon-purple/5 border border-prelume-neon-purple/10">
                        <span className="text-[10px] font-bold text-prelume-neon-purple uppercase tracking-widest">
                          Positioning Insight
                        </span>
                        <p className="text-sm text-slate-300 mt-1 italic">
                          &ldquo;{packet?.marketSignal.positioning}&rdquo;
                        </p>
                      </div>
                    </SignalCard>
                  </>
                )}
              </div>

              {/* Most Candidates vs You */}
              {packet && packet.strategy.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-panel rounded-3xl overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left — Most Candidates */}
                    <div className="p-8 border-b md:border-b-0 md:border-r border-white/10">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-red-400/80 mb-6">
                        Most Candidates Will
                      </h3>
                      <div className="space-y-3">
                        {[
                          "Focus on listing past responsibilities",
                          "Apply with a generic resume",
                          "Prepare standard interview answers",
                          "Miss the company's actual priorities",
                          "Ignore market positioning entirely",
                        ]
                          .slice(0, packet.strategy.length)
                          .map((item, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + i * 0.08 }}
                              className="flex gap-3 items-start"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400/50 mt-2 shrink-0" />
                              <p className="text-sm text-slate-500 leading-relaxed">
                                {item}
                              </p>
                            </motion.div>
                          ))}
                      </div>
                    </div>

                    {/* Right — You Should */}
                    <div className="p-8">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-[#3ABEFF] mb-6">
                        You Should
                      </h3>
                      <div className="space-y-3">
                        {packet.strategy.slice(0, 5).map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.08 }}
                            className="flex gap-3 items-start"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3ABEFF] mt-2 shrink-0" />
                            <p className="text-sm text-white leading-relaxed">
                              {item}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              </div>

              {/* Strategy Panel */}
              <div className="glass-panel p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Target className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white">
                    How You Win This Role
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packet?.strategy.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
                        {i + 1}
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {s.split(" ").map((word, j) => (
                          <span
                            key={j}
                            className={
                              word.toUpperCase() === word && word.length > 2
                                ? "text-white font-bold"
                                : ""
                            }
                          >
                            {word}{" "}
                          </span>
                        ))}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-12">
                <button
                  onClick={() => {
                    setPacket(null);
                    setJobUrl("");
                    setSources([]);
                    setGeneratedAt(null);
                  }}
                  className="text-slate-500 hover:text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Analyze Another Role
                </button>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/* AI Career Advisor — outside AnimatePresence to persist session */}
        {packet && (
          <div id="advisor-section">
            <CareerAdvisor agentId={process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ""} />
          </div>
        )}

        {!packet && !isGenerating && (
          <section id="how-it-works" className="pt-32 pb-20 max-w-5xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-white text-center mb-20">
              How It Works
            </h2>

            <div className="relative">
              <div className="hidden md:block">
                <div
                  className="pipeline-line"
                  style={{ left: "20%", width: "26%" }}
                />
                <div
                  className="pipeline-line"
                  style={{ left: "54%", width: "26%" }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ y: -6 }}
                  className="glass-panel p-6 rounded-2xl relative group transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,242,255,0.1)] md:-rotate-1"
                >
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
                    Step 01
                  </div>
                  <div className="w-10 h-10 mb-4 rounded-lg bg-prelume-neon-blue/10 border border-prelume-neon-blue/20 flex items-center justify-center">
                    <Search className="w-5 h-5 text-[#3ABEFF]" />
                  </div>
                  <h3 className="text-white font-display font-bold text-lg mb-2">
                    Paste the role
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Drop in a job URL or description. We take it from there.
                  </p>
                  <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center gap-2">
                    <Search className="w-3 h-3 text-slate-600" />
                    <div className="h-2 w-32 rounded bg-white/10" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  whileHover={{ y: -6 }}
                  className="glass-panel p-6 rounded-2xl relative group transition-all duration-300 hover:shadow-[0_0_25px_rgba(124,58,237,0.1)] md:translate-y-4"
                >
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
                    Step 02
                  </div>
                  <div className="w-10 h-10 mb-4 rounded-lg bg-prelume-neon-purple/10 border border-prelume-neon-purple/20 flex items-center justify-center">
                    <Network className="w-5 h-5 text-prelume-neon-purple" />
                  </div>
                  <h3 className="text-white font-display font-bold text-lg mb-2">
                    Analyze the signals
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    We analyze company intel, market data, and role
                    expectations.
                  </p>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-center justify-center gap-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          opacity: [0.2, 0.8, 0.2],
                          scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          delay: i * 0.3,
                          ease: "easeInOut",
                        }}
                        className="w-2 h-2 rounded-full bg-prelume-neon-purple"
                      />
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  whileHover={{ y: -6 }}
                  className="glass-panel p-6 rounded-2xl relative group transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)] md:rotate-1"
                >
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
                    Step 03
                  </div>
                  <div className="w-10 h-10 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-display font-bold text-lg mb-2">
                    Get your edge
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Receive a personalized strategy and AI briefing.
                  </p>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-end justify-center gap-0.5 h-10">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: [
                            `${20 + Math.random() * 30}%`,
                            `${50 + Math.random() * 50}%`,
                            `${20 + Math.random() * 30}%`,
                          ],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1 + Math.random(),
                          ease: "easeInOut",
                        }}
                        className="w-1 bg-emerald-500/50 rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {!packet && !isGenerating && (
          <section className="pt-32 pb-20 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              {/* Left — Copy */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-display font-bold text-white mb-8">
                  See the signal before you apply
                </h2>
                <div className="space-y-5">
                  {[
                    { icon: Shield, label: "Hiring urgency", desc: "Detect whether the role is urgent, stale, or reposted." },
                    { icon: Zap, label: "Hidden expectations", desc: "Uncover what they want but didn't write in the listing." },
                    { icon: TrendingUp, label: "Market positioning", desc: "Understand the competitive field and how to stand out." },
                    { icon: Target, label: "Personalized strategy", desc: "Get a tailored game plan for the interview." },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                      className="flex gap-4"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-[#3ABEFF]" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm mb-1">{item.label}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right — Mock Signal Cards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                {/* Company Signal Preview */}
                <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-emerald-500/30 to-transparent" />
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Company Signal</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Hiring Urgency</span>
                      <span className="text-[10px] text-emerald-400/70 font-bold">HIGH</span>
                    </div>
                    <p className="text-sm text-slate-300">Role reposted within 14 days. Active pipeline gaps detected.</p>
                  </div>
                </div>

                {/* Role Signal Preview */}
                <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-prelume-neon-blue/30 to-transparent" />
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-[#3ABEFF]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Role Signal</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Design system ownership", "Cross-team API contracts", "Performance budgeting"].map((skill, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Briefing Preview */}
                <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-prelume-neon-purple/30 to-transparent" />
                  <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="w-4 h-4 text-prelume-neon-purple" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Briefing</span>
                  </div>
                  <p className="text-sm text-slate-400 italic leading-relaxed">
                    &ldquo;You have a strong positioning angle. Lead with design system experience and ship velocity...&rdquo;
                  </p>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {!packet && !isGenerating && (
          <section className="pt-32 pb-24 max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-white mb-4">
                Your personal career briefing
              </h2>
              <p className="text-slate-400 text-lg">
                A voice-guided walkthrough of your strategy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-lg mx-auto"
            >
              <div className="rounded-3xl p-px bg-linear-to-br from-prelume-neon-blue/30 via-prelume-neon-purple/20 to-prelume-neon-blue/10">
                <div className="glass-panel p-8 rounded-3xl relative overflow-hidden shadow-[0_0_40px_rgba(0,242,255,0.08)]">
                  {/* Waveform */}
                  <div className="flex items-end justify-center gap-1 h-10 mb-8">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: [
                            `${15 + Math.random() * 25}%`,
                            `${40 + Math.random() * 50}%`,
                            `${15 + Math.random() * 25}%`,
                          ],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5 + Math.random(),
                          ease: "easeInOut",
                          delay: i * 0.08,
                        }}
                        className="w-1.5 bg-linear-to-t from-prelume-neon-blue/40 to-prelume-neon-purple/40 rounded-full"
                      />
                    ))}
                  </div>

                  {/* Play button */}
                  <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-prelume-neon-blue to-prelume-neon-purple shadow-[0_0_30px_rgba(0,242,255,0.25)] flex items-center justify-center">
                      <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-14 border-l-white ml-1" />
                    </div>
                  </div>

                  {/* Transcript preview */}
                  <div className="space-y-2 text-left">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      &ldquo;You have a strong positioning angle for this role. The team is rebuilding their frontend infrastructure...&rdquo;
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      &ldquo;Lead with design system experience. Most candidates won&apos;t address this unspoken expectation...&rdquo;
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      &ldquo;Prepare for a question about performance budgets. They care deeply about render times...&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {!packet && !isGenerating && (
          <section id="about" className="pt-24 pb-32 max-w-3xl mx-auto text-center">
            <div className="w-16 h-px mx-auto mb-12 bg-linear-to-r from-transparent via-white/20 to-transparent" />
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              About Prelume
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Prelume is a career intelligence layer for job seekers.
            </p>
            <p className="text-slate-400 leading-relaxed mb-4">
              It reads beyond the listing to surface the signals that shape
              hiring decisions: hidden expectations, company movement, and
              positioning opportunities. The result is a clearer read on the
              role and a sharper strategy for how to approach it.
            </p>
            <p className="text-slate-500 text-sm">
              Built with Firecrawl and ElevenLabs.
            </p>
          </section>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <span className="text-sm font-display font-bold text-white/60">Prelume</span>
            <p className="text-xs text-white/40 mt-1">Job search strategy, sharpened.</p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              How it works
            </button>
            <button
              onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              About
            </button>
            <span className="text-sm text-white/40">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
