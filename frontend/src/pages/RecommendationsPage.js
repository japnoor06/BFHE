import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLatestScore, fetchRecommendations, fetchAIRecommendations, sendChatMessage, markRecDone, unmarkRecDone, clearChat } from '../store/slices/scoreSlice';
import { fetchProfile } from '../store/slices/profileSlice';
import { fetchGoals } from '../store/slices/goalsSlice';
import { fetchNetWorth } from '../store/slices/netWorthSlice';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  debt: { label: 'Debt', icon: '💳', color: '#F05252', dim: 'rgba(240,82,82,0.12)' },
  savings: { label: 'Savings', icon: '🏦', color: '#c9d9f5', dim: 'rgba(201,217,245,0.12)' },
  emergency: { label: 'Emergency', icon: '🛡️', color: '#4F8EF7', dim: 'rgba(79,142,247,0.12)' },
  credit: { label: 'Credit', icon: '📊', color: '#9061F9', dim: 'rgba(144,97,249,0.12)' },
  investment: { label: 'Investment', icon: '📈', color: '#0DCFAA', dim: 'rgba(13,207,170,0.12)' },
  expense: { label: 'Expense', icon: '🧾', color: '#FF8A4C', dim: 'rgba(255,138,76,0.12)' },
  tax: { label: 'Tax', icon: '🏛️', color: '#31C48D', dim: 'rgba(49,196,141,0.12)' },
  insurance: { label: 'Insurance', icon: '🔒', color: '#8B5CF6', dim: 'rgba(139,92,246,0.12)' },
  goal: { label: 'Goal', icon: '🎯', color: '#F59E0B', dim: 'rgba(245,158,11,0.12)' },
};
const PRIORITY_META = {
  critical: { label: 'Critical', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  high: { label: 'High', color: '#c9d9f5', bg: 'rgba(201,217,245,0.12)', border: 'rgba(201,217,245,0.3)' },
  medium: { label: 'Medium', color: '#4F8EF7', bg: 'rgba(79,142,247,0.12)', border: 'rgba(79,142,247,0.3)' },
  low: { label: 'Low', color: '#31C48D', bg: 'rgba(49,196,141,0.12)', border: 'rgba(49,196,141,0.3)' },
};
const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, grade, size = 100 }) {
  const color = grade === 'Excellent' ? '#87d8d0' : grade === 'Good' ? '#31C48D' : grade === 'Fair' ? '#c9d9f5' : grade === 'Poor' ? '#FF8A4C' : '#F05252';
  const r = size * 0.43, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.08} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={size * 0.08}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.24, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.09, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.5 }}>{grade}</span>
      </div>
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
function RecCard({ rec, index, isAI, isDone, onToggleDone, linkedGoal }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_META[rec.category] ?? CATEGORY_META.savings;
  const pri = PRIORITY_META[rec.priority] ?? PRIORITY_META.medium;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: isDone ? 0.5 : 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="rec-card"
      style={{ border: `1px solid ${expanded ? pri.border : 'var(--border)'}` }}
    >
      {/* Left accent bar */}
      <div className="rec-card-accent" style={{ background: pri.color }} />

      {/* Header */}
      <div className="rec-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="rec-card-icon" style={{ background: cat.dim }}>{cat.icon}</div>
        <div className="rec-card-content">
          <div className="rec-card-badges">
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: pri.color, background: pri.bg, border: `1px solid ${pri.border}`, borderRadius: 5, padding: '2px 7px' }}>{pri.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: cat.dim, borderRadius: 5, padding: '2px 7px' }}>{cat.label}</span>
            {isAI && <span style={{ fontSize: 10, fontWeight: 700, color: '#9061F9', background: 'rgba(144,97,249,0.12)', borderRadius: 5, padding: '2px 7px' }}>✨ AI</span>}
            {rec.projectedScoreImpact > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#0DCFAA', background: 'rgba(13,207,170,0.1)', borderRadius: 5, padding: '2px 7px' }}>+{rec.projectedScoreImpact} pts</span>}
            {rec.timeToComplete && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', background: 'var(--bg-elevated)', borderRadius: 5, padding: '2px 7px' }}>⏱ {rec.timeToComplete}</span>}
          </div>
          <h3 className="rec-card-title" style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{rec.title}</h3>
          <p className="rec-card-desc">{rec.description}</p>
          {rec.impact && (
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(13,207,170,0.1)', border: '1px solid rgba(13,207,170,0.2)', borderRadius: 6, padding: '4px 10px' }}>
              <span style={{ fontSize: 12, color: '#0DCFAA', fontWeight: 700 }}>💰 {rec.impact}</span>
            </div>
          )}
        </div>
        {/* Right section: done button + expand */}
        <div className="rec-card-actions">
          <button onClick={e => { e.stopPropagation(); onToggleDone(); }}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${isDone ? 'rgba(49,196,141,0.3)' : 'var(--border)'}`, background: isDone ? 'rgba(49,196,141,0.15)' : 'var(--bg-elevated)', color: isDone ? '#31C48D' : 'var(--text-3)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            title={isDone ? 'Undo' : 'Mark Done'}>
            {isDone ? '✓' : '○'}
          </button>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} style={{ color: 'var(--text-3)', fontSize: 14 }}>▾</motion.div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div className="rec-card-details">
              {rec.actionStep && (
                <div style={{ background: 'rgba(201,217,245,0.07)', border: '1px solid rgba(201,217,245,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>⚡ Action This Week</div>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{rec.actionStep}</p>
                </div>
              )}
              {rec.calculation && (
                <div style={{ background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>🔢 The Math</div>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, fontFamily: 'monospace' }}>{rec.calculation}</p>
                </div>
              )}
              {rec.whyPeopleAvoid && (
                <div style={{ background: 'rgba(144,97,249,0.07)', border: '1px solid rgba(144,97,249,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>🧠 Why People Skip This</div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{rec.whyPeopleAvoid}</p>
                </div>
              )}
              {linkedGoal && (
                <div style={{ background: 'rgba(13,207,170,0.07)', border: '1px solid rgba(13,207,170,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#0DCFAA', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>🎯 Linked Goal</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{linkedGoal.icon || '🎯'} {linkedGoal.title}</div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.round((linkedGoal.currentAmount / linkedGoal.targetAmount) * 100))}%`, background: '#0DCFAA', borderRadius: 3, transition: 'width 0.6s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{fmt(linkedGoal.currentAmount)}</span><span>{fmt(linkedGoal.targetAmount)}</span>
                  </div>
                </div>
              )}
              {!rec.calculation && !rec.whyPeopleAvoid && !linkedGoal && rec.actionStep && (
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', padding: '8px 14px' }}>
                  Update your profile after taking action to recalculate your score.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────
function AIChatPanel({ financialContext }) {
  const dispatch = useDispatch();
  const { aiChat, chatLoading } = useSelector(s => s.score);
  const [msg, setMsg] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiChat]);

  const handleSend = () => {
    if (!msg.trim() || chatLoading) return;
    dispatch(sendChatMessage({ message: msg.trim(), financialContext, history: aiChat }));
    setMsg('');
  };

  const suggestions = ['How can I reduce my DTI?', 'Best tax saving options for me?', 'Should I prepay my loan?', 'How to build emergency fund fast?'];

  return (
    <div className="rec-chat-panel">
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(144,97,249,0.1), rgba(79,142,247,0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800 }}>Ask Gemini</span>
          </div>
          {aiChat.length > 0 && (
            <button onClick={() => dispatch(clearChat())} style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Clear</button>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Ask about your finances — uses your real data</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {aiChat.length === 0 && !chatLoading && (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>💡</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>Ask me anything about your financial health</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => { setMsg(s); }} style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.target.style.borderColor = 'var(--gold)'} onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {aiChat.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
            <div style={{ background: m.role === 'user' ? 'rgba(201,217,245,0.12)' : 'var(--bg-elevated)', border: `1px solid ${m.role === 'user' ? 'rgba(201,217,245,0.2)' : 'var(--border)'}`, borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '10px 13px', fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', display: 'flex', gap: 6 }}>
              <span className="spinner" style={{ width: 14, height: 14 }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="rec-chat-input-row">
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your finances..." style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={handleSend} disabled={chatLoading || !msg.trim()}
          style={{ background: 'linear-gradient(180deg, #ffffff, #c9d9f5)', border: 'none', borderRadius: 8, width: 36, height: 36, color: '#111318', fontSize: 15, cursor: 'pointer', fontWeight: 800, flexShrink: 0, opacity: chatLoading || !msg.trim() ? 0.4 : 1 }}>↑</button>
      </div>
      <div style={{ padding: '4px 12px 8px', fontSize: 10, color: 'var(--text-3)', textAlign: 'center' }}>Powered by Gemini 2.0 · Uses your real data</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { profile, loans } = useSelector(s => s.profile);
  const { latest: score, recommendations, aiRecommendations, aiLoading, recProgress } = useSelector(s => s.score);
  const { goals } = useSelector(s => s.goals);
  const { data: nwData } = useSelector(s => s.netWorth);

  const [activeTab, setActiveTab] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activePriority, setActivePriority] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    dispatch(fetchLatestScore()); dispatch(fetchRecommendations());
    dispatch(fetchProfile()); dispatch(fetchGoals()); dispatch(fetchNetWorth());
  }, [dispatch]);

  useEffect(() => {
    if (score && profile) {
      dispatch(fetchAIRecommendations({ user, score, profile: { ...profile, loans }, goals, netWorth: nwData }));
    }
  }, [score?.totalScore, profile?.id]);

  const financialContext = useMemo(() => ({ user, score, profile: profile ? { ...profile, loans } : null, goals, netWorth: nwData }), [user, score, profile, loans, goals, nwData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([dispatch(fetchLatestScore()), dispatch(fetchRecommendations())]);
    if (score && profile) await dispatch(fetchAIRecommendations(financialContext));
    setRefreshing(false);
  };

  // Metrics
  const metrics = score?.metrics ?? score ?? {};
  const comps = score?.components ?? {};
  const dtiScore = comps.dtiScore ?? score?.dtiScore ?? 0;
  const savingsScore = comps.savingsScore ?? score?.savingsScore ?? 0;
  const emergencyScore = comps.emergencyScore ?? score?.emergencyScore ?? 0;
  const creditScore = comps.creditScore ?? score?.creditScore ?? 0;
  const expenseScore = comps.expenseScore ?? score?.expenseScore ?? 0;
  const income = metrics.monthlyIncome ?? 0;
  const totalEMI = metrics.totalMonthlyEMI ?? 0;
  const totalExp = metrics.totalMonthlyExpenses ?? 0;
  const savingsRate = metrics.savingsRate ?? 0;
  const dtiRatio = metrics.dtiRatio ?? 0;
  const creditUtil = metrics.creditUtilization ?? 0;
  const emergencyMos = metrics.emergencyFundMonths ?? 0;
  const disposable = income - totalEMI - totalExp;

  // Build rec lists
  const aiRecs = useMemo(() => (aiRecommendations || []).map(r => ({ ...r, source: 'gemini' })), [aiRecommendations]);
  const ruleRecs = useMemo(() => (recommendations || []).map(r => ({ ...r, source: 'rule' })), [recommendations]);
  const allRecs = useMemo(() => [...aiRecs, ...ruleRecs], [aiRecs, ruleRecs]);

  const doneIds = new Set(Object.keys(recProgress).filter(k => recProgress[k] === 'done'));
  const activeGoals = (goals || []).filter(g => g.status === 'active');

  // Find linked goal for a rec
  const findLinkedGoal = (rec) => {
    if (!rec.linkedGoalCategory) return null;
    return activeGoals.find(g => g.category === rec.linkedGoalCategory) || null;
  };

  // Filter logic per tab
  const getTabRecs = (tab) => {
    let base = tab === 'rules' ? ruleRecs : allRecs;
    if (tab === 'done') return allRecs.filter(r => doneIds.has(r.id || r._id));
    base = base.filter(r => !doneIds.has(r.id || r._id));
    if (activeFilter !== 'all') base = base.filter(r => r.category === activeFilter);
    if (activePriority !== 'all') base = base.filter(r => r.priority === activePriority);
    return base;
  };

  const filteredRecs = getTabRecs(activeTab);
  const criticalCount = allRecs.filter(r => (r.priority === 'critical' || r.priority === 'high') && !doneIds.has(r.id || r._id)).length;
  const totalProjectedImpact = aiRecs.filter(r => !doneIds.has(r.id || r._id)).reduce((s, r) => s + (r.projectedScoreImpact || 0), 0);
  const categories = [...new Set(allRecs.map(r => r.category))];
  const doneCount = doneIds.size;

  const tabStyle = (t) => ({
    padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', border: 'none', transition: 'all 0.2s',
    background: activeTab === t ? (t === 'all' ? 'rgba(185,169,247,0.15)' : t === 'done' ? 'rgba(49,196,141,0.15)' : 'rgba(201,217,245,0.15)') : 'var(--bg-elevated)',
    color: activeTab === t ? (t === 'all' ? '#9061F9' : t === 'done' ? '#31C48D' : 'var(--gold)') : 'var(--text-2)',
    boxShadow: activeTab === t ? `0 0 12px ${t === 'all' ? 'rgba(144,97,249,0.15)' : 'transparent'}` : 'none'
  });

  const filterBtn = (active, color = 'var(--gold)') => ({
    padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: active ? 'rgba(201,217,245,0.12)' : 'var(--bg-elevated)',
    color: active ? color : 'var(--text-3)', border: `1px solid ${active ? 'rgba(201,217,245,0.25)' : 'var(--border)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s'
  });

  return (
    <div className="rec-page">
      {/* Header */}
      <div className="rec-header">
        <div>
          <h1>✨ Financial Insights</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {filteredRecs.length} actionable steps to improve your financial health
            {aiLoading && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>· Analysing new data...</span>}
          </p>
        </div>
        <div className="rec-header-actions">
          <button onClick={() => setShowChat(c => !c)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: showChat ? 'rgba(144,97,249,0.15)' : 'var(--bg-elevated)', color: showChat ? '#9061F9' : 'var(--text-2)', border: `1px solid ${showChat ? 'rgba(144,97,249,0.25)' : 'var(--border)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            {showChat ? '✨ Hide Chat' : '✨ Ask Gemini'}
          </button>
          <button onClick={handleRefresh} disabled={refreshing || aiLoading} className="btn btn-secondary btn-sm">
            {refreshing ? <><span className="spinner" />Refreshing...</> : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* 2-column layout */}
      <div className={`rec-layout ${showChat ? 'rec-layout--with-chat' : ''}`}>

        {/* LEFT COLUMN — Feed */}
        <div className="rec-feed">

          {/* Horizontal Filters */}
          <div className="rec-filters">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>Filter:</span>
            <button style={filterBtn(activeTab === 'all')} onClick={() => { setActiveTab('all'); setActiveFilter('all'); }}>All Insights</button>
            <button style={filterBtn(activeTab === 'done')} onClick={() => { setActiveTab('done'); setActiveFilter('all'); }}>✅ Completed ({doneCount})</button>
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
            {categories.map(cat => (
              <button key={cat} style={filterBtn(activeFilter === cat, CATEGORY_META[cat]?.color)} onClick={() => { setActiveFilter(cat); setActiveTab('all'); }}>
                {CATEGORY_META[cat]?.icon} {CATEGORY_META[cat]?.label ?? cat}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {aiLoading && activeTab === 'all' && aiRecs.length === 0 && (
            <div className="rec-loading">
              <span className="spinner" style={{ width: 18, height: 18 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Gemini is analysing your finances...</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Generating personalised recommendations with calculations</div>
              </div>
            </div>
          )}

          {/* Feed */}
          {filteredRecs.length === 0 && !(aiLoading && activeTab === 'all') ? (
            <div className="rec-empty">
              <div style={{ fontSize: 36, marginBottom: 12 }}>{activeTab === 'done' ? '🎯' : '🎉'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                {activeTab === 'done' ? 'No completed items yet' : 'No insights found'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-2)' }}>
                {activeTab === 'done' ? 'Mark recommendations as done to track your progress here.' : 'Try changing your filters.'}
              </div>
            </div>
          ) : (
            <div className="rec-feed-list">
              {filteredRecs.map((rec, i) => (
                <RecCard key={rec.id || rec._id || i} rec={rec} index={i} isAI={rec.source === 'gemini'}
                  isDone={doneIds.has(rec.id || rec._id)}
                  onToggleDone={() => doneIds.has(rec.id || rec._id) ? dispatch(unmarkRecDone(rec.id || rec._id)) : dispatch(markRecDone(rec.id || rec._id))}
                  linkedGoal={findLinkedGoal(rec)} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — AI Chat */}
        {showChat && (
          <div className="rec-chat-sticky">
            <AIChatPanel financialContext={financialContext} />
          </div>
        )}
      </div>
    </div>
  );
}
