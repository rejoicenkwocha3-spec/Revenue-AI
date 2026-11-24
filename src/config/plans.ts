/**
 * Subscription plans.
 *
 * Checkout links are connected in the exact order supplied: card 1 uses the first
 * Selar link, card 2 the second and card 3 the third.
 *
 * IMPORTANT: The plan names, prices and billing frequencies below come from the
 * repository README that existed before LinguaDub was built. The Selar pages could
 * not be reached from the build environment, so confirm these values against the
 * live Selar products and edit them here. Every page and every limit reads from
 * this file.
 *
 * The usage limits (minutes, storage, languages, seats) are LinguaDub product
 * settings enforced by the backend. Adjust them to match what you sell.
 */
export type PlanId = "plan_47" | "plan_57" | "plan_97";

export interface Plan {
  id: PlanId;
  /** Selar product slug, used to match payment notifications to a plan. */
  selarSlug: string;
  checkoutUrl: string;
  name: string;
  priceUsd: number;
  billing: "month" | "year" | "one_time";
  billingLabel: string;
  summary: string;
  monthlyMinutes: number;
  storageGb: number;
  targetLanguagesPerProject: number;
  seats: number;
  voiceClones: number;
  exports: string[];
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "plan_47",
    selarSlug: "47plan",
    checkoutUrl: "https://selar.com/47plan?currency=USD",
    name: "Starter",
    priceUsd: 47,
    billing: "month",
    billingLabel: "per month",
    summary: "For creators publishing their first multilingual videos.",
    monthlyMinutes: 60,
    storageGb: 10,
    targetLanguagesPerProject: 3,
    seats: 1,
    voiceClones: 1,
    exports: ["MP4 video", "MP3 and WAV audio", "SRT and VTT subtitles"],
    features: [
      "AI transcription and translation",
      "Full multilingual voice library",
      "Emotion and speed controls",
      "Subtitle editor",
    ],
  },
  {
    id: "plan_57",
    selarSlug: "57plan",
    checkoutUrl: "https://selar.com/57plan?currency=USD",
    name: "Growth",
    priceUsd: 57,
    billing: "month",
    billingLabel: "per month",
    summary: "For teams localizing content every week.",
    monthlyMinutes: 180,
    storageGb: 50,
    targetLanguagesPerProject: 8,
    seats: 5,
    voiceClones: 5,
    exports: ["MP4 with embedded subtitles", "MP3 and WAV audio", "SRT and VTT subtitles"],
    features: [
      "Everything in Starter",
      "Speaker identification and multi voice dubbing",
      "Team review and approvals",
      "Consent verified voice cloning",
    ],
    highlighted: true,
  },
  {
    id: "plan_97",
    selarSlug: "97plan",
    checkoutUrl: "https://selar.com/97plan?currency=USD",
    name: "Scale",
    priceUsd: 97,
    billing: "month",
    billingLabel: "per month",
    summary: "For studios and businesses with a global audience.",
    monthlyMinutes: 500,
    storageGb: 200,
    targetLanguagesPerProject: 20,
    seats: 15,
    voiceClones: 20,
    exports: ["MP4 with embedded subtitles", "MP3 and WAV audio", "SRT and VTT subtitles"],
    features: [
      "Everything in Growth",
      "All supported target languages per project",
      "Priority processing queue",
      "Six collaboration roles",
    ],
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function planFromSelarText(text: string): Plan | undefined {
  const lower = text.toLowerCase();
  return PLANS.find((p) => lower.includes(p.selarSlug));
}

/**
 * Minutes granted to workspaces with no active subscription. Defaults to 0 so
 * processing requires a verified payment. Set TRIAL_MINUTES to allow a trial.
 */
export function trialMinutes(): number {
  const n = Number(process.env.TRIAL_MINUTES ?? "0");
  return Number.isFinite(n) && n > 0 ? n : 0;
}
export const TRIAL_STORAGE_GB = 2;
