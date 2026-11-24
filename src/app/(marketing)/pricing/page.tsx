import { PageHero, Section, CtaBand } from "@/components/marketing/Sections";
import { PricingCards } from "@/components/marketing/PricingCards";

export const metadata = { title: "Pricing" };

const FAQ = [
  ["How is my plan activated?", "After you pay on Selar, Selar notifies Revenue AI and the plan activates on the organisation that uses the same email address. Clicking a checkout button never activates a plan by itself."],
  ["Paid before creating an account?", "Sign up with the email you paid with, then link the payment from the Billing page using your Selar order reference."],
  ["What happens without a plan?", "You can explore Revenue AI on the Free limits: one user, 50 opportunities, 20 AI questions a month and the Deal Inspection Agent."],
  ["Are limits enforced?", "Yes. Users, opportunities, AI questions, agents and integrations are checked on the server for every request."],
];

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="Pricing" title="Plans for every stage of revenue growth" body="Choose the plan that fits your team. Every plan includes the pipeline, deal health scoring, forecasting and the AI Sales Assistant." />
      <Section><PricingCards /></Section>
      <Section tone="canvas">
        <h2 className="text-2xl font-extrabold">Questions</h2>
        <dl className="mt-6 grid gap-5 md:grid-cols-2">{FAQ.map(([q, a]) => <div key={q} className="rounded-2xl border border-line bg-white p-6"><dt className="font-bold text-ink">{q}</dt><dd className="mt-2 text-sm text-body">{a}</dd></div>)}</dl>
      </Section>
      <CtaBand />
    </>
  );
}
