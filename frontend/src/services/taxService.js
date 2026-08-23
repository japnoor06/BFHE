import api from './api';
import defaultRules from '../config/tax_rules_2026_27.json';

/**
 * Client-side calculation helpers ensuring 100% responsiveness and offline support,
 * synchronized with backend rules.
 */

export const computeSlabTax = (taxableIncome, slabs) => {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  for (const slab of slabs) {
    if (taxableIncome > slab.min) {
      const taxableInSlab = slab.max !== null
        ? Math.min(taxableIncome, slab.max) - slab.min
        : taxableIncome - slab.min;
      tax += taxableInSlab * slab.rate;
    }
  }
  return tax;
};

export const computeRebate87A = (taxableIncome, baseTax, rebateConfig) => {
  if (!rebateConfig || taxableIncome <= 0 || baseTax <= 0) return 0;
  if (taxableIncome <= rebateConfig.threshold) {
    return Math.min(baseTax, rebateConfig.maxRebate);
  }
  if (rebateConfig.marginalRelief && taxableIncome > rebateConfig.threshold) {
    const excessIncome = taxableIncome - rebateConfig.threshold;
    if (baseTax > excessIncome) {
      return Math.max(0, baseTax - excessIncome);
    }
  }
  return 0;
};

export const computeSurcharge = (taxableIncome, taxAfterRebate, surchargeSlabs) => {
  if (!surchargeSlabs || surchargeSlabs.length === 0 || taxAfterRebate <= 0) return 0;
  let surchargeRate = 0;
  for (const tier of surchargeSlabs) {
    if (taxableIncome > tier.min && (tier.max === null || taxableIncome <= tier.max)) {
      surchargeRate = tier.rate;
      break;
    }
  }
  return Math.round(taxAfterRebate * surchargeRate);
};

export const calculateRegimeTaxClient = (taxableIncome, regimeType, rules = defaultRules) => {
  const regimeConfig = regimeType === 'new' ? rules.newRegime : rules.oldRegime;
  const income = Math.max(0, taxableIncome);
  const baseTax = computeSlabTax(income, regimeConfig.slabs);
  const rebate87A = computeRebate87A(income, baseTax, regimeConfig.rebate87A);
  const taxAfterRebate = Math.max(0, baseTax - rebate87A);
  const surcharge = computeSurcharge(income, taxAfterRebate, regimeConfig.surcharge);
  const taxAndSurcharge = taxAfterRebate + surcharge;
  const cess = Math.round(taxAndSurcharge * rules.cessRate);
  const totalTax = Math.round(taxAndSurcharge + cess);
  const effectiveTaxRate = income > 0 ? Number(((totalTax / income) * 100).toFixed(2)) : 0;

  return {
    taxableIncome: income,
    baseTax: Math.round(baseTax),
    rebate87A: Math.round(rebate87A),
    taxAfterRebate: Math.round(taxAfterRebate),
    surcharge,
    cess,
    totalTax,
    effectiveTaxRate
  };
};

