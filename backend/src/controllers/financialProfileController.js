const prisma = require('../config/database');
const { calculateScore } = require('../services/scoringEngine');
const { generateRecommendations } = require('../services/recommendationEngine');

// ─── Helper: recalculate and persist score ────────────────────────────────────
const triggerScoreRecalculation = async (userId, profile) => {
  const loans = await prisma.loan.findMany({ where: { userId, isActive: true } });

  // Build profile object compatible with scoringEngine (flatten expenses back)
  const profileObj = {
    ...profile,
    expenses: {
      houseRent: profile.houseRent,
      groceries: profile.groceries,
      electricityBill: profile.electricityBill,
      gasBill: profile.gasBill,
      waterBill: profile.waterBill,
      internetMobile: profile.internetMobile,
      medicalExpenses: profile.medicalExpenses,
      vehicleFuel: profile.vehicleFuel,
      schoolFees: profile.schoolFees,
      otherExpenses: profile.otherExpenses,
    },
    creditCards: profile.creditCards || [],
    totalMonthlyIncome: profile.netMonthlySalary > 0
      ? profile.netMonthlySalary + (profile.annualBonus / 12) + profile.otherMonthlyIncome
      : profile.avgMonthlyProfit,
    totalMonthlyExpenses:
      (profile.houseRent || 0) + (profile.groceries || 0) + (profile.electricityBill || 0) +
      (profile.gasBill || 0) + (profile.waterBill || 0) + (profile.internetMobile || 0) +
      (profile.medicalExpenses || 0) + (profile.vehicleFuel || 0) + (profile.schoolFees || 0) +
      (profile.otherExpenses || 0),
    creditUtilization: (() => {
      const cards = profile.creditCards || [];
      if (!cards.length) return 0;
      const totalLimit = cards.reduce((s, c) => s + c.creditLimit, 0);
      const totalBal = cards.reduce((s, c) => s + c.outstandingBalance, 0);
      return totalLimit === 0 ? 0 : (totalBal / totalLimit) * 100;
    })()
  };

  const result = calculateScore(profileObj, loans);

  const score = await prisma.score.create({
    data: {
      userId,
      totalScore: result.totalScore,
      grade: result.grade,
      dtiScore: result.components.dtiScore,
      savingsScore: result.components.savingsScore,
      emergencyScore: result.components.emergencyScore,
      creditScore: result.components.creditScore,
      expenseScore: result.components.expenseScore,
      monthlyIncome: result.metrics.monthlyIncome,
      totalMonthlyEMI: result.metrics.totalMonthlyEMI,
      totalMonthlyExpenses: result.metrics.totalMonthlyExpenses,
      savingsRate: result.metrics.savingsRate,
      dtiRatio: result.metrics.dtiRatio,
      creditUtilization: result.metrics.creditUtilization,
      emergencyFundMonths: result.metrics.emergencyFundMonths,
    }
  });

  const recData = generateRecommendations(result.metrics, result.components, loans);
  if (recData.length > 0) {
    await prisma.recommendation.deleteMany({ where: { userId, isDismissed: false } });
    await prisma.recommendation.createMany({
      data: recData.map(r => ({ ...r, userId, scoreId: score.id }))
    });
  }

  await prisma.financialProfile.update({
    where: { userId },
    data: { lastScoreCalculatedAt: new Date() }
  });

  return result;
};

// ─── GET profile ───────────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await prisma.financialProfile.findUnique({
      where: { userId: req.user.id },
      include: { creditCards: true }
    });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Financial profile not found. Please complete onboarding.' });
    }
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) { next(error); }
};

