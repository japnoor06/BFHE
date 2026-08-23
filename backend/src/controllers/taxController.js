const prisma = require('../config/database');
const {
  defaultTaxRules,
  calculateSalariedTax,
  calculatePresumptiveTax,
  calculateMixedTax
} = require('../services/taxEngine');

/**
 * Get active tax rules configuration
 */
exports.getTaxConfig = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: defaultTaxRules
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate tax and net disposable income based on provided payload
 */
exports.calculateTax = async (req, res, next) => {
  try {
    const { incomeType = 'salaried', ...params } = req.body;

    let result;
    if (incomeType === 'salaried') {
      result = calculateSalariedTax(params, defaultTaxRules);
    } else if (incomeType === 'business' || incomeType === 'trading' || incomeType === '44ad') {
      result = calculatePresumptiveTax({ ...params, businessType: 'trading' }, defaultTaxRules);
    } else if (incomeType === 'professional' || incomeType === 'freelance' || incomeType === '44ada') {
      result = calculatePresumptiveTax({ ...params, businessType: 'profession' }, defaultTaxRules);
    } else if (incomeType === 'mixed') {
      result = calculateMixedTax(params, defaultTaxRules);
    } else {
      result = calculateSalariedTax(params, defaultTaxRules);
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get prefilled estimate from existing User Financial Profile
 */
exports.getUserTaxEstimate = async (req, res, next) => {
  try {
    const profile = await prisma.financialProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No financial profile found. Complete profile or enter values directly.'
      });
    }

    let estimate;
    if (profile.netMonthlySalary > 0) {
      // Annual gross estimate from monthly in-hand + bonus
      const annualGross = (profile.netMonthlySalary * 12) + (profile.annualBonus || 0) + ((profile.otherMonthlyIncome || 0) * 12);
      estimate = calculateSalariedTax({
        grossSalary: annualGross
      }, defaultTaxRules);
    } else if (profile.last12MonthRevenue && profile.last12MonthRevenue.length > 0) {
      const annualTurnover = profile.last12MonthRevenue.reduce((a, b) => a + b, 0);
      estimate = calculatePresumptiveTax({
        turnover: annualTurnover,
        digitalPercentage: 90,
        businessType: 'trading'
      }, defaultTaxRules);
    } else {
      const annualProfit = (profile.avgMonthlyProfit || 0) * 12;
      estimate = calculatePresumptiveTax({
        turnover: annualProfit,
        digitalPercentage: 90,
        businessType: 'trading'
      }, defaultTaxRules);
    }

    res.status(200).json({
      success: true,
      data: {
        profileSnapshot: {
          netMonthlySalary: profile.netMonthlySalary,
          annualBonus: profile.annualBonus,
          otherMonthlyIncome: profile.otherMonthlyIncome,
          hasRevenueHistory: (profile.last12MonthRevenue || []).length > 0
        },
        estimate
      }
    });
  } catch (error) {
    next(error);
  }
};
