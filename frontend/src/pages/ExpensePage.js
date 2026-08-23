import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, Radio, Wifi, X, Check, ArrowRight, IndianRupee } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { fetchProfile } from '../store/slices/profileSlice';
import { fetchLatestScore, fetchScoreHistory } from '../store/slices/scoreSlice';
import { formatINR, getScoreColor } from '../utils/currency';

const categories = [
  { key: 'groceries', label: 'Food & Dining', icon: '◒' },
  { key: 'vehicleFuel', label: 'Transportation', icon: '↗' },
  { key: 'medicalExpenses', label: 'Healthcare', icon: '+' },
  { key: 'electricityBill', label: 'Bills & Utilities', icon: '⌁' },
  { key: 'schoolFees', label: 'Education', icon: '◇' },
  { key: 'otherExpenses', label: 'Other', icon: '•••' }
];

export default function ExpensePage() {
  const dispatch = useDispatch();
  const { profile } = useSelector(s => s.profile);
  const latestScore = useSelector(s => s.score.latest);
  const [step, setStep] = useState('scan');
  const [mode, setMode] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [category, setCategory] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [previousScore, setPreviousScore] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { dispatch(fetchProfile()); dispatch(fetchLatestScore()); }, [dispatch]);
  const start = (entryMode) => { setMode(entryMode); setStep('overview'); };
  const detect = () => { setStep('detected'); setTimeout(() => start('rfid'), 800); };
  const selected = categories.find(c => c.key === category);
  const monthlyExpense = latestScore?.totalMonthlyExpenses ?? 0;

  async function submit() {
    const numericAmount = Number(amount);
    if (!category || !numericAmount || numericAmount <= 0) return;
    setSubmitting(true); setError('');
    try {
      setPreviousScore(latestScore?.totalScore ?? null);
      const res = await api.post('/financial-profile/expense', { category, amount: numericAmount });
      setResult({ amount: numericAmount, score: res.data.data.score.totalScore, grade: res.data.data.score.grade });
      await Promise.all([dispatch(fetchProfile()), dispatch(fetchLatestScore()), dispatch(fetchScoreHistory())]);
      setStep('success');
    } catch (err) { setError(err.response?.data?.message || 'Unable to add expense. Please try again.'); }
    finally { setSubmitting(false); }
  }

  return <div className="expense-page">
    <AnimatePresence mode="wait">
      {step === 'scan' && <motion.section key="scan" className="expense-centre" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div className="expense-eyebrow"><Radio size={14} /> RFID EXPENSE CAPTURE</div>
        <h1>Ready to <em>scan.</em></h1><p>Tap your RFID card to continue and record an expense in seconds.</p>
        <button className="rfid-scanner" onClick={detect} aria-label="Simulate RFID card detection"><span className="scan-ring" /><Wifi size={42} /><strong>Tap to scan</strong><small>RFID/NFC reader ready</small></button>
        <button className="expense-link" onClick={() => setShowFallback(true)}>RFID not available?</button>
      </motion.section>}

      {step === 'detected' && <motion.section key="detected" className="expense-centre" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="success-orb"><Check size={42} /></div><h1>RFID Card Detected <em>✓</em></h1><p>Connecting you to your financial overview.</p></motion.section>}

      {step === 'overview' && <motion.section key="overview" className="expense-shell" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="expense-topline"><span className="entry-status"><i /> {mode === 'rfid' ? 'RFID Connected' : 'Manual Entry'}</span><span>Expense capture</span></div>
        <div className="expense-hero"><div><div className="expense-eyebrow">FINANCIAL HEALTH SCORE</div><h1>{latestScore?.totalScore ?? '—'} <span>/ 100</span></h1><p className="score-grade" style={{ color: getScoreColor(latestScore?.grade) }}>{latestScore?.grade ?? 'Loading score'}</p></div><button className="btn btn-primary" onClick={() => setStep('category')}><span>+</span> Add Expense</button></div>
        <div className="expense-summary"><Summary label="Monthly spending" value={formatINR(monthlyExpense)} /><Summary label="Monthly savings" value={formatINR(profile?.monthlySavings || 0)} /><Summary label="Emergency fund" value={formatINR(profile?.emergencyFundAmount || 0)} /><Summary label="Credit cards" value={`${profile?.creditCards?.length || 0} linked`} /></div>
      </motion.section>}

      {step === 'category' && <motion.section key="category" className="expense-flow" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><button className="back-expense" onClick={() => setStep('overview')}>← Back</button><div className="expense-eyebrow">STEP 1 OF 2</div><h1>What did you <em>spend</em> on?</h1><p>Choose the existing monthly expense category.</p><div className="category-grid">{categories.map(item => <button key={item.key} className={`category-card ${category === item.key ? 'selected' : ''}`} onClick={() => setCategory(item.key)}><b>{item.icon}</b><span>{item.label}</span>{category === item.key && <Check size={16} />}</button>)}</div><button className="btn btn-primary expense-continue" disabled={!category} onClick={() => setStep('amount')}>Continue <ArrowRight size={16} /></button></motion.section>}

      {step === 'amount' && <motion.section key="amount" className="expense-flow form-flow" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}><button className="back-expense" onClick={() => setStep('category')}>← Back</button><div className="expense-eyebrow">STEP 2 OF 2</div><h1>Add <em>expense.</em></h1><div className="expense-form"><label>Amount<div className="amount-input"><IndianRupee size={26} /><input autoFocus inputMode="decimal" placeholder="0" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} /></div></label><div className="form-detail"><span>Category</span><b>{selected?.label}</b></div><div className="form-detail"><span>Date</span><b>Today</b></div>{error && <p className="expense-error">{error}</p>}<button className="btn btn-primary add-expense-btn" disabled={submitting || !amount} onClick={submit}>{submitting ? 'Adding expense…' : 'Add Expense'}</button></div></motion.section>}

      {step === 'success' && <motion.section key="success" className="expense-centre" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}><div className="success-orb"><Check size={42} /></div><div className="expense-eyebrow">EXPENSE RECORDED</div><h1>Expense added <em>successfully.</em></h1><strong className="success-amount">{formatINR(result?.amount || 0)}</strong><p>{selected?.label}</p><div className="score-update"><span>Financial Health Score updated</span><b>{previousScore ?? '—'} <ArrowRight size={17} /> {result?.score ?? '—'}</b></div><button className="btn btn-secondary" onClick={() => { setAmount(''); setCategory(null); setStep('overview'); }}>Back to overview</button></motion.section>}
    </AnimatePresence>

    <AnimatePresence>{showFallback && <motion.div className="expense-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="expense-modal" initial={{ opacity: 0, scale: .94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }}><button className="modal-close" onClick={() => setShowFallback(false)}><X size={18} /></button><CreditCard size={28} /><h2>RFID Not Available</h2><p>RFID hardware or card is currently unavailable. You can still record your expense manually.</p><button className="btn btn-primary" onClick={() => { setShowFallback(false); start('manual'); }}>Add Expense Manually</button><button className="expense-link" onClick={() => setShowFallback(false)}>Cancel</button></motion.div></motion.div>}</AnimatePresence>
  </div>;
}

function Summary({ label, value }) { return <div className="summary-item"><span>{label}</span><b>{value}</b></div>; }
