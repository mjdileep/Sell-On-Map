export function slugify(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}


export function toBase36(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n, 10) : Math.floor(n || 0);
  if (!Number.isFinite(num) || num <= 0) return '0';
  return num.toString(36);
}

export function computeShortCode(userId: string, createdAt: Date): string {
  try {
    const ts = Math.floor((createdAt?.getTime?.() || Date.now()) / 1000);
    const ts36 = toBase36(ts);
    let hash = 0 >>> 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    }
    const user36 = (hash >>> 0).toString(36);
    return `${user36}-${ts36}`;
  } catch {
    const ts36 = toBase36(Math.floor(Date.now() / 1000));
    return `u-${ts36}`;
  }
}

