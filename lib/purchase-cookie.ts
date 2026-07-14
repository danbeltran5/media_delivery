export function purchaseCookieName(videoId: string) {
  return `dl_${videoId}`;
}

export const PURCHASE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
