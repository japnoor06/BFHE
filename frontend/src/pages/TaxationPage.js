import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calculateSalariedTaxClient,
  calculatePresumptiveTaxClient,
  taxAPI
} from '../services/taxService';
import defaultRules from '../config/tax_rules_2026_27.json';
import { PageHeader, SectionCard, Divider } from '../components/ui';
import { formatINR } from '../utils/currency';

const INCOME_TYPES = [
  {
    id: 'salaried',
    label: 'Salaried',
    icon: '💼',
    desc: 'Regular payroll salary with standard deduction, HRA, 80C/80D deductions'
  },
  {
    id: 'business',
    label: 'Business / Trading',
    icon: '🏪',
    desc: 'Section 44AD presumptive taxation (up to ₹3 Cr turnover with digital receipts)'
  },
  {
    id: 'professional',
    label: 'Professional / Freelance',
    icon: '💻',
    desc: 'Section 44ADA presumptive scheme (up to ₹75 Lakh gross receipts)'
  },
  {
    id: 'mixed',
    label: 'Mixed Income',
    icon: '🔀',
    desc: 'Combined salary + freelance consulting / business income'
  }
];

export default function TaxationPage() {
  const [taxRules, setTaxRules] = useState(defaultRules);
  const [incomeType, setIncomeType] = useState(() => {
    return localStorage.getItem('bfhe_tax_income_type') || 'salaried';
  });

  // Salaried Inputs
  const [salariedInputs, setSalariedInputs] = useState({
    grossSalary: 1500000,
    salaryInputMode: 'annual', // 'annual' | 'monthly'
    monthlySalary: 125000,
    employerNPS: 0,
    section80C: 150000,
    section80D: 25000,
    hraExemption: 0,
    homeLoanInterest24b: 0,
    otherDeductions: 0
  });
  const [showDeductions, setShowDeductions] = useState(false);

  // Business / Presumptive Inputs
  const [businessInputs, setBusinessInputs] = useState({
    turnover: 6000000,
    digitalPercentage: 96,
    businessType: 'trading' // 'trading' | 'profession'
  });

  // Fetch backend config and prefilled estimate if user is logged in
  useEffect(() => {
    taxAPI.getConfig()
      .then(res => {
        if (res.data?.data) setTaxRules(res.data.data);
      })
      .catch(() => {
        // Fallback to local config
      });

    taxAPI.getUserEstimate()
      .then(res => {
        const snap = res.data?.data?.profileSnapshot;
        if (snap?.netMonthlySalary > 0) {
          const annual = (snap.netMonthlySalary * 12) + (snap.annualBonus || 0) + ((snap.otherMonthlyIncome || 0) * 12);
          setSalariedInputs(prev => ({
            ...prev,
            grossSalary: annual,
            monthlySalary: Math.round(annual / 12)
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleIncomeTypeChange = (type) => {
    setIncomeType(type);
    localStorage.setItem('bfhe_tax_income_type', type);
  };

  // Salaried Calculation
  const salariedResult = useMemo(() => {
    return calculateSalariedTaxClient({
      grossSalary: salariedInputs.salaryInputMode === 'monthly'
        ? salariedInputs.monthlySalary * 12
        : salariedInputs.grossSalary,
      employerNPS: salariedInputs.employerNPS,
      section80C: salariedInputs.section80C,
      section80D: salariedInputs.section80D,
      hraExemption: salariedInputs.hraExemption,
      homeLoanInterest24b: salariedInputs.homeLoanInterest24b,
      otherDeductions: salariedInputs.otherDeductions
    }, taxRules);
  }, [salariedInputs, taxRules]);

  // Business / Professional Calculation
  const businessResult = useMemo(() => {
    const isProf = incomeType === 'professional';
    return calculatePresumptiveTaxClient({
      turnover: businessInputs.turnover,
      digitalPercentage: businessInputs.digitalPercentage,
      businessType: isProf ? 'profession' : 'trading'
    }, taxRules);
  }, [businessInputs, incomeType, taxRules]);

  // Mixed Calculation
  const mixedResult = useMemo(() => {
    const grossSalary = salariedInputs.salaryInputMode === 'monthly'
      ? salariedInputs.monthlySalary * 12
      : salariedInputs.grossSalary;

    const salariedCalc = calculateSalariedTaxClient({
      grossSalary,
      employerNPS: salariedInputs.employerNPS,
      section80C: salariedInputs.section80C,
      section80D: salariedInputs.section80D,
      hraExemption: salariedInputs.hraExemption,
      homeLoanInterest24b: salariedInputs.homeLoanInterest24b,
      otherDeductions: salariedInputs.otherDeductions
    }, taxRules);

    const bizCalc = calculatePresumptiveTaxClient({
      turnover: businessInputs.turnover,
      digitalPercentage: businessInputs.digitalPercentage,
      businessType: 'profession'
    }, taxRules);

    const totalGross = grossSalary + (businessInputs.turnover || 0);
    const combinedNewTaxable = (salariedCalc.newRegime.taxableIncome || 0) + (bizCalc.presumptiveProfit || 0);
    const combinedOldTaxable = (salariedCalc.oldRegime.taxableIncome || 0) + (bizCalc.presumptiveProfit || 0);

    const newTax = calculateSalariedTaxClient({ grossSalary: combinedNewTaxable + salariedCalc.newRegime.totalDeductions }, taxRules).newRegime;
    const oldTax = calculateSalariedTaxClient({ grossSalary: combinedOldTaxable + salariedCalc.oldRegime.totalDeductions, ...salariedInputs }, taxRules).oldRegime;

    const bestTax = Math.min(newTax.totalTax, oldTax.totalTax);
    const recRegime = newTax.totalTax <= oldTax.totalTax ? 'new' : 'old';
    const netAnnual = Math.max(0, totalGross - bestTax);

    return {
      incomeType: 'mixed',
      totalGross,
      salaried: salariedCalc,
      business: bizCalc,
      newRegime: newTax,
      oldRegime: oldTax,
      recommendedRegime: recRegime,
      chosenTax: bestTax,
      net_disposable_income: {
        annual: netAnnual,
        monthly: Math.round(netAnnual / 12),
        takeHomePercent: totalGross > 0 ? Number(((netAnnual / totalGross) * 100).toFixed(2)) : 0
      }
    };
  }, [salariedInputs, businessInputs, taxRules]);

  const activeResult = incomeType === 'salaried'
    ? salariedResult
    : incomeType === 'mixed'
      ? mixedResult
      : businessResult;

  return (
    <div className="taxation-page" style={{ padding: '28px 28px 60px', maxWidth: 1240, margin: '0 auto' }}>
      {/* Header */}
      <PageHeader
        title="Income Tax & Take-Home Engine"
        subtitle="FY 2026-27 (AY 2027-28) • Compare New vs Old Regime, evaluate §44AD/§44ADA presumptive limits, and unlock your true Net Disposable Income."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(201,217,245,0.08)', padding: '6px 14px', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14 }}>🏛️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>Budget 2025/26 Slabs Active</span>
          </div>
        }
      />

      {/* Persistent CA Disclaimer Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(144, 97, 249, 0.12), rgba(169, 200, 255, 0.06))',
        border: '1px solid rgba(144, 97, 249, 0.3)',
        borderRadius: 'var(--r)',
        padding: '12px 18px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span style={{ fontSize: 20 }}>⚖️</span>
        <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text)' }}>Legal Disclaimer:</strong> This engine calculates estimates for financial planning and FHS calibration based on Union Budget FY 2026-27 rules. This does not constitute certified tax or legal advice. Please consult a qualified Chartered Accountant (CA) prior to filing your ITR.
        </div>
      </div>

      {/* ─── 1. Income Type Selector ─────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
          STEP 1: HOW DO YOU EARN?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {INCOME_TYPES.map(type => {
            const isSelected = incomeType === type.id;
            return (
              <motion.div
                key={type.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleIncomeTypeChange(type.id)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(201, 217, 245, 0.16), rgba(135, 216, 208, 0.08))'
                    : 'var(--bg-card)',
                  border: isSelected ? '2px solid var(--gold)' : '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 20px rgba(201, 217, 245, 0.2)' : 'none'
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'var(--gold)',
                    color: '#050810',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 900
                  }}>
                    ✓
                  </div>
                )}
                <div style={{ fontSize: 26, marginBottom: 10 }}>{type.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: isSelected ? 'var(--gold)' : 'var(--text)', marginBottom: 4 }}>
                  {type.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                  {type.desc}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Hero Results: Net Disposable Income Primary Metric ──────────── */}
      <div style={{ marginBottom: 30 }}>
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(35, 209, 96, 0.12), rgba(201, 217, 245, 0.08))',
          border: '1px solid rgba(35, 209, 96, 0.3)',
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>💎</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Primary Metric • Real Take-Home Cashflow
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>
                Net Disposable Income (Ready for FHS Pillars & 50/30/20 Budgeting)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: '#FFFFFF', letterSpacing: -1 }}>
                  {formatINR(activeResult?.net_disposable_income?.annual || 0)}
                </span>
                <span style={{ fontSize: 16, color: 'var(--green)', fontWeight: 700 }}>
                  ({formatINR(activeResult?.net_disposable_income?.monthly || 0)}/mo)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 18px', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Total Tax Liability</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--red)', marginTop: 4 }}>
                  {formatINR(incomeType === 'salaried'
                    ? (salariedResult.comparison.recommendedRegime === 'new' ? salariedResult.newRegime.totalTax : salariedResult.oldRegime.totalTax)
                    : activeResult?.chosenTax || 0)}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 18px', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Take-Home Ratio</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)', marginTop: 4 }}>
                  {activeResult?.net_disposable_income?.takeHomePercent || 0}%
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 18px', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Recommended Regime</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--teal)', marginTop: 4 }}>
                  {(incomeType === 'salaried' ? salariedResult.comparison.recommendedRegime : activeResult?.recommendedRegime)?.toUpperCase()} REGIME
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Interactive Calculator Forms ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24, marginBottom: 32 }}>
        
        {/* Left Column: Input Form */}
        <SectionCard
          title={incomeType === 'salaried' ? 'Salary & Deductions Details' : incomeType === 'mixed' ? 'Salary & Freelance Inputs' : 'Business / Professional Receipts'}
          subtitle="All calculations dynamically sync with FY 2026-27 config"
        >
          {/* Salaried & Mixed: Salary Form */}
          {(incomeType === 'salaried' || incomeType === 'mixed') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    Gross Annual Salary (CTC / In-hand pre-tax)
                  </label>
                  <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.06)', padding: 3, borderRadius: 6 }}>
                    <button
                      type="button"
                      onClick={() => setSalariedInputs(p => ({ ...p, salaryInputMode: 'annual' }))}
                      style={{
                        background: salariedInputs.salaryInputMode === 'annual' ? 'var(--gold)' : 'transparent',
                        color: salariedInputs.salaryInputMode === 'annual' ? '#000' : 'var(--text-2)',
                        border: 'none',
                        borderRadius: 4,
                        padding: '3px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Annual
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalariedInputs(p => ({ ...p, salaryInputMode: 'monthly' }))}
                      style={{
                        background: salariedInputs.salaryInputMode === 'monthly' ? 'var(--gold)' : 'transparent',
                        color: salariedInputs.salaryInputMode === 'monthly' ? '#000' : 'var(--text-2)',
                        border: 'none',
                        borderRadius: 4,
                        padding: '3px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {salariedInputs.salaryInputMode === 'annual' ? (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-3)', fontWeight: 700 }}>₹</span>
                    <input
                      type="number"
                      className="input-field"
                      style={{ paddingLeft: 30, width: '100%', fontSize: 16, fontWeight: 700 }}
                      value={salariedInputs.grossSalary || ''}
                      onChange={(e) => setSalariedInputs(p => ({ ...p, grossSalary: Number(e.target.value) }))}
                      placeholder="e.g. 1500000"
                    />
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-3)', fontWeight: 700 }}>₹</span>
                    <input
                      type="number"
                      className="input-field"
                      style={{ paddingLeft: 30, width: '100%', fontSize: 16, fontWeight: 700 }}
                      value={salariedInputs.monthlySalary || ''}
                      onChange={(e) => setSalariedInputs(p => ({ ...p, monthlySalary: Number(e.target.value) }))}
                      placeholder="e.g. 125000"
                    />
                  </div>
                )}

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {[800000, 1200000, 1500000, 2000000, 3000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSalariedInputs(p => ({ ...p, grossSalary: val, salaryInputMode: 'annual' }))}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-2)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        cursor: 'pointer'
                      }}
                    >
                      {formatINR(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employer NPS 80CCD(2) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    Employer NPS Contribution (§80CCD(2))
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>Deductible in BOTH Regimes</span>
                </div>
                <input
                  type="number"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={salariedInputs.employerNPS || ''}
                  onChange={(e) => setSalariedInputs(p => ({ ...p, employerNPS: Number(e.target.value) }))}
                  placeholder="e.g. 50000"
                />
              </div>

              {/* Toggle Deductions Form for Old Regime */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '14px 16px'
              }}>
                <div
                  onClick={() => setShowDeductions(!showDeductions)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📋</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
                        Old Regime Deductions (80C, 80D, HRA, Home Loan)
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                        Only needed if evaluating Old Tax Regime
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--gold)', transform: showDeductions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </div>

                <AnimatePresence>
                  {showDeductions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}
                    >
                      {/* Section 80C */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-2)' }}>Section 80C (EPF, PPF, ELSS, LIC)</span>
                          <span style={{ color: 'var(--text-3)' }}>Max ₹1,50,000</span>
                        </div>
                        <input
                          type="number"
                          className="input-field"
                          style={{ width: '100%' }}
                          value={salariedInputs.section80C || ''}
                          onChange={(e) => setSalariedInputs(p => ({ ...p, section80C: Number(e.target.value) }))}
                          placeholder="e.g. 150000"
                        />
                      </div>

                      {/* Section 80D */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-2)' }}>Section 80D (Health Insurance Premium)</span>
                          <span style={{ color: 'var(--text-3)' }}>Max ₹75,000</span>
                        </div>
                        <input
                          type="number"
                          className="input-field"
                          style={{ width: '100%' }}
                          value={salariedInputs.section80D || ''}
                          onChange={(e) => setSalariedInputs(p => ({ ...p, section80D: Number(e.target.value) }))}
                          placeholder="e.g. 25000"
                        />
                      </div>

                      {/* HRA Exemption */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-2)' }}>HRA Exemption (§10(13A))</span>
                          <span style={{ color: 'var(--text-3)' }}>Actual exempt portion</span>
                        </div>
                        <input
                          type="number"
                          className="input-field"
                          style={{ width: '100%' }}
                          value={salariedInputs.hraExemption || ''}
                          onChange={(e) => setSalariedInputs(p => ({ ...p, hraExemption: Number(e.target.value) }))}
                          placeholder="e.g. 180000"
                        />
                      </div>

                      {/* Section 24b Home Loan Interest */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-2)' }}>Home Loan Interest (§24b Self-occupied)</span>
                          <span style={{ color: 'var(--text-3)' }}>Max ₹2,00,000</span>
                        </div>
                        <input
                          type="number"
                          className="input-field"
                          style={{ width: '100%' }}
                          value={salariedInputs.homeLoanInterest24b || ''}
                          onChange={(e) => setSalariedInputs(p => ({ ...p, homeLoanInterest24b: Number(e.target.value) }))}
                          placeholder="e.g. 200000"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Business & Professional & Mixed: Presumptive Form */}
          {(incomeType === 'business' || incomeType === 'professional' || incomeType === 'mixed') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {incomeType === 'mixed' && (
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold)', letterSpacing: 0.5, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  SECONDARY: BUSINESS / FREELANCE RECEIPTS
                </div>
              )}

              {/* Turnover / Receipts */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
                  {incomeType === 'professional' ? 'Gross Annual Professional Receipts' : 'Annual Gross Turnover / Sales'}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-3)', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    className="input-field"
                    style={{ paddingLeft: 30, width: '100%', fontSize: 16, fontWeight: 700 }}
                    value={businessInputs.turnover || ''}
                    onChange={(e) => setBusinessInputs(p => ({ ...p, turnover: Number(e.target.value) }))}
                    placeholder="e.g. 4500000"
                  />
                </div>

                {/* Quick Presets for Business */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {[2500000, 5000000, 7500000, 15000000, 20000000, 30000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBusinessInputs(p => ({ ...p, turnover: val }))}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-2)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        cursor: 'pointer'
                      }}
                    >
                      {formatINR(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Digital Receipts % Slider */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      Digital Receipts Share (UPI / Bank / Cards)
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      ≥ 95% unlocks enhanced presumptive thresholds & 6% profit rate (§44AD)
                    </div>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 900, color: businessInputs.digitalPercentage >= 95 ? 'var(--green)' : 'var(--orange)' }}>
                    {businessInputs.digitalPercentage}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={businessInputs.digitalPercentage}
                  onChange={(e) => setBusinessInputs(p => ({ ...p, digitalPercentage: Number(e.target.value) }))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--gold)' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  <span>0% (All Cash)</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>95% Threshold (Enhanced Limit)</span>
                  <span>100% (Pure Digital)</span>
                </div>
              </div>

              {/* Eligibility & Warning Cards */}
              {incomeType !== 'salaried' && businessResult && (
                <div>
                  {!businessResult.isEligible ? (
                    <div style={{
                      background: 'rgba(255, 74, 74, 0.12)',
                      border: '1px solid var(--red)',
                      borderRadius: 'var(--r)',
                      padding: '12px 16px',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start'
                    }}>
                      <span style={{ fontSize: 18 }}>🚫</span>
                      <div style={{ fontSize: 12.5, color: '#FFA0A0', lineHeight: 1.4 }}>
                        <strong>Presumptive Taxation Exceeded:</strong> {businessResult.warningMessage}
                      </div>
                    </div>
                  ) : businessResult.isNearLimit ? (
                    <div style={{
                      background: 'rgba(255, 138, 76, 0.12)',
                      border: '1px solid var(--orange)',
                      borderRadius: 'var(--r)',
                      padding: '12px 16px',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start'
                    }}>
                      <span style={{ fontSize: 18 }}>⚠️</span>
                      <div style={{ fontSize: 12.5, color: '#FFD1A4', lineHeight: 1.4 }}>
                        <strong>Threshold Warning:</strong> {businessResult.warningMessage}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(35, 209, 96, 0.08)',
                      border: '1px solid rgba(35, 209, 96, 0.3)',
                      borderRadius: 'var(--r)',
                      padding: '10px 14px',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: 16 }}>✅</span>
                      <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                        Eligible for {businessResult.schemeName} (Limit: {formatINR(businessResult.applicableLimit)})
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Right Column: Side-by-Side Comparison & Recommendation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Recommendation Banner */}
          {incomeType === 'salaried' && (
            <div style={{
              background: salariedResult.comparison.recommendedRegime === 'new'
                ? 'linear-gradient(135deg, rgba(201, 217, 245, 0.18), rgba(135, 216, 208, 0.1))'
                : 'linear-gradient(135deg, rgba(144, 97, 249, 0.18), rgba(201, 217, 245, 0.1))',
              border: `1px solid ${salariedResult.comparison.recommendedRegime === 'new' ? 'var(--gold)' : 'var(--purple)'}`,
              borderRadius: 'var(--r-lg)',
              padding: '20px 22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>💡</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    Engine Recommendation
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF' }}>
                    {salariedResult.comparison.recommendedRegime === 'new' ? 'Opt for New Tax Regime' : 'Opt for Old Tax Regime'}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>
                {salariedResult.comparison.recommendationMessage}
              </p>
            </div>
          )}

          {/* Side by Side Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            
            {/* New Regime Card */}
            <div style={{
              background: salariedResult?.comparison?.recommendedRegime === 'new'
                ? 'rgba(201, 217, 245, 0.08)'
                : 'rgba(255,255,255,0.025)',
              border: salariedResult?.comparison?.recommendedRegime === 'new'
                ? '2px solid var(--gold)'
                : '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '18px 20px',
              position: 'relative'
            }}>
              {salariedResult?.comparison?.recommendedRegime === 'new' && (
                <span style={{
                  position: 'absolute',
                  top: -10,
                  right: 14,
                  background: 'var(--gold)',
                  color: '#000',
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 10,
                  textTransform: 'uppercase'
                }}>
                  Recommended
                </span>
              )}
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>
                New Regime
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
                Std Ded: ₹75,000 • Rebate up to ₹12.75L
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Taxable Income:</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(activeResult?.newRegime?.taxableIncome || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Base Slab Tax:</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(activeResult?.newRegime?.baseTax || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>§87A Rebate:</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>- {formatINR(activeResult?.newRegime?.rebate87A || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Cess (4%):</span>
                  <span>{formatINR(activeResult?.newRegime?.cess || 0)}</span>
                </div>
                <Divider style={{ margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                  <span style={{ fontWeight: 800, color: 'var(--text)' }}>Total Tax:</span>
                  <span style={{ fontWeight: 900, color: 'var(--red)' }}>{formatINR(activeResult?.newRegime?.totalTax || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--green)' }}>
                  <span style={{ fontWeight: 700 }}>Net Take-Home:</span>
                  <span style={{ fontWeight: 800 }}>{formatINR(activeResult?.newRegime?.net_disposable_income?.annual || (activeResult?.net_disposable_income?.annual || 0))}</span>
                </div>
              </div>
            </div>

            {/* Old Regime Card */}
            <div style={{
              background: salariedResult?.comparison?.recommendedRegime === 'old'
                ? 'rgba(144, 97, 249, 0.08)'
                : 'rgba(255,255,255,0.025)',
              border: salariedResult?.comparison?.recommendedRegime === 'old'
                ? '2px solid var(--purple)'
                : '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '18px 20px',
              position: 'relative'
            }}>
              {salariedResult?.comparison?.recommendedRegime === 'old' && (
                <span style={{
                  position: 'absolute',
                  top: -10,
                  right: 14,
                  background: 'var(--purple)',
                  color: '#FFF',
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 10,
                  textTransform: 'uppercase'
                }}>
                  Recommended
                </span>
              )}
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>
                Old Regime
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
                Std Ded: ₹50,000 • Deductions Allowed
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Taxable Income:</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(activeResult?.oldRegime?.taxableIncome || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Base Slab Tax:</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(activeResult?.oldRegime?.baseTax || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>§87A Rebate:</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>- {formatINR(activeResult?.oldRegime?.rebate87A || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Cess (4%):</span>
                  <span>{formatINR(activeResult?.oldRegime?.cess || 0)}</span>
                </div>
                <Divider style={{ margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                  <span style={{ fontWeight: 800, color: 'var(--text)' }}>Total Tax:</span>
                  <span style={{ fontWeight: 900, color: 'var(--red)' }}>{formatINR(activeResult?.oldRegime?.totalTax || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--green)' }}>
                  <span style={{ fontWeight: 700 }}>Net Take-Home:</span>
                  <span style={{ fontWeight: 800 }}>{formatINR(activeResult?.oldRegime?.net_disposable_income?.annual || (activeResult?.net_disposable_income?.annual || 0))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Presumptive Calculation Breakdown for Business */}
          {incomeType !== 'salaried' && businessResult?.isEligible && (
            <SectionCard title="Presumptive Profit Computation">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Applicable Presumptive Section:</span>
                  <span style={{ fontWeight: 800, color: 'var(--teal)' }}>Section {businessResult.section}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Turnover / Gross Receipts:</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(businessResult.turnover)}</span>
                </div>
                {businessResult.breakdown?.digitalTurnover !== undefined && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
                      <span>• Digital Receipts ({businessInputs.digitalPercentage}% @ 6% profit):</span>
                      <span>{formatINR(Math.round(businessResult.breakdown.digitalTurnover * 0.06))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
                      <span>• Cash Receipts ({100 - businessInputs.digitalPercentage}% @ 8% profit):</span>
                      <span>{formatINR(Math.round(businessResult.breakdown.cashTurnover * 0.08))}</span>
                    </div>
                  </>
                )}
                {businessResult.breakdown?.profitRate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
                    <span>• Specified Profession Presumptive Rate:</span>
                    <span>50% of Gross Receipts</span>
                  </div>
                )}
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span style={{ color: 'var(--gold)' }}>Total Presumptive Taxable Profit:</span>
                  <span style={{ color: 'var(--gold)', fontSize: 15 }}>{formatINR(businessResult.presumptiveProfit)}</span>
                </div>
              </div>
            </SectionCard>
          )}

          {/* FHS Integration Helper */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                FHS Pillar Calibration Ready
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>
              BFHE calculates your DTI, Savings Rate, and Living Expense ratios against this exact take-home figure (<strong>{formatINR(activeResult?.net_disposable_income?.monthly || 0)}/mo</strong>) rather than raw gross turnover.
            </p>
          </div>

        </div>
      </div>

      {/* ─── 3. Tax Slabs Reference Table for FY 2026-27 ─────────────────── */}
      <SectionCard
        title="FY 2026-27 Tax Slabs Reference (AY 2027-28)"
        subtitle="Config-driven rates from tax_rules_2026_27.json"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          
          {/* New Regime Slabs */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold)', marginBottom: 10, textTransform: 'uppercase' }}>
              New Tax Regime (Default)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
              {taxRules.newRegime.slabs.map((slab, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-2)' }}>
                    {slab.max ? `${formatINR(slab.min)} - ${formatINR(slab.max)}` : `Above ${formatINR(slab.min)}`}
                  </span>
                  <span style={{ fontWeight: 800, color: slab.rate === 0 ? 'var(--green)' : 'var(--text)' }}>
                    {(slab.rate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Old Regime Slabs */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--purple)', marginBottom: 10, textTransform: 'uppercase' }}>
              Old Tax Regime
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
              {taxRules.oldRegime.slabs.map((slab, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-2)' }}>
                    {slab.max ? `${formatINR(slab.min)} - ${formatINR(slab.max)}` : `Above ${formatINR(slab.min)}`}
                  </span>
                  <span style={{ fontWeight: 800, color: slab.rate === 0 ? 'var(--green)' : 'var(--text)' }}>
                    {(slab.rate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
