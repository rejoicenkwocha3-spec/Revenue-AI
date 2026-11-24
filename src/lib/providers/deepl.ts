import { providerFetch } from "./http";
import type { TranslationProvider } from "./types";

const ID = "deepl";
const SOURCE = ["en","es","fr","de","pt","ar","zh","ja","ko","it","nl","tr","pl","ru","id"];
const TARGET_CODES: Record<string, string> = {
  en: "EN-US", es: "ES", fr: "FR", de: "DE", pt: "PT-BR", ar: "AR", zh: "ZH-HANS", ja: "JA",
  ko: "KO", it: "IT", nl: "NL", tr: "TR", pl: "PL", ru: "RU", id: "ID",
};

function base() {
  const k = process.env.DEEPL_API_KEY ?? "";
  return k.endsWith(":fx") ? "https://api-free.deepl.com/v2" : "https://api.deepl.com/v2";
}

export const deepL: TranslationProvider = {
  id: ID,
  name: "DeepL",
  sourceLanguages: SOURCE,
  targetLanguages: Object.keys(TARGET_CODES),
  async translate({ texts, source, target, context }) {
    if (texts.length === 0) return [];
    const res = await providerFetch(ID, `${base()}/translate`, {
      method: "POST",
      headers: { authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        text: texts,
        target_lang: TARGET_CODES[target],
        ...(source && SOURCE.includes(source) ? { source_lang: source.toUpperCase() } : {}),
        ...(context ? { context } : {}),
        preserve_formatting: true,
      }),
    });
    const data = (await res.json()) as { translations: { text: string }[] };
    return data.translations.map((t) => t.text);
  },
};
