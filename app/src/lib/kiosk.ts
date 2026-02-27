const COOKIE_NAME = 'spoolmansync-kiosk';

export function isKioskMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${COOKIE_NAME}=true`);
}

export function enableKioskMode(): void {
  document.cookie = `${COOKIE_NAME}=true; path=/; max-age=31536000; SameSite=Lax`;
}

export function disableKioskMode(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
