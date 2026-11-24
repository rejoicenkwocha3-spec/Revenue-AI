import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const bars = [38, 52, 46, 61, 58, 72, 69, 84];
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10"><div className="w-full max-w-[400px]">{children}</div></div>
        <p className="text-center text-xs text-muted">© 2026 Revenue AI</p>
      </div>
      <aside className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-14">
        <p className="eyebrow relative text-[#8FA9FF]">Know Your Numbers. Predict Your Growth.</p>
        <div className="relative">
          <h2 className="max-w-md text-[2.4rem] font-extrabold leading-[1.08] text-white">Every revenue signal in one place.</h2>
          <div className="mt-10 max-w-md rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between text-xs text-[#AEB8DA]"><span>Quarter to date</span><span>Projection range shown</span></div>
            <p className="mt-2 font-display text-3xl font-extrabold text-white">$1.42M <span className="text-sm font-semibold text-[#5FD3A7]">82% of target</span></p>
            <div className="mt-5 flex h-24 items-end gap-2" aria-hidden>
              {bars.map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i > 5 ? "repeating-linear-gradient(135deg,#7865E9 0 4px,#5A48C4 4px 8px)" : "#4778F5" }} />)}
            </div>
            <p className="mt-3 text-xs text-[#AEB8DA]">Illustration: solid bars are booked revenue, striped bars are projected.</p>
          </div>
        </div>
        <p className="relative text-sm text-[#AEB8DA]">Pipeline, forecasting, deal intelligence and AI agents for revenue teams.</p>
      </aside>
    </div>
  );
}
