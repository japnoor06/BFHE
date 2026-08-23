import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const catIcons = { savings: '💰', debt: '🏦', emergency: '🛡️', credit: '💳', investment: '📈', expense: '✂️', tax: '🏛️', insurance: '🔒', goal: '🎯' };
const priMap = {
  critical: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', border: 'rgba(239,68,68,0.25)' },
  high:     { bg: 'rgba(201,217,245,0.12)', color: '#c9d9f5', border: 'rgba(201,217,245,0.25)' },
  medium:   { bg: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: 'rgba(79,142,247,0.25)' },
  low:      { bg: 'rgba(49,196,141,0.12)', color: '#31C48D', border: 'rgba(49,196,141,0.25)' },
};

const RecommendationPanel = ({ aiRecommendations = [], recommendations = [], aiLoading = false }) => {
  const navigate = useNavigate();
  const recs = aiRecommendations.length > 0 ? aiRecommendations : recommendations;
  const isAI = aiRecommendations.length > 0;
  const top3 = recs.slice(0, 3);
  const totalImpact = aiRecommendations.reduce((s, r) => s + (r.projectedScoreImpact || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
      className="card" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Gradient top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isAI ? 'linear-gradient(90deg, #b9a9f7, #a9c8ff, #87d8d0)' : 'linear-gradient(90deg, #ffffff, #c9d9f5)' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800 }}>
            {isAI ? '✨ AI Recommendations' : '💡 Recommendations'}
          </span>
          {recs.length > 0 && (
            <span style={{ background: isAI ? 'var(--purple)' : 'var(--gold)', color: isAI ? 'white' : '#050810', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 800 }}>
              {recs.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {totalImpact > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', background: 'rgba(201,217,245,0.1)', borderRadius: 6, padding: '3px 8px' }}>
              +{totalImpact} pts
            </span>
          )}
          <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--bg-elevated)', borderRadius: 6, padding: '3px 8px' }}>
            {isAI ? 'Powered by Gemini' : 'Rule-based'}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {aiLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: 9, padding: '14px', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 11, width: '90%', borderRadius: 4 }} />
            </div>
          ))}
          <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}>Gemini is analysing your finances…</div>
        </div>
      )}

      {/* Rec cards */}
      {!aiLoading && top3.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {top3.map((rec, i) => {
            const p = priMap[rec.priority] || priMap.medium;
            return (
              <motion.div key={rec._id || rec.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                style={{ background: p.bg, borderRadius: 9, padding: '11px 14px', border: `1px solid ${p.border}`, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{catIcons[rec.category] || '💡'}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: p.color, flex: 1 }}>{rec.title}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {rec.projectedScoreImpact > 0 && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#0DCFAA', background: 'rgba(13,207,170,0.15)', borderRadius: 5, padding: '1px 5px' }}>+{rec.projectedScoreImpact}</span>
                    )}
                    <span style={{ fontSize: 9, fontWeight: 700, color: p.color, background: p.color + '22', borderRadius: 5, padding: '1px 5px', textTransform: 'uppercase' }}>{rec.priority}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, paddingLeft: 20 }}>
                  {rec.description?.length > 120 ? rec.description.substring(0, 120) + '…' : rec.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!aiLoading && top3.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No recommendations right now</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Your financial health looks good!</div>
        </div>
      )}

      {/* CTA */}
      {!aiLoading && recs.length > 3 && (
        <button onClick={() => navigate('/recommendations')}
          style={{ marginTop: 12, width: '100%', padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
            background: isAI ? 'rgba(185,169,247,0.1)' : 'rgba(201,217,245,0.1)',
            border: `1px solid ${isAI ? 'rgba(185,169,247,0.2)' : 'rgba(201,217,245,0.2)'}`,
            color: isAI ? '#9061F9' : 'var(--gold)', transition: 'all 0.2s' }}>
          ✨ View All {recs.length} Recommendations →
        </button>
      )}
      {!aiLoading && recs.length > 0 && recs.length <= 3 && (
        <button onClick={() => navigate('/recommendations')}
          style={{ marginTop: 12, width: '100%', padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-2)', transition: 'all 0.2s' }}>
          Open Recommendations →
        </button>
      )}
    </motion.div>
  );
};

export default RecommendationPanel;
