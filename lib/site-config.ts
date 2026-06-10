/** PLACEHOLDER — заменить на реальный телефон (или NEXT_PUBLIC_SITE_PHONE в .env) */
const DEFAULT_PHONE = "+78120000000"
const DEFAULT_PHONE_DISPLAY = "+7 (812) 000-00-00"

/** PLACEHOLDER — заменить на реальный email (или NEXT_PUBLIC_SITE_EMAIL в .env) */
const DEFAULT_EMAIL = "hello@pelikan-storage.ru"

/** Адрес совпадает с location-section и договором */
export const SITE_ADDRESS = "Мытнинская наб., 5/7, Санкт-Петербург"

export function getSitePhone(): string {
  return process.env.NEXT_PUBLIC_SITE_PHONE?.trim() || DEFAULT_PHONE
}

export function getSitePhoneDisplay(): string {
  return process.env.NEXT_PUBLIC_SITE_PHONE_DISPLAY?.trim() || DEFAULT_PHONE_DISPLAY
}

export function getSiteEmail(): string {
  return process.env.NEXT_PUBLIC_SITE_EMAIL?.trim() || DEFAULT_EMAIL
}
