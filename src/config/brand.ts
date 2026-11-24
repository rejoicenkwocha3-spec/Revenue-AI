/**
 * Brand configuration.
 *
 * BRAND_MARK selects the logo used across the website, the app and the favicon.
 * "uploaded" is the artwork supplied by the LinguaDub team (public/brand/linguadub-mark.png).
 * The six concept marks presented on the selection board are available as
 * "concept1" through "concept6". Change this one value to switch the brand mark.
 */
export type BrandMark = "uploaded" | "concept1" | "concept2" | "concept3" | "concept4" | "concept5" | "concept6";

export const BRAND_MARK: BrandMark = "uploaded";

export const BRAND = {
  name: "LinguaDub",
  tagline: "Every Voice. Every Language. Everywhere.",
  description:
    "LinguaDub transforms videos and audio into natural sounding multilingual experiences using AI powered dubbing, voice translation and intelligent localization.",
  colors: {
    navy: "#101B3F",
    blue: "#2463EB",
    purple: "#7047EB",
    lavender: "#F0EDFF",
    coral: "#FF786B",
    background: "#F7F8FC",
    white: "#FFFFFF",
  },
} as const;
