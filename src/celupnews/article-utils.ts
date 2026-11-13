export function preservePublishedAt<T>(existingPublishedAt: T | null | undefined, nextStatus: string, now: T): T | null {
  if (existingPublishedAt) return existingPublishedAt;
  return nextStatus === "published" ? now : null;
}