// ─── CREATE profile ────────────────────────────────────────────────────────────
exports.createProfile = async (req, res, next) => {
  try {
    const existing = await prisma.financialProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Financial profile already exists. Use PUT to update.' });
    }

    const { creditCards, expenses, ...rest } = req.body;

    // Flatten expenses if nested
    const expenseFields = expenses ? {
      houseRent: expenses.houseRent || 0,
      groceries: expenses.groceries || 0,
      electricityBill: expenses.electricityBill || 0,
      gasBill: expenses.gasBill || 0,
      waterBill: expenses.waterBill || 0,
      internetMobile: expenses.internetMobile || 0,
      medicalExpenses: expenses.medicalExpenses || 0,
      vehicleFuel: expenses.vehicleFuel || 0,
      schoolFees: expenses.schoolFees || 0,
      otherExpenses: expenses.otherExpenses || 0,
    } : {};

    const profile = await prisma.financialProfile.create({
      data: {
        userId: req.user.id,
        ...rest,
        ...expenseFields,
        creditCards: creditCards?.length
          ? { create: creditCards.map(c => ({ cardName: c.cardName, creditLimit: c.creditLimit, outstandingBalance: c.outstandingBalance })) }
          : undefined
      },
      include: { creditCards: true }
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { isOnboardingComplete: true }
    });

    const scoreResult = await triggerScoreRecalculation(req.user.id, profile);

    res.status(201).json({
      success: true,
      message: 'Financial profile created and score calculated!',
      data: { profile, score: scoreResult }
    });

  } catch (error) { next(error); }
};

// ─── UPDATE profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const existing = await prisma.financialProfile.findUnique({
      where: { userId: req.user.id },
      include: { creditCards: true }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Profile not found. Please create one first.' });
    }

    const { creditCards, expenses, ...rest } = req.body;

    const expenseFields = expenses ? {
      houseRent: expenses.houseRent ?? existing.houseRent,
      groceries: expenses.groceries ?? existing.groceries,
      electricityBill: expenses.electricityBill ?? existing.electricityBill,
      gasBill: expenses.gasBill ?? existing.gasBill,
      waterBill: expenses.waterBill ?? existing.waterBill,
      internetMobile: expenses.internetMobile ?? existing.internetMobile,
      medicalExpenses: expenses.medicalExpenses ?? existing.medicalExpenses,
      vehicleFuel: expenses.vehicleFuel ?? existing.vehicleFuel,
      schoolFees: expenses.schoolFees ?? existing.schoolFees,
      otherExpenses: expenses.otherExpenses ?? existing.otherExpenses,
    } : {};

    // Handle credit cards update
    if (creditCards) {
      await prisma.creditCard.deleteMany({ where: { financialProfileId: existing.id } });
      await prisma.creditCard.createMany({
        data: creditCards.map(c => ({
          financialProfileId: existing.id,
          cardName: c.cardName,
          creditLimit: c.creditLimit,
          outstandingBalance: c.outstandingBalance
        }))
      });
    }

    const profile = await prisma.financialProfile.update({
      where: { userId: req.user.id },
      data: { ...rest, ...expenseFields },
      include: { creditCards: true }
    });

    const scoreResult = await triggerScoreRecalculation(req.user.id, profile);

    res.status(200).json({
      success: true,
      message: 'Profile updated and score recalculated!',
      data: { profile, score: scoreResult }
    });

  } catch (error) { next(error); }
};

// Reuses the existing profile scoring pipeline after changing one expense field.
exports.addExpense = async (req, res, next) => {
  try {
    const { category, amount } = req.body;
    const expenseFields = ['houseRent', 'groceries', 'electricityBill', 'gasBill', 'waterBill', 'internetMobile', 'medicalExpenses', 'vehicleFuel', 'schoolFees', 'otherExpenses'];

    if (!expenseFields.includes(category) || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid expense category and amount.' });
    }

    const existing = await prisma.financialProfile.findUnique({ where: { userId: req.user.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Profile not found. Please complete onboarding first.' });

    const profile = await prisma.financialProfile.update({
      where: { userId: req.user.id },
      data: { [category]: existing[category] + amount },
      include: { creditCards: true }
    });
    const score = await triggerScoreRecalculation(req.user.id, profile);
    res.status(200).json({ success: true, message: 'Expense added and financial health score recalculated!', data: { profile, score } });
  } catch (error) { next(error); }
};
