import "server-only";
import { promises as fs } from "node:fs";
import { createAdminClient } from "@/lib/supabase/admin";

export const BUCKETS = { media: "media", generated: "generated", exports: "exports", voiceSamples: "voice-samples" } as const;

export async function downloadToFile(bucket: string, objectPath: string, dest: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).download(objectPath);
  if (error || !data) throw new Error(`Could not download ${objectPath}: ${error?.message ?? "missing"}`);
  await fs.writeFile(dest, Buffer.from(await data.arrayBuffer()));
}

export async function downloadBuffer(bucket: string, objectPath: string): Promise<Buffer> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).download(objectPath);
  if (error || !data) throw new Error(`Could not download ${objectPath}: ${error?.message ?? "missing"}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function uploadBuffer(bucket: string, objectPath: string, body: Buffer, contentType: string) {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).upload(objectPath, body, { contentType, upsert: true });
  if (error) throw new Error(`Could not store ${objectPath}: ${error.message}`);
}

export async function uploadFile(bucket: string, objectPath: string, file: string, contentType: string) {
  return uploadBuffer(bucket, objectPath, await fs.readFile(file), contentType);
}

export async function signedUrl(bucket: string, objectPath: string, expiresIn = 600, download?: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(objectPath, expiresIn, download ? { download } : undefined);
  if (error || !data) throw new Error(`Could not sign ${objectPath}: ${error?.message ?? "missing"}`);
  return data.signedUrl;
}

export async function removeObjects(bucket: string, paths: string[]) {
  if (paths.length === 0) return;
  const admin = createAdminClient();
  await admin.storage.from(bucket).remove(paths);
}

/** Recursively lists and removes everything under a prefix. */
export async function removePrefix(bucket: string, prefix: string) {
  const admin = createAdminClient();
  const walk = async (p: string): Promise<string[]> => {
    const { data } = await admin.storage.from(bucket).list(p, { limit: 1000 });
    const out: string[] = [];
    for (const item of data ?? []) {
      const full = `${p}/${item.name}`;
      if (item.id) out.push(full);
      else out.push(...(await walk(full)));
    }
    return out;
  };
  const files = await walk(prefix);
  for (let i = 0; i < files.length; i += 100) await admin.storage.from(bucket).remove(files.slice(i, i + 100));
}