export const calculateSalariedTaxClient = (params, rules = defaultRules) => {
  const grossSalary = Number(params.grossSalary || 0);
  const employerNPS = Number(params.employerNPS || 0);

  const raw80C = Number(params.section80C || 0);
  const raw80D = Number(params.section80D || 0);
  const raw24b = Number(params.homeLoanInterest24b || 0);
  const hraExemption = Number(params.hraExemption || 0);
  const otherDeductions = Number(params.otherDeductions || 0);

  const limits = rules.oldRegime.deductionLimits;
  const allowed80C = Math.min(raw80C, limits.section80C);
  const allowed80D = Math.min(raw80D, limits.section80D);
  const allowed24b = Math.min(raw24b, limits.section24bHomeLoanInterest);

  const totalOldDeductions =
    rules.oldRegime.standardDeduction +
    employerNPS +
    allowed80C +
    allowed80D +
    allowed24b +
    hraExemption +
    otherDeductions;

  const oldTaxableIncome = Math.max(0, grossSalary - totalOldDeductions);
  const oldRegimeResult = calculateRegimeTaxClient(oldTaxableIncome, 'old', rules);

  const totalNewDeductions = rules.newRegime.standardDeduction + employerNPS;
  const newTaxableIncome = Math.max(0, grossSalary - totalNewDeductions);
  const newRegimeResult = calculateRegimeTaxClient(newTaxableIncome, 'new', rules);

  const newNetAnnual = Math.max(0, grossSalary - newRegimeResult.totalTax);
  const oldNetAnnual = Math.max(0, grossSalary - oldRegimeResult.totalTax);
  const newNetMonthly = Math.round(newNetAnnual / 12);
  const oldNetMonthly = Math.round(oldNetAnnual / 12);

  const annualTaxDifference = oldRegimeResult.totalTax - newRegimeResult.totalTax;
  const monthlyTaxDifference = Math.round(annualTaxDifference / 12);

  let recommendedRegime = 'new';
  let recommendationMessage = '';

  if (newRegimeResult.totalTax < oldRegimeResult.totalTax) {
    recommendedRegime = 'new';
    recommendationMessage = `New Regime saves you ₹${Math.abs(monthlyTaxDifference).toLocaleString('en-IN')}/month (₹${Math.abs(annualTaxDifference).toLocaleString('en-IN')}/year) vs Old Regime.`;
  } else if (oldRegimeResult.totalTax < newRegimeResult.totalTax) {
    recommendedRegime = 'old';
    recommendationMessage = `Old Regime saves you ₹${Math.abs(monthlyTaxDifference).toLocaleString('en-IN')}/month (₹${Math.abs(annualTaxDifference).toLocaleString('en-IN')}/year) vs New Regime.`;
  } else {
    recommendedRegime = 'new';
    recommendationMessage = 'Both regimes result in the identical tax liability. New Regime is recommended for ease of filing.';
  }

  const chosenRegime = recommendedRegime === 'new' ? newRegimeResult : oldRegimeResult;
  const net_disposable_income = {
    annual: recommendedRegime === 'new' ? newNetAnnual : oldNetAnnual,
    monthly: recommendedRegime === 'new' ? newNetMonthly : oldNetMonthly,
    takeHomePercent: grossSalary > 0
      ? Number((((recommendedRegime === 'new' ? newNetAnnual : oldNetAnnual) / grossSalary) * 100).toFixed(2))
      : 0
  };

  return {
    incomeType: 'salaried',
    grossSalary,
    newRegime: {
      standardDeduction: rules.newRegime.standardDeduction,
      employerNPS,
      totalDeductions: totalNewDeductions,
      ...newRegimeResult,
      net_disposable_income: {
        annual: newNetAnnual,
        monthly: newNetMonthly
      }
    },
    oldRegime: {
      standardDeduction: rules.oldRegime.standardDeduction,
      employerNPS,
      allowed80C,
      allowed80D,
      allowed24b,
      hraExemption,
      otherDeductions,
      totalDeductions: totalOldDeductions,
      ...oldRegimeResult,
      net_disposable_income: {
        annual: oldNetAnnual,
        monthly: oldNetMonthly
      }
    },
    comparison: {
      recommendedRegime,
      recommendationMessage,
      annualSavings: Math.abs(annualTaxDifference),
      monthlySavings: Math.abs(monthlyTaxDifference),
      chosenTax: chosenRegime.totalTax
    },
    net_disposable_income,
    disclaimer: "This is an estimate for planning purposes, not tax advice. Confirm with a CA before filing. Tax rules reflect FY 2026-27 (AY 2027-28) rules as per the latest Union Budget."
  };
};

