export interface InterimPayment {
  date: string; // ISO date
  amount: number; // payment amount (positive reduces outstanding principal)
}

export function simpleInterest(
  principal: number,
  ratePercent: number,
  timeMonths: number,
  opts?: { rateIsAnnual?: boolean },
) {
  // If rateIsAnnual is true, ratePercent is per annum. Convert months to years.
  const years = opts?.rateIsAnnual ? timeMonths / 12 : timeMonths / 1;
  const R = ratePercent / 100;
  const interest = principal * R * years;
  return interest;
}

// Compute simple interest using exact days between dates or periods expressed in days.
export function simpleInterestFromDays(
  principal: number,
  ratePercent: number,
  days: number,
  opts?: { rateIsAnnual?: boolean },
) {
  const years = opts?.rateIsAnnual ? days / 365 : days / 1;
  const R = ratePercent / 100;
  return principal * R * years;
}

export function compoundInterest(
  principal: number,
  ratePercent: number,
  timeYears: number,
  compoundsPerYear = 1,
) {
  const r = ratePercent / 100;
  const n = compoundsPerYear;
  const amount = principal * Math.pow(1 + r / n, n * timeYears);
  const interest = amount - principal;
  return interest;
}

// Calculate simple interest with interim payments. payments reduce principal on the payment date.
export function simpleInterestWithInterim(
  principal: number,
  ratePercent: number,
  startDateISO: string,
  endDateISO: string,
  payments: InterimPayment[] = [],
  rateIsAnnual = true,
) {
  const start = new Date(startDateISO);
  const end = new Date(endDateISO);
  const sorted = payments
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let currentPrincipal = principal;
  let lastDate = start;
  let totalInterest = 0;

  for (const p of sorted) {
    const payDate = new Date(p.date);
    if (payDate <= lastDate) {
      currentPrincipal -= p.amount;
      continue;
    }
    const days = dayDiff(lastDate, payDate);
    const interest = simpleInterestFromDays(
      currentPrincipal,
      ratePercent,
      days,
      { rateIsAnnual },
    );
    totalInterest += interest;
    currentPrincipal -= p.amount;
    lastDate = payDate;
  }

  if (end > lastDate) {
    const days = dayDiff(lastDate, end);
    totalInterest += simpleInterestFromDays(
      currentPrincipal,
      ratePercent,
      days,
      {
        rateIsAnnual,
      },
    );
  }

  return totalInterest;
}

// Compound interest that can exempt last incomplete year/months (compound exemption).
export function compoundWithExemption(
  principal: number,
  ratePercent: number,
  startDateISO: string,
  endDateISO: string,
  compoundsPerYear = 1,
  exemptLastPartialYear = false,
) {
  const start = new Date(startDateISO);
  const end = new Date(endDateISO);
  const totalDays = dayDiff(start, end);
  const totalYears = totalDays / 365;

  if (!exemptLastPartialYear) {
    return compoundInterest(
      principal,
      ratePercent,
      totalYears,
      compoundsPerYear,
    );
  }

  const wholeYears = Math.floor(totalYears);
  const remainderDays = Math.max(0, totalDays - wholeYears * 365);

  const interestWhole = compoundInterest(
    principal,
    ratePercent,
    wholeYears,
    compoundsPerYear,
  );
  const principalAfterWhole = principal + interestWhole;
  const interestPartial = simpleInterestFromDays(
    principalAfterWhole,
    ratePercent,
    remainderDays,
    { rateIsAnnual: true },
  );
  return interestWhole + interestPartial;
}

// legacy monthDiff removed: calculations now use exact days via `dayDiff`.

function dayDiff(d1: Date, d2: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = (d2.getTime() - d1.getTime()) / msPerDay;
  return Math.max(0, diff);
}
