const intFmt = new Intl.NumberFormat('en-US')

export const int = (n: number): string => intFmt.format(Math.round(n))

/** 0.8490 -> "84.9%" */
export const pct = (x: number, digits = 1): string => `${(x * 100).toFixed(digits)}%`

/** 0.76394 -> "0.764" */
export const dec = (x: number, digits = 3): string => x.toFixed(digits)

/** Signed difference, e.g. +0.039 or −0.004 (true minus sign). */
export const signed = (x: number, digits = 3): string => {
  const s = Math.abs(x).toFixed(digits)
  if (Number(s) === 0) return `±${s}`
  return x > 0 ? `+${s}` : `−${s}`
}

/** Thresholds always print with two decimals. */
export const thr = (t: number): string => t.toFixed(2)
