import { Logo } from "@/components/brand/Logo";
import { Waveform } from "@/components/ui/Waveform";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
        <p className="text-center text-xs text-muted">© 2026 LinguaDub</p>
      </div>
      <aside className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="pointer-events-none absolute -right-28 -top-28 h-[420px] w-[420px] rounded-full border-[40px] border-purple/20" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[380px] w-[380px] rounded-full border-[36px] border-blue/15" />
        <p className="eyebrow relative text-[#B9A6FF]">Every Voice. Every Language. Everywhere.</p>
        <div className="relative">
          <h2 className="max-w-md text-[2.4rem] font-extrabold leading-[1.08] text-white">Your content, ready for every audience.</h2>
          <div className="mt-10 max-w-md rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between text-xs text-[#AEB6D6]">
              <span>Speaker 1 · Friendly</span>
              <span className="font-mono">0:12.480</span>
            </div>
            <p className="mt-3 text-sm text-[#AEB6D6]">Welcome back to the channel.</p>
            <p className="mt-1 text-white">Bienvenue à nouveau sur la chaîne.</p>
            <Waveform bars={54} seed={9} height={34} color="#33407A" progress={0.58} activeColor="#9B7FFF" className="mt-4" />
          </div>
        </div>
        <p className="relative text-sm text-[#AEB6D6]">Transcription, translation, voices and subtitles in one workspace.</p>
      </aside>
    </div>
  );
}
