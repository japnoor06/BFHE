import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/slices/authSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      const u = result.payload.user;
      navigate(u.isOnboardingComplete ? '/dashboard' : '/onboarding');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-ambient" aria-hidden="true" /><div className="auth-grain" aria-hidden="true" />
      <header className="auth-brand"><div className="logo-mark" aria-hidden="true">₹</div><div><div className="auth-wordmark">BFHE</div><div className="auth-subtitle">Bharat Financial Health Engine</div></div></header>
      <section className="auth-card" aria-labelledby="sign-in-title">
        <h1 id="sign-in-title">Sign in to your account</h1><p className="auth-card-subheading">Welcome back</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field"><label htmlFor="login-email">Email Address</label><input id="login-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required autoComplete="email" /></div>
          <div className="auth-field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required autoComplete="current-password" /></div>
          <button type="submit" className="auth-submit" disabled={loading}>{loading ? <><span className="spinner" />Signing in...</> : 'Sign In'}</button>
        </form>
      </section>
      <p className="auth-footer">Don't have an account? <Link to="/register">Create one</Link></p>
    </main>
  );
};

export default LoginPage;
