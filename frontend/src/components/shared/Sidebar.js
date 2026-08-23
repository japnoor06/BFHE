import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { logout } from '../../store/slices/authSlice';

const NAV = [
  { path: '/expenses', icon: '+', label: 'Add Expense' },
  { path: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { path: '/net-worth', icon: '◈', label: 'Net Worth' },
  { path: '/goals', icon: '◎', label: 'Goals' },
  { path: '/budget', icon: '◧', label: 'Budget Planner' },
  { path: '/simulation', icon: '⟳', label: 'Simulator' },
  { path: '/inflation', icon: '〽', label: 'Inflation' },
  { path: '/recommendations', icon: '✦', label: 'AI Recommendations', aibadge: true },
  { path: '/alerts', icon: '◉', label: 'Alerts', badge: true },
];

export default function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { unreadCount } = useSelector(s => s.alerts);
  const { aiRecommendations } = useSelector(s => s.score);

  const aiCount = aiRecommendations?.filter(r => r.priority === 'critical' || r.priority === 'high').length ?? 0;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={s.logoMark}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#050810' }}>₹</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={s.logoText}>BFHE</div>
          <div style={s.logoSub}>Bharat Financial Health Engine</div>
        </div>
        
        {/* Mobile Close Button */}
        <button className="mobile-close-btn" onClick={onClose} style={s.closeBtn}>
          ✕
        </button>
      </div>

      {/* User card */}
      <div style={s.userCard}>
        <div style={s.avatar}>{user?.name?.charAt(0)?.toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.userName}>{user?.name}</div>
          <div style={s.userRole}>{user?.role === 'salaried' ? '💼 Salaried' : '🏪 Business'}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={s.nav}>
        <div style={s.navLabel}>MENU</div>
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemActive : {}) })}
          >
            {({ isActive }) => (
              <>
                <span style={{ ...s.navIcon, ...(isActive ? { color: 'var(--gold)' } : {}) }}>{item.icon}</span>
                <span style={s.navLabel2}>{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <span style={s.alertBadge}>{unreadCount}</span>
                )}
                {item.aibadge && aiCount > 0 && (
                  <span style={{ ...s.alertBadge, background: '#9061F9' }}>{aiCount}</span>
                )}
                {isActive && (
                  <motion.div layoutId="navIndicator" style={s.activeIndicator} initial={false} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Bottom actions */}
      <div style={s.bottom}>
        <button onClick={() => navigate('/onboarding')} style={s.updateBtn}>
          ✏️ Update Profile
        </button>
        <button onClick={() => { dispatch(logout()); navigate('/login'); }} style={s.logoutBtn}>
          Sign Out →
        </button>
      </div>
    </aside>
  );
}

const s = {
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 18px', borderBottom: '1px solid var(--border)', position: 'relative' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 18, cursor: 'pointer', padding: '5px' },
  logoMark: { width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(180deg, #ffffff, #c9d9f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoText: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, letterSpacing: 2, color: 'var(--text)' },
  logoSub: { fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5 },
  userCard: { margin: '12px 12px 4px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid rgba(201,217,245,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--gold)', flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 11, color: 'var(--text-3)' },
  nav: { padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  navLabel: { fontSize: 9, fontWeight: 800, color: 'var(--text-3)', letterSpacing: 1.5, paddingLeft: 10, marginBottom: 6, textTransform: 'uppercase' },
  navLabel2: { fontSize: 13.5, fontWeight: 600, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, color: 'var(--text-2)', textDecoration: 'none', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' },
  navItemActive: { color: 'var(--text)', background: 'rgba(201,217,245,0.08)', border: '1px solid rgba(201,217,245,0.15)' },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center', color: 'var(--text-3)', flexShrink: 0 },
  activeIndicator: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: 'var(--gold)', borderRadius: '0 2px 2px 0' },
  alertBadge: { background: 'var(--red)', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800 },
  bottom: { padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 },
  updateBtn: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, textAlign: 'left', transition: 'all 0.15s' },
  logoutBtn: { background: 'none', border: 'none', color: 'var(--text-3)', padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', textAlign: 'left' },
};
