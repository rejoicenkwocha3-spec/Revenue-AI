import type { Metadata } from "next";
import { PageHero, CtaBand } from "@/components/marketing/Sections";
import { PricingCards } from "@/components/marketing/PricingCards";
import { PLANS } from "@/config/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description: "LinguaDub plans with monthly dubbing minutes, storage, languages and team seats.",
};

const FAQ = [
  {
    q: "How is my subscription activated?",
    a: "Checkout happens securely on Selar. Your plan is activated only after Selar confirms the payment to LinguaDub. Pay with the same email address you use for your LinguaDub account so the payment is matched to your workspace.",
  },
  {
    q: "What counts as a dubbing minute?",
    a: "Each minute of source media dubbed into one language counts as one minute. A five minute video dubbed into three languages uses fifteen minutes.",
  },
  {
    q: "Which languages can I use?",
    a: "The languages shown in the app are the ones your connected transcription, translation and voice providers support. Each plan sets how many target languages one project can have.",
  },
  {
    q: "Can I clone my own voice?",
    a: "Yes. Voice cloning requires recorded and verified consent from the voice owner. Each plan includes a number of consent verified voice clones.",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple plans for every release schedule."
        body="Every plan includes transcription, translation, voice generation, synchronisation, subtitles and export. Choose the minutes, storage and team size you need."
      />
      <section className="container-ld py-16">
        <PricingCards />
      </section>

      <section className="container-ld pb-8">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Plan comparison</caption>
            <thead>
              <tr className="border-b border-line">
                <th className="p-4 font-semibold text-muted">Compare plans</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="p-4 font-display text-base font-bold text-navy">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Price", (p: (typeof PLANS)[number]) => `$${p.priceUsd} USD ${p.billingLabel}`],
                ["Dubbing minutes per month", (p: (typeof PLANS)[number]) => `${p.monthlyMinutes}`],
                ["Target languages per project", (p: (typeof PLANS)[number]) => `${p.targetLanguagesPerProject}`],
                ["Storage", (p: (typeof PLANS)[number]) => `${p.storageGb} GB`],
                ["Team seats", (p: (typeof PLANS)[number]) => `${p.seats}`],
                ["Consent verified voice clones", (p: (typeof PLANS)[number]) => `${p.voiceClones}`],
                ["Exports", (p: (typeof PLANS)[number]) => p.exports.join(", ")],
              ].map(([label, fn]) => (
                <tr key={label as string} className="border-b border-line last:border-0">
                  <th scope="row" className="p-4 font-medium text-navy">{label as string}</th>
                  {PLANS.map((p) => (
                    <td key={p.id} className="p-4">{(fn as (p: (typeof PLANS)[number]) => string)(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container-ld py-16">
        <h2 className="text-3xl font-extrabold">Questions</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-lg font-bold">{f.q}</h3>
              <p className="mt-2 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
