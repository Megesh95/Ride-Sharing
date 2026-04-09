export function calculateFare(input: {
  durationSeconds: number;
  ratePerMinute: number;
  baseFare: number;
}) {
  const minutes = Math.max(0, Math.ceil(input.durationSeconds / 60));
  const fare = input.baseFare + minutes * input.ratePerMinute;
  return Math.round(fare * 100) / 100;
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function formatCurrency(amount: unknown) {
  // MySQL DECIMAL can arrive as string; normalize safely.
  const n = toFiniteNumber(amount);
  return `$${n.toFixed(2)}`;
}

