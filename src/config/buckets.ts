/**
 * LinguaDub keeps its files in buckets prefixed "linguadub-" so it can share a Supabase
 * project with other applications without touching their storage. Code and database rows
 * use the short logical names (media, generated, exports, voice-samples).
 */
export const BUCKET_PREFIX = "linguadub-";
export function bucketName(logical: string): string {
  return logical.startsWith(BUCKET_PREFIX) ? logical : `${BUCKET_PREFIX}${logical}`;
}
