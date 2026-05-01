exports.calculatePricing = ({ amount, pricingMode, markupPercent, fixedFee }) => {
  if (pricingMode === 'fixed') {
    return { costToUser: amount + fixedFee, profitAmount: fixedFee, profitMode: 'fixed', profitValue: fixedFee };
  }
  const profitAmount = Math.ceil(amount * (markupPercent / 100));
  return { costToUser: amount + profitAmount, profitAmount, profitMode: 'percent', profitValue: markupPercent };
};
