// Test loader: resolves the "@/..." path alias and extensionless TypeScript imports for node --test.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
export async function resolve(specifier, context, next) {
  let target = null;
  if (specifier.startsWith("@/")) target = path.join(root, specifier.slice(2));
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  if (target && !path.extname(target)) {
    for (const ext of [".ts", ".tsx", "/index.ts"]) if (existsSync(target + ext)) return next(pathToFileURL(target + ext).href, context);
  }
  if (target && existsSync(target)) return next(pathToFileURL(target).href, context);
  return next(specifier, context);
}
