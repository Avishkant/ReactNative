export type DenominationEntry = {
  label: string;
  unitValue: number; // in smallest unit (e.g., paise or cents)
  count: number;
};

type Currency = 'INR' | 'USD';

const DENOMS: Record<Currency, number[]> = {
  // values in smallest unit (paise for INR, cents for USD)
  INR: [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1].map(r => r * 100), // rupees->paise
  USD: [100, 50, 20, 10, 5, 2, 1].map(d => d * 100).concat([25, 10, 5, 1]), // dollars->cents
};

export function computeDenominations(
  amount: number,
  currency: Currency = 'INR',
) {
  if (!isFinite(amount) || amount < 0) return [];
  const smallest = Math.round(amount * 100); // paise or cents
  const denoms = DENOMS[currency];
  const result: DenominationEntry[] = [];
  let remaining = smallest;
  for (const unit of denoms) {
    if (remaining <= 0) break;
    const cnt = Math.floor(remaining / unit);
    if (cnt > 0) {
      const label = formatDenomLabel(unit, currency);
      result.push({ label, unitValue: unit, count: cnt });
      remaining -= cnt * unit;
    }
  }
  return result;
}

function formatDenomLabel(unit: number, currency: Currency) {
  if (currency === 'INR') {
    if (unit >= 100) {
      return `₹${unit / 100}`;
    }
    return `${unit} paise`;
  }
  // USD
  if (unit >= 100) {
    return `$${unit / 100}`;
  }
  return `${unit}¢`;
}

export default computeDenominations;
