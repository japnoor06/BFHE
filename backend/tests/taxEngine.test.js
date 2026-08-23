const {
  defaultTaxRules,
  computeSlabTax,
  computeRebate87A,
  computeSurcharge,
  calculateRegimeTax,
  calculateSalariedTax,
  calculatePresumptiveTax,
  calculateMixedTax
} = require('../src/services/taxEngine');

describe('Tax Engine - FY 2026-27 Config & Calculation Rules', () => {

  test('Config contains required FY 2026-27 slabs, rebate, and presumptive limits', () => {
    expect(defaultTaxRules.financialYear).toBe('2026-27');
    expect(defaultTaxRules.cessRate).toBe(0.04);
    expect(defaultTaxRules.newRegime.standardDeduction).toBe(75000);
    expect(defaultTaxRules.oldRegime.standardDeduction).toBe(50000);
    expect(defaultTaxRules.newRegime.rebate87A.threshold).toBe(1200000);
    expect(defaultTaxRules.presumptiveTaxation.section44AD.standardLimit).toBe(20000000);
    expect(defaultTaxRules.presumptiveTaxation.section44AD.enhancedLimit).toBe(30000000);
    expect(defaultTaxRules.presumptiveTaxation.section44ADA.standardLimit).toBe(5000000);
    expect(defaultTaxRules.presumptiveTaxation.section44ADA.enhancedLimit).toBe(7500000);
  });

  // Test Case 1: Salaried user better off under New Regime
  test('Case 1: Salaried user with low deductions is better off under New Regime', () => {
    const result = calculateSalariedTax({
      grossSalary: 1500000,
      section80C: 20000,
      section80D: 10000
    });

    expect(result.incomeType).toBe('salaried');
    expect(result.comparison.recommendedRegime).toBe('new');
    expect(result.newRegime.totalTax).toBeLessThan(result.oldRegime.totalTax);
    expect(result.net_disposable_income.annual).toBe(1500000 - result.newRegime.totalTax);
    expect(result.net_disposable_income.monthly).toBe(Math.round(result.net_disposable_income.annual / 12));
    expect(result.comparison.recommendationMessage).toContain('New Regime saves');
  });

  // Test Case 2: Salaried user better off under Old Regime (high deductions)
  test('Case 2: Salaried user with high 80C + 80D + HRA + Home Loan is better off under Old Regime', () => {
    const result = calculateSalariedTax({
      grossSalary: 1500000,
      section80C: 150000,
      section80D: 50000,
      hraExemption: 250000,
      homeLoanInterest24b: 200000
    });

    expect(result.incomeType).toBe('salaried');
    expect(result.comparison.recommendedRegime).toBe('old');
    expect(result.oldRegime.totalTax).toBeLessThan(result.newRegime.totalTax);
    expect(result.net_disposable_income.annual).toBe(1500000 - result.oldRegime.totalTax);
    expect(result.net_disposable_income.monthly).toBe(Math.round(result.net_disposable_income.annual / 12));
    expect(result.comparison.recommendationMessage).toContain('Old Regime saves');
  });

  // Test Case 3: §44AD Business user (cash + digital split)
  test('Case 3: Section 44AD business user with digital + cash split receives 6%/8% presumptive rates', () => {
    const turnover = 15000000; // 1.5 Crore
    const digitalPercentage = 80; // 80% digital (1.2Cr digital @ 6% = 7.2L; 0.3Cr cash @ 8% = 2.4L -> total profit 9.6L)
    
    const result = calculatePresumptiveTax({
      turnover,
      digitalPercentage,
      businessType: 'trading'
    });

    expect(result.section).toBe('44AD');
    expect(result.isEligible).toBe(true);
    expect(result.auditRequired).toBe(false);
    expect(result.presumptiveProfit).toBe(960000); // 720000 + 240000
    expect(result.net_disposable_income).toBeDefined();
    expect(result.net_disposable_income.annual).toBe(turnover - result.chosenTax);
    expect(result.net_disposable_income.profitAfterTax).toBe(960000 - result.chosenTax);
    expect(result.disclaimer).toBeDefined();
  });

  // Test Case 4: §44ADA Professional user
  test('Case 4: Section 44ADA professional user receives 50% presumptive rate and checks enhanced limit', () => {
    const turnover = 6000000; // 60 Lakh (eligible under enhanced limit of 75L because digital is 98%)
    const result = calculatePresumptiveTax({
      turnover,
      digitalPercentage: 98,
      businessType: 'profession'
    });

    expect(result.section).toBe('44ADA');
    expect(result.applicableLimit).toBe(7500000);
    expect(result.isEligible).toBe(true);
    expect(result.presumptiveProfit).toBe(3000000); // 50% of 60L
    expect(result.net_disposable_income.annual).toBe(turnover - result.chosenTax);
    expect(result.net_disposable_income.monthly).toBe(Math.round(result.net_disposable_income.annual / 12));
  });

  // Test Case 5: Business user who exceeds both thresholds
  test('Case 5: Business user exceeding turnover threshold is flagged for Section 44AB tax audit', () => {
    const turnover = 35000000; // 3.5 Crore (exceeds enhanced limit of 3 Cr)
    const result = calculatePresumptiveTax({
      turnover,
      digitalPercentage: 96,
      businessType: 'trading'
    });

    expect(result.isEligible).toBe(false);
    expect(result.auditRequired).toBe(true);
    expect(result.warningMessage).toContain('Tax Audit under Section 44AB');
    expect(result.warningMessage).toContain('Presumptive taxation is not applicable');
  });

  // Test Case 6: Soft warning when within 10% of threshold
  test('Case 6: Shows soft warning when turnover is within 10% of eligibility threshold', () => {
    const turnover = 19000000; // 1.9 Crore on 2 Crore limit (95% of threshold)
    const result = calculatePresumptiveTax({
      turnover,
      digitalPercentage: 50, // Standard 2Cr limit applies
      businessType: 'trading'
    });

    expect(result.isEligible).toBe(true);
    expect(result.isNearLimit).toBe(true);
    expect(result.warningMessage).toContain('close to the');
  });

  // Test Case 7: Rebate 87A makes tax ₹0 up to ₹12L taxable income in New Regime
  test('Case 7: Tax is ₹0 for ₹12L taxable income under New Regime due to Section 87A rebate', () => {
    const taxResult = calculateRegimeTax(1200000, 'new');
    expect(taxResult.baseTax).toBe(60000);
    expect(taxResult.rebate87A).toBe(60000);
    expect(taxResult.totalTax).toBe(0);
  });
});
