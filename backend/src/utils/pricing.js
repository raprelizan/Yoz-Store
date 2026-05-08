const roundMoney = (value) => Math.ceil(Number(value || 0));

exports.calculatePricing = ({ amount, pricingMode = 'percent', markupPercent = 0, fixedFee = 0 }) => {
  const baseAmount = Number(amount);
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  if (pricingMode === 'fixed') {
    const profitAmount = roundMoney(fixedFee);
    return {
      amount: baseAmount,
      costToUser: roundMoney(baseAmount + profitAmount),
      profitAmount,
      profitMode: 'fixed',
      profitValue: profitAmount
    };
  }

  const percent = Number(markupPercent || 0);
  const profitAmount = roundMoney(baseAmount * (percent / 100));
  return {
    amount: baseAmount,
    costToUser: roundMoney(baseAmount + profitAmount),
    profitAmount,
    profitMode: 'percent',
    profitValue: percent
  };
};
