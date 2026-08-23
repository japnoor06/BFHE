import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/slices/authSlice';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'salaried', phone: '' });
  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) navigate('/onboarding');
  };
  const roles = [
    { value: 'salaried', icon: '💼', label: 'Salaried', desc: 'Fixed monthly salary' },
    { value: 'business', icon: '🏪', label: 'Business Owner', desc: 'MSME / Self-employed' }
  ];

  return (
    <main className="auth-page">
      <div className="auth-ambient" aria-hidden="true" /><div className="auth-grain" aria-hidden="true" />
      <header className="auth-brand"><div className="logo-mark" aria-hidden="true">₹</div><div><div className="auth-wordmark">BFHE</div><div className="auth-subtitle">Bharat Financial Health Engine</div></div></header>
      <section className="auth-card" aria-labelledby="sign-up-title">
        <h1 id="sign-up-title">Create your account</h1><p className="auth-card-subheading">Start your financial health journey today</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field"><label htmlFor="register-name">Full Name</label><input id="register-name" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Arjun Sharma" required /></div>
          <div className="auth-field"><label htmlFor="register-email">Email Address</label><input id="register-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="arjun@example.com" required /></div>
          <div className="auth-field"><label htmlFor="register-phone">Phone (Optional)</label><input id="register-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" maxLength={10} /></div>
          <div className="auth-field"><label htmlFor="register-password">Password</label><input id="register-password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required minLength={6} /></div>
          <div className="auth-field"><span className="auth-role-label">I am a</span><div className="role-grid">{roles.map((role) => <button key={role.value} type="button" className={`role-card${form.role === role.value ? ' is-selected' : ''}`} onClick={() => setForm({ ...form, role: role.value })}><span className="role-icon">{role.icon}</span><span className="role-title">{role.label}</span><span className="role-description">{role.desc}</span></button>)}</div></div>
          <button type="submit" className="auth-submit" disabled={loading}>{loading ? <><span className="spinner" />Creating account...</> : 'Create Account'}</button>
        </form>
      </section>
      <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
    </main>
  );
};

export default RegisterPage;
