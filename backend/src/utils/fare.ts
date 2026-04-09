export function calculateFare(input: {
  durationSeconds: number;
  ratePerMinute: number;
  baseFare: number;
}) {
  const minutes = Math.max(0, Math.ceil(input.durationSeconds / 60));
  const fare = input.baseFare + minutes * input.ratePerMinute;
  // Keep currency stable (2 decimals) without introducing floating point noise into DB.
  return Math.round(fare * 100) / 100;
}

