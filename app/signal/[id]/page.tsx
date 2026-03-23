import { getPacket } from "@/lib/store";
import { notFound } from "next/navigation";
import {
  Globe,
  Zap,
  TrendingUp,
  Target,
  Briefcase,
} from "lucide-react";

export default async function SharedSignalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getPacket(id);

  if (!data) return notFound();

  const { signalPacket: p, sources, generatedAt } = data;

  return (
    <div className="min-h-screen bg-prelume-bg text-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-8">
        {/* Header */}
        <div className="rounded-3xl p-px bg-linear-to-br from-prelume-neon-blue/30 via-prelume-neon-purple/20 to-transparent">
          <div className="glass-panel p-8 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Signal Packet
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Shared via Prelume
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2 text-xs text-slate-500">
              {generatedAt && (
                <span>{new Date(generatedAt).toLocaleString()}</span>
              )}
              {sources.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {sources.length} source{sources.length !== 1 ? "s" : ""} analyzed
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
              {p.roleName}
            </h1>
            <p className="text-lg text-slate-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-prelume-neon-blue" />
              {p.companyName}
            </p>
          </div>
        </div>

        {/* Your Edge */}
        {p.marketSignal.positioning && (
          <div className="rounded-2xl p-px bg-linear-to-r from-[#3ABEFF]/40 via-prelume-neon-purple/30 to-[#3ABEFF]/20">
            <div className="glass-panel p-6 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#3ABEFF]">
                Your Edge
              </span>
              <p className="text-lg text-white mt-2 leading-relaxed">
                {p.marketSignal.positioning}
              </p>
            </div>
          </div>
        )}

        {/* Signal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Signal */}
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 rounded-lg bg-prelume-neon-blue/10 border border-prelume-neon-blue/20">
                <Globe className="w-4 h-4 text-prelume-neon-blue" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Company Signal
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Urgency</span>
                <p className="text-slate-300 text-sm mt-1">{p.companySignal.urgency}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Growth</span>
                <p className="text-slate-300 text-sm mt-1">{p.companySignal.growth}</p>
              </div>
              {p.companySignal.events.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Events</span>
                  <ul className="mt-1 space-y-1">
                    {p.companySignal.events.map((e, i) => (
                      <li key={i} className="text-slate-300 text-sm">• {e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Role Signal */}
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Role Signal
              </h3>
            </div>
            <div className="space-y-4">
              {p.roleSignal.hiddenExpectations.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Hidden Expectations</span>
                  <ul className="mt-1 space-y-1">
                    {p.roleSignal.hiddenExpectations.map((e, i) => (
                      <li key={i} className="text-slate-300 text-sm">• {e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {p.roleSignal.keyTraits.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Key Traits</span>
                  <ul className="mt-1 space-y-1">
                    {p.roleSignal.keyTraits.map((e, i) => (
                      <li key={i} className="text-slate-300 text-sm">• {e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Market Signal */}
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Market Signal
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Applicant Volume</span>
                <p className="text-slate-300 text-sm mt-1">{p.marketSignal.applicantVolume}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Competition</span>
                <p className="text-slate-300 text-sm mt-1">{p.marketSignal.competition}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy */}
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
            {p.strategy.map((s, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <p className="text-slate-300 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8">
          <p className="text-slate-600 text-xs">
            Generated by <span className="text-slate-400 font-medium">Prelume</span>
          </p>
        </div>
      </div>
    </div>
  );
}
