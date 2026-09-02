/**
 * Formats an amount given in a currency's *minor* unit (cents for EUR/USD, but
 * 0-decimal for JPY/KRW, 3-decimal for BHD/KWD…) as a localized currency string.
 * `Intl.NumberFormat` already knows each currency's fraction digits, so we only
 * need to scale the integer minor-unit amount down by that many decimals.
 *
 * Falls back to a plain `"<amount> <CURRENCY>"` string if `Intl` throws on an
 * unknown currency code (never in practice for a validated 3-letter ISO code).
 */
export function formatMoney(minorUnitAmount: number, currency: string, locale?: string): string {
  const code = currency.toUpperCase()
  try {
    const fmt = new Intl.NumberFormat(locale, { style: "currency", currency: code })
    const fractionDigits = fmt.resolvedOptions().maximumFractionDigits ?? 2
    return fmt.format(minorUnitAmount / 10 ** fractionDigits)
  } catch {
    return `${minorUnitAmount} ${code}`
  }
}
