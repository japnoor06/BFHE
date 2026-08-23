const assert = require('assert');
const {
  defaultTaxRules,
  calculateRegimeTax,
  calculateSalariedTax,
  calculatePresumptiveTax
} = require('../src/services/taxEngine');

console.log('🧪 Running Tax Engine Test Suite for FY 2026-27...\n');

// 1. Config tests
assert.strictEqual(defaultTaxRules.financialYear, '2026-27', 'Financial Year must be 2026-27');
assert.strictEqual(defaultTaxRules.cessRate, 0.04, 'Cess rate must be 4%');
assert.strictEqual(defaultTaxRules.newRegime.standardDeduction, 75000, 'New regime standard deduction should be 75,000');
assert.strictEqual(defaultTaxRules.oldRegime.standardDeduction, 50000, 'Old regime standard deduction should be 50,000');
assert.strictEqual(defaultTaxRules.newRegime.rebate87A.threshold, 1200000, 'New regime 87A rebate threshold should be 12L');
console.log('✅ 1. Config Test Passed: All FY 2026-27 parameters and thresholds loaded correctly');

// 2. Salaried user better off under New Regime
const salariedNew = calculateSalariedTax({
  grossSalary: 1500000,
  section80C: 20000,
  section80D: 10000
});
assert.strictEqual(salariedNew.incomeType, 'salaried');
assert.strictEqual(salariedNew.comparison.recommendedRegime, 'new');
assert(salariedNew.newRegime.totalTax < salariedNew.oldRegime.totalTax, 'New regime tax should be lower');
assert.strictEqual(salariedNew.net_disposable_income.annual, 1500000 - salariedNew.newRegime.totalTax);
assert.strictEqual(salariedNew.net_disposable_income.monthly, Math.round(salariedNew.net_disposable_income.annual / 12));
console.log(`✅ 2. Salaried (New Regime Recommended) Passed: New tax ₹${salariedNew.newRegime.totalTax} vs Old tax ₹${salariedNew.oldRegime.totalTax}, Net Disposable ₹${salariedNew.net_disposable_income.annual}/yr`);

// 3. Salaried user better off under Old Regime (high deductions)
const salariedOld = calculateSalariedTax({
  grossSalary: 1500000,
  section80C: 150000,
  section80D: 50000,
  hraExemption: 250000,
  homeLoanInterest24b: 200000
});
assert.strictEqual(salariedOld.comparison.recommendedRegime, 'old');
assert(salariedOld.oldRegime.totalTax < salariedOld.newRegime.totalTax, 'Old regime tax should be lower due to heavy deductions');
assert.strictEqual(salariedOld.net_disposable_income.annual, 1500000 - salariedOld.oldRegime.totalTax);
console.log(`✅ 3. Salaried (Old Regime Recommended) Passed: Old tax ₹${salariedOld.oldRegime.totalTax} vs New tax ₹${salariedOld.newRegime.totalTax}, Net Disposable ₹${salariedOld.net_disposable_income.annual}/yr`);

// 4. §44AD Business user (cash + digital split)
const business44AD = calculatePresumptiveTax({
  turnover: 15000000, // 1.5 Cr
  digitalPercentage: 80, // 80% digital -> 1.2Cr @ 6% = 7.2L; 0.3Cr @ 8% = 2.4L -> total profit 9.6L
  businessType: 'trading'
});
assert.strictEqual(business44AD.section, '44AD');
assert.strictEqual(business44AD.isEligible, true);
assert.strictEqual(business44AD.auditRequired, false);
assert.strictEqual(business44AD.presumptiveProfit, 960000);
assert.strictEqual(business44AD.net_disposable_income.annual, 15000000 - business44AD.chosenTax);
console.log(`✅ 4. Section 44AD Business User Passed: Presumptive Profit ₹${business44AD.presumptiveProfit}, Net Disposable ₹${business44AD.net_disposable_income.annual}`);

// 5. §44ADA Professional user
const professional44ADA = calculatePresumptiveTax({
  turnover: 6000000, // 60 Lakh
  digitalPercentage: 98,
  businessType: 'profession'
});
assert.strictEqual(professional44ADA.section, '44ADA');
assert.strictEqual(professional44ADA.applicableLimit, 7500000);
assert.strictEqual(professional44ADA.isEligible, true);
assert.strictEqual(professional44ADA.presumptiveProfit, 3000000);
assert.strictEqual(professional44ADA.net_disposable_income.annual, 6000000 - professional44ADA.chosenTax);
console.log(`✅ 5. Section 44ADA Professional User Passed: Presumptive Profit ₹${professional44ADA.presumptiveProfit}, Net Disposable ₹${professional44ADA.net_disposable_income.annual}`);

// 6. Business user who exceeds both thresholds
const exceedingBusiness = calculatePresumptiveTax({
  turnover: 35000000, // 3.5 Cr
  digitalPercentage: 96,
  businessType: 'trading'
});
assert.strictEqual(exceedingBusiness.isEligible, false);
assert.strictEqual(exceedingBusiness.auditRequired, true);
assert(exceedingBusiness.warningMessage.includes('Section 44AB'));
console.log(`✅ 6. Exceeding Limits Business User Passed: Ineligible flagged, Section 44AB Tax Audit required`);

// 7. Soft warning within 10% of threshold
const nearLimitBusiness = calculatePresumptiveTax({
  turnover: 19000000, // 1.9 Cr (95% of standard 2 Cr limit)
  digitalPercentage: 50,
  businessType: 'trading'
});
assert.strictEqual(nearLimitBusiness.isEligible, true);
assert.strictEqual(nearLimitBusiness.isNearLimit, true);
assert(nearLimitBusiness.warningMessage.includes('close to the'));
console.log(`✅ 7. Soft Warning (<10% tolerance) Passed: Warning triggered correctly`);

// 8. Section 87A Rebate makes ₹12L taxable income ₹0 tax under New Regime
const rebateCheck = calculateRegimeTax(1200000, 'new');
assert.strictEqual(rebateCheck.baseTax, 60000);
assert.strictEqual(rebateCheck.rebate87A, 60000);
assert.strictEqual(rebateCheck.totalTax, 0);
console.log(`✅ 8. Section 87A Rebate Passed: Tax on ₹12L is ₹${rebateCheck.totalTax} (Base Tax ₹${rebateCheck.baseTax} - Rebate ₹${rebateCheck.rebate87A})`);

console.log('\n🎉 ALL 8 TEST SCENARIOS PASSED SUCCESSFULLY!');
