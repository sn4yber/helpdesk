import type { AstroCookies } from 'astro';
import { cookieOptions } from './auth';

const FLASH_COOKIE = 'flash';

export type Flash = {
  errors?: string[];
  fields?: Record<string, string>;
  success?: string;
};

export function setFlash(cookies: AstroCookies, flash: Flash) {
  cookies.set(FLASH_COOKIE, flash, cookieOptions(120));
}

export function readFlash(cookies: AstroCookies): Flash | null {
  const cookie = cookies.get(FLASH_COOKIE);
  if (!cookie) return null;
  cookies.delete(FLASH_COOKIE, { path: '/' });
  try {
    const data = cookie.json() as Flash;
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}