export const calculatePresumptiveTaxClient = (params, rules = defaultRules) => {
  const turnover = Number(params.turnover || 0);
  const digitalPercentage = Math.min(100, Math.max(0, Number(params.digitalPercentage || 0)));
  const businessType = (params.businessType || 'trading').toLowerCase();

  const isProfession = businessType === 'profession' || businessType === '44ada' || businessType === 'freelance';
  const schemeConfig = isProfession
    ? rules.presumptiveTaxation.section44ADA
    : rules.presumptiveTaxation.section44AD;

  const isDigitalEligible = digitalPercentage >= schemeConfig.digitalReceiptThresholdPercent;
  const applicableLimit = isDigitalEligible ? schemeConfig.enhancedLimit : schemeConfig.standardLimit;

  const isEligible = turnover <= applicableLimit;
  const warningLimit = applicableLimit * schemeConfig.warningThresholdPercent;
  const isNearLimit = turnover >= warningLimit && turnover <= applicableLimit;

  let warningMessage = null;
  if (!isEligible) {
    const formattedLimit = (applicableLimit / 10000000) >= 1
      ? `₹${(applicableLimit / 10000000).toFixed(1)} Crore`
      : `₹${(applicableLimit / 100000).toFixed(1)} Lakh`;
    warningMessage = `Your gross turnover of ₹${turnover.toLocaleString('en-IN')} exceeds the ${schemeConfig.schemeName} threshold limit of ${formattedLimit}. Presumptive taxation is not applicable; books of accounts and mandatory Tax Audit under Section 44AB are required.`;
  } else if (isNearLimit) {
    const formattedLimit = (applicableLimit / 10000000) >= 1
      ? `₹${(applicableLimit / 10000000).toFixed(1)} Crore`
      : `₹${(applicableLimit / 100000).toFixed(1)} Lakh`;
    warningMessage = `You are close to the ${formattedLimit} eligibility limit for ${schemeConfig.schemeName} (currently at ${((turnover / applicableLimit) * 100).toFixed(1)}% of threshold). Track receipts closely to avoid unexpected audit mandates.`;
  }

  let presumptiveProfit = 0;
  let digitalTurnover = 0;
  let cashTurnover = 0;

  if (isEligible) {
    if (isProfession) {
      presumptiveProfit = Math.round(turnover * schemeConfig.profitRate);
    } else {
      digitalTurnover = turnover * (digitalPercentage / 100);
      cashTurnover = turnover - digitalTurnover;
      const digitalProfit = digitalTurnover * schemeConfig.profitRateDigital;
      const cashProfit = cashTurnover * schemeConfig.profitRateCash;
      presumptiveProfit = Math.round(digitalProfit + cashProfit);
    }
  }

  const newRegimeTax = calculateRegimeTaxClient(presumptiveProfit, 'new', rules);
  const oldRegimeTax = calculateRegimeTaxClient(presumptiveProfit, 'old', rules);

  const bestTax = Math.min(newRegimeTax.totalTax, oldRegimeTax.totalTax);
  const recommendedRegime = newRegimeTax.totalTax <= oldRegimeTax.totalTax ? 'new' : 'old';

  const netAnnual = Math.max(0, turnover - bestTax);
  const netMonthly = Math.round(netAnnual / 12);
  const profitAfterTax = Math.max(0, presumptiveProfit - bestTax);

  const net_disposable_income = {
    annual: netAnnual,
    monthly: netMonthly,
    profitAfterTax,
    takeHomePercent: turnover > 0 ? Number(((netAnnual / turnover) * 100).toFixed(2)) : 0
  };

  return {
    incomeType: isProfession ? 'professional' : 'business',
    section: isProfession ? '44ADA' : '44AD',
    schemeName: schemeConfig.schemeName,
    turnover,
    digitalPercentage,
    applicableLimit,
    isEligible,
    isNearLimit,
    warningMessage,
    auditRequired: !isEligible,
    breakdown: !isProfession ? {
      digitalTurnover: Math.round(digitalTurnover),
      cashTurnover: Math.round(cashTurnover),
      digitalRate: schemeConfig.profitRateDigital,
      cashRate: schemeConfig.profitRateCash
    } : {
      profitRate: schemeConfig.profitRate
    },
    presumptiveProfit,
    newRegime: newRegimeTax,
    oldRegime: oldRegimeTax,
    recommendedRegime,
    chosenTax: bestTax,
    net_disposable_income,
    disclaimer: "This is an estimate for planning purposes, not tax advice. Confirm with a CA before filing. Tax rules reflect FY 2026-27 (AY 2027-28) rules as per the latest Union Budget."
  };
};

export const taxAPI = {
  getConfig: () => api.get('/tax/config'),
  calculate: (payload) => api.post('/tax/calculate', payload),
  getUserEstimate: () => api.get('/tax/estimate')
};
