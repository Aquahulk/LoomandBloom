export function formatINR(amountRupees: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountRupees);
  } catch {
    return `₹${amountRupees.toFixed(2)}`;
  }
}

export function paiseToRupees(paise: number): number {
  return Math.floor(paise) / 100;
}