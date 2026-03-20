/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  Target, 
  Play, 
  Pause, 
  Volume2, 
  ArrowRight, 
  Cpu, 
  Globe, 
  Briefcase,
  ChevronRight,
  User
} from 'lucide-react';
import { generateSignalPacket, generateAudioBriefing, SignalPacket } from './services/geminiService';

// --- Components ---

const TopBar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between glass-panel border-b-0 bg-opacity-30">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gradient-to-br from-prelume-neon-blue to-prelume-neon-purple rounded-lg flex items-center justify-center shadow-lg shadow-prelume-neon-blue/20">
        <Cpu className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-display font-bold tracking-tighter text-white">PRELUME</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        SYSTEM ACTIVE
      </div>
      <button className="w-9 h-9 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors">
        <User className="w-5 h-5 text-slate-300" />
      </button>
    </div>
  </nav>
);

const SignalModule = ({ title, icon: Icon, color, children, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="glass-panel p-6 rounded-2xl relative overflow-hidden group transition-all duration-300"
  >
    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${color}`} />
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg bg-white/5 border border-white/10 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 text-slate-200" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">{title}</h3>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </motion.div>
);

const Waveform = ({ isPlaying }: { isPlaying: boolean }) => (
  <div className="flex items-end gap-1 h-8">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        animate={isPlaying ? {
          height: [
            Math.random() * 100 + "%",
            Math.random() * 100 + "%",
            Math.random() * 100 + "%"
          ]
        } : { height: "20%" }}
        transition={{
          repeat: Infinity,
          duration: 0.5 + Math.random() * 0.5,
          ease: "easeInOut"
        }}
        className="w-1 bg-prelume-neon-blue rounded-full"
      />
    ))}
  </div>
);

// --- Main App ---

export default function App() {
  const [jobUrl, setJobUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [packet, setPacket] = useState<SignalPacket | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcriptIndex, setTranscriptIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (!jobUrl) return;
    setIsGenerating(true);
    try {
      const result = await generateSignalPacket(jobUrl);
      setPacket(result);
      const audio = await generateAudioBriefing(result.briefingText);
      setAudioUrl(audio);
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && packet) {
      const words = packet.briefingText.split('. ');
      const interval = setInterval(() => {
        setTranscriptIndex(prev => (prev < words.length - 1 ? prev + 1 : prev));
      }, 3000); // Approximate timing
      return () => clearInterval(interval);
    }
  }, [isPlaying, packet]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-prelume-neon-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-prelume-neon-purple/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <TopBar />

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!packet && !isGenerating ? (
            <motion.section
              key="hero"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center mt-20"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-white/5 text-xs font-bold tracking-widest text-prelume-neon-blue uppercase"
              >
                <Globe className="w-3 h-3" />
                Global Intelligence Network Online
              </motion.div>
              
              <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter text-white mb-6">
                Signal <span className="text-transparent bg-clip-text bg-gradient-to-r from-prelume-neon-blue to-prelume-neon-purple">Briefing</span>
              </h1>
              
              <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
                Know how to win the role before you apply. Our engine decodes hidden market signals and company intelligence to give you an unfair advantage.
              </p>

              <div className="w-full max-w-3xl glass-panel p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl neon-glow-blue border-white/10">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Paste job URL or role description..."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 py-4 pl-12 pr-4 text-white placeholder:text-slate-600 font-medium"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  className="bg-white text-black font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-prelume-neon-blue hover:text-white transition-all duration-300 group"
                >
                  Generate Signal Packet
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="mt-12 flex items-center gap-8 text-slate-600 text-sm font-medium">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Encrypted Analysis</div>
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Market Grounding</div>
                <div className="flex items-center gap-2"><Target className="w-4 h-4" /> Precision Matching</div>
              </div>
            </motion.section>
          ) : isGenerating ? (
            <motion.section
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="relative w-64 h-64 glass-panel rounded-3xl overflow-hidden flex items-center justify-center border-white/5">
                <div className="signal-scan-line" />
                <Cpu className="w-16 h-16 text-prelume-neon-blue animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-t from-prelume-neon-blue/20 to-transparent" />
              </div>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-8 text-center"
              >
                <h2 className="text-2xl font-display font-bold text-white mb-2">Decoding Signals...</h2>
                <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Analyzing Market Data • Synthesizing Strategy</p>
              </motion.div>
            </motion.section>
          ) : (
            <motion.section
              key="packet"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header Card */}
              <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border-white/10 neon-glow-purple">
                <div className="absolute top-0 right-0 p-8">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Confidence Score</span>
                    <div className="text-4xl font-display font-black text-prelume-neon-purple">
                      {packet?.confidenceScore}%
                    </div>
                  </div>
                </div>
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 rounded-full bg-prelume-neon-purple/20 border border-prelume-neon-purple/30 text-[10px] font-bold text-prelume-neon-purple uppercase tracking-widest">
                      Signal Packet Generated
                    </div>
                    <span className="text-slate-600 text-xs font-mono">{new Date().toLocaleTimeString()} UTC</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
                    {packet?.roleName}
                  </h2>
                  <p className="text-xl text-slate-400 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-prelume-neon-blue" />
                    {packet?.companyName}
                  </p>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SignalModule title="Company Signal" icon={Globe} color="from-emerald-500 to-emerald-900" delay={0.1}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hiring Urgency</span>
                    <p className="text-white font-medium">{packet?.companySignal.urgency}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Growth Indicators</span>
                    <p className="text-white font-medium">{packet?.companySignal.growth}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Events</span>
                    <ul className="space-y-2 mt-2">
                      {packet?.companySignal.events.map((e, i) => (
                        <li key={i} className="text-sm text-slate-400 flex gap-2">
                          <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SignalModule>

                <SignalModule title="Role Signal" icon={Zap} color="from-prelume-neon-blue to-blue-900" delay={0.2}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hidden Expectations</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {packet?.roleSignal.hiddenExpectations.map((e, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300">{e}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Key Traits Detected</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {packet?.roleSignal.keyTraits.map((e, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-prelume-neon-blue/10 border border-prelume-neon-blue/20 text-[10px] text-prelume-neon-blue">{e}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Skill Gaps</span>
                    <ul className="space-y-2 mt-2">
                      {packet?.roleSignal.skillGaps.map((e, i) => (
                        <li key={i} className="text-sm text-slate-400 flex gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-prelume-neon-blue mt-1.5 flex-shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SignalModule>

                <SignalModule title="Market Signal" icon={TrendingUp} color="from-prelume-neon-purple to-purple-900" delay={0.3}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Applicant Volume</span>
                    <p className="text-white font-medium">{packet?.marketSignal.applicantVolume}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Competition Level</span>
                    <p className="text-white font-medium">{packet?.marketSignal.competition}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-prelume-neon-purple/5 border border-prelume-neon-purple/10">
                    <span className="text-[10px] font-bold text-prelume-neon-purple uppercase tracking-widest">Positioning Insight</span>
                    <p className="text-sm text-slate-300 mt-1 italic">"{packet?.marketSignal.positioning}"</p>
                  </div>
                </SignalModule>
              </div>

              {/* Audio & Strategy Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                  {/* Audio Briefing Panel */}
                  <div className="glass-panel p-6 rounded-3xl border-prelume-neon-blue/20 neon-glow-blue">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-prelume-neon-blue" />
                        <h3 className="font-display font-bold text-white">AI Briefing</h3>
                      </div>
                      <Waveform isPlaying={isPlaying} />
                    </div>
                    
                    <button
                      onClick={toggleAudio}
                      disabled={!audioUrl}
                      className="w-full py-4 rounded-2xl bg-prelume-neon-blue text-white font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                      {isPlaying ? "Pause Briefing" : "Play Briefing"}
                    </button>
                    
                    {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />}
                    
                    <div className="mt-6 h-32 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-prelume-bg/80 pointer-events-none z-10" />
                      <div className="space-y-2">
                        {packet?.briefingText.split('. ').map((sentence, i) => (
                          <motion.p
                            key={i}
                            initial={{ opacity: 0.2 }}
                            animate={{ opacity: i === transcriptIndex ? 1 : i < transcriptIndex ? 0.4 : 0.2 }}
                            className={`text-sm leading-relaxed ${i === transcriptIndex ? 'text-prelume-neon-blue font-medium' : 'text-slate-500'}`}
                          >
                            {sentence}.
                          </motion.p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  {/* Strategy Panel */}
                  <div className="glass-panel p-8 rounded-3xl h-full">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Target className="w-6 h-6 text-emerald-500" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white">How You Win This Role</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {packet?.strategy.map((s, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-xs flex-shrink-0 group-hover:scale-110 transition-transform">
                            {i + 1}
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {s.split(' ').map((word, j) => (
                              <span key={j} className={word.toUpperCase() === word && word.length > 2 ? 'text-white font-bold' : ''}>
                                {word}{' '}
                              </span>
                            ))}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-12">
                <button
                  onClick={() => {
                    setPacket(null);
                    setJobUrl('');
                    setAudioUrl(null);
                    setIsPlaying(false);
                    setTranscriptIndex(-1);
                  }}
                  className="text-slate-500 hover:text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Analyze Another Role
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
