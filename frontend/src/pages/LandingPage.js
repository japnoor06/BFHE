import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll } from 'framer-motion';
import './LandingPageTheme.css';

const features = [
  { icon: '01', title: 'Financial Health Score', description: 'See one clear score built from income, debt, savings, credit usage, and spending habits.', accent: '#c9d9f5' },
  { icon: '02', title: 'Net Worth Tracker', description: 'Track assets and liabilities in one place, with an easy-to-read allocation breakdown.', accent: '#87d8d0' },
  { icon: '03', title: 'Goal Planning', description: 'Turn your financial goals into a practical monthly plan and track your progress.', accent: '#a9c8ff' },
  { icon: '04', title: 'Smart Budgeting', description: 'Build a budget that fits your income, expenses, and savings priorities.', accent: '#b9a9f7' },
  { icon: '05', title: 'Financial Simulator', description: 'Test salary hikes, debt payments, and expense changes before you make a decision.', accent: '#ffb07a' },
  { icon: '06', title: 'Actionable Alerts', description: 'Stay ahead of high debt, low savings, and upcoming goal deadlines.', accent: '#ff8e8e' },
];

const steps = [
  ['01', 'Create your free account', 'Sign up in seconds with your name and role.'],
  ['02', 'Add your financial details', 'Share your income, expenses, savings, and loans.'],
  ['03', 'Get your score', 'Receive a detailed financial-health breakdown instantly.'],
  ['04', 'Track and improve', 'Use tailored recommendations to build stronger financial habits.'],
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => scrollY.on('change', (value) => setScrolled(value > 24)), [scrollY]);

  const subscribe = (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage('Enter a valid email address.');
      return;
    }
    setMessage('Thanks — you are on the list.');
    setEmail('');
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="landing-page">
      <style>{landingStyles}</style>
      <motion.nav className="landing-nav" animate={{ backgroundColor: scrolled ? 'rgba(4,4,6,.88)' : 'rgba(4,4,6,.46)' }}>
        <button className="brand" type="button" onClick={() => scrollTo('top')} aria-label="Go to top"><span>₹</span><b>BFHE</b></button>
        <div className="landing-links"><button type="button" onClick={() => scrollTo('features')}>Features</button><button type="button" onClick={() => scrollTo('how-it-works')}>How it works</button><button type="button" onClick={() => scrollTo('about')}>About</button></div>
        <div className="nav-actions"><button className="btn btn-secondary sign-in" type="button" onClick={() => navigate('/login')}>Sign in</button><button className="btn btn-primary" type="button" onClick={() => navigate('/register')}>Get started</button></div>
      </motion.nav>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-hero-video" aria-hidden="true">
            <video autoPlay muted loop playsInline>
              <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="landing-hero-grid">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <p className="eyebrow"><i /> India-first financial health platform</p>
              <h1>Upgrade your <span>financial</span><br />lifestyle, <em>simply.</em></h1>
              <p className="hero-copy">Understand your money, build better habits, and make confident financial decisions with one personalized health score.</p>
              <div className="hero-actions"><button className="btn btn-primary large" type="button" onClick={() => navigate('/register')}>Get your free score</button><button className="text-button" type="button" onClick={() => scrollTo('how-it-works')}>See how it works <span>→</span></button></div>
              <p className="trust"><b>2,400+</b> professionals are building stronger financial futures with BFHE.</p>
            </motion.div>
          </div>
        </section>

        <section className="landing-marquee"><p>Built for India’s financial ecosystem</p><div>{['SBI', 'HDFC', 'ICICI', 'Bajaj', 'Zerodha', 'Groww', 'Razorpay', 'PhonePe'].map((company) => <span key={company}>{company}</span>)}</div></section>

        <section className="landing-section" id="features"><div className="section-heading"><p className="eyebrow">Everything you need</p><h2>Take control of your financial journey</h2><p>Simple tools and practical insights, all designed to help you make progress.</p></div><div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.title}><span style={{ color: feature.accent }}>{feature.icon}</span><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div></section>

        <section className="landing-stats"><div><b>One score</b><span>for your whole financial picture</span></div><div><b>Six tools</b><span>to help you improve with clarity</span></div><div><b>Free forever</b><span>no credit card or KYC required</span></div></section>

        <section className="landing-section how-section" id="how-it-works"><div className="section-heading"><p className="eyebrow">How it works</p><h2>Your first score takes minutes</h2></div><div className="step-list">{steps.map(([number, title, description]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></section>

        <section className="landing-testimonials" id="about"><div className="section-heading"><p className="eyebrow">Made for real life</p><h2>Clearer money decisions start here</h2></div><div className="testimonial-grid"><blockquote>“The score made my finances feel manageable for the first time.”<footer>Priya Mehta <span>Software Engineer, Bengaluru</span></footer></blockquote><blockquote>“I finally know which debt to prioritise and why.”<footer>Rahul Gupta <span>Business Owner, Delhi</span></footer></blockquote><blockquote>“It gives me a realistic plan for my home down payment.”<footer>Ananya Singh <span>Product Manager, Mumbai</span></footer></blockquote></div></section>

        <section className="landing-final-cta"><p className="eyebrow">Your next step</p><h2>Start your financial health journey today.</h2><p>Get your personalized score and a clear path forward — completely free.</p><button className="btn btn-primary large" type="button" onClick={() => navigate('/register')}>Get your free score</button><small>No credit card · No KYC · 100% free</small></section>
      </main>

      <footer className="landing-footer"><div><div><button className="brand" type="button" onClick={() => scrollTo('top')}><span>₹</span><b>BFHE</b></button><p>Bharat Financial Health Engine helps Indians understand, manage, and improve their financial wellbeing.</p></div><form onSubmit={subscribe}><label htmlFor="newsletter">Stay in the loop</label><div><input id="newsletter" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="your@email.com" /><button type="submit">Subscribe</button></div>{message && <small role="status">{message}</small>}</form></div><p className="footer-bottom">© 2026 Bharat Financial Health Engine. All rights reserved.</p></footer>
    </div>
  );
}

const landingStyles = `
  .landing-page { min-height:100vh; background:#040406; color:#f7f8fc; font-family:Inter,system-ui,sans-serif; overflow:hidden; }
  .landing-nav { position:fixed; inset:0 0 auto; height:70px; z-index:10; display:flex; align-items:center; justify-content:space-between; padding:0 clamp(20px,4vw,56px); border-bottom:1px solid rgba(255,255,255,.1); backdrop-filter:blur(18px); }
  .brand { border:0; background:none; color:#fff; display:flex; align-items:center; gap:10px; cursor:pointer; font:inherit; letter-spacing:.12em; } .brand span { display:grid; place-items:center; width:32px; height:32px; color:#111318; background:#e8eef9; border-radius:8px; font-weight:900; letter-spacing:0; }
  .landing-links { display:flex; gap:28px; } .landing-links button,.text-button { border:0; background:none; color:rgba(255,255,255,.7); cursor:pointer; font:inherit; } .landing-links button:hover,.text-button:hover { color:#fff; }
  .nav-actions,.hero-actions { display:flex; align-items:center; gap:12px; } .btn { border-radius:8px; padding:11px 18px; border:1px solid rgba(255,255,255,.22); cursor:pointer; font:700 14px Inter,system-ui,sans-serif; } .btn-primary { color:#111318; background:linear-gradient(#fff,#d7e2f2); border-color:#fff; } .btn-secondary { color:#fff; background:transparent; } .large { padding:15px 24px; }
  .landing-hero { position:relative; min-height:740px; padding:150px clamp(20px,4vw,56px) 90px; display:grid; place-items:center; isolation:isolate; } .landing-hero-grid { display:grid; grid-template-columns:minmax(0,760px); justify-content:center; width:100%; }
  .eyebrow { color:#c9d9f5; font-size:11px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; } .eyebrow i { display:inline-block; width:7px; height:7px; margin-right:8px; border-radius:50%; background:#87d8d0; box-shadow:0 0 13px #87d8d0; } h1,h2,h3,p { margin-top:0; } h1 { font-size:clamp(42px,6vw,76px); line-height:1.03; letter-spacing:-.06em; margin:20px 0; } h1 span { color:#c9d9f5; } h1 em { color:#aab4c6; font-family:Georgia,serif; font-weight:400; } .hero-copy { max-width:540px; color:rgba(255,255,255,.68); font-size:18px; line-height:1.65; } .hero-actions { margin-top:32px; } .text-button span { margin-left:6px; font-size:18px; } .trust { margin-top:26px; color:rgba(255,255,255,.48); font-size:13px; } .trust b { color:#c9d9f5; }
  .landing-marquee { border-block:1px solid rgba(255,255,255,.1); padding:28px 20px; text-align:center; } .landing-marquee p { color:rgba(255,255,255,.4); text-transform:uppercase; font-size:10px; letter-spacing:.14em; } .landing-marquee div { display:flex; justify-content:center; flex-wrap:wrap; gap:clamp(22px,5vw,62px); color:rgba(255,255,255,.36); font-weight:800; }
  .landing-section,.landing-testimonials { max-width:1200px; margin:auto; padding:100px clamp(20px,4vw,56px); }.section-heading{text-align:center;max-width:650px;margin:0 auto 52px}.section-heading h2{font-size:clamp(30px,4vw,46px);letter-spacing:-.05em;margin-bottom:14px}.section-heading>p:last-child{color:rgba(255,255,255,.55);line-height:1.6}.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.feature-card{padding:25px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.025)}.feature-card>span{font-size:13px;font-weight:900}.feature-card h3{font-size:17px;margin:24px 0 9px}.feature-card p,.step-list p{color:rgba(255,255,255,.52);font-size:14px;line-height:1.65}.landing-stats{display:grid;grid-template-columns:repeat(3,1fr);border-block:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.025);padding:38px clamp(20px,8vw,140px);gap:30px;text-align:center}.landing-stats b{display:block;color:#c9d9f5;font-size:21px}.landing-stats span{display:block;color:rgba(255,255,255,.5);font-size:13px;margin-top:7px}.how-section{max-width:1000px}.step-list article{display:grid;grid-template-columns:70px 1fr;gap:20px;padding:23px 0;border-bottom:1px solid rgba(255,255,255,.1)}.step-list article>span{color:#c9d9f5;font-size:12px;font-weight:800;letter-spacing:.1em}.step-list h3{margin:0;font-size:20px}.step-list p{margin:7px 0 0}.landing-testimonials{max-width:none;background:rgba(255,255,255,.02)}.testimonial-grid{max-width:1100px;margin:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.testimonial-grid blockquote{margin:0;padding:25px;border:1px solid rgba(255,255,255,.1);border-radius:14px;color:rgba(255,255,255,.8);font-size:16px;line-height:1.65}.testimonial-grid footer{margin-top:24px;font-size:13px;font-weight:700}.testimonial-grid footer span{display:block;margin-top:3px;color:rgba(255,255,255,.42);font-weight:400}.landing-final-cta{text-align:center;padding:110px 20px;background:radial-gradient(ellipse,rgba(177,204,246,.15),transparent 60%)}.landing-final-cta h2{font-size:clamp(34px,5vw,56px);max-width:680px;margin:15px auto;letter-spacing:-.05em}.landing-final-cta>p:not(.eyebrow){color:rgba(255,255,255,.58);margin:0 auto 30px}.landing-final-cta small{display:block;margin-top:16px;color:rgba(255,255,255,.37)}.landing-footer{border-top:1px solid rgba(255,255,255,.1);padding:55px clamp(20px,4vw,56px) 25px;color:rgba(255,255,255,.55)}.landing-footer>div{max-width:1200px;margin:auto;display:flex;justify-content:space-between;gap:50px}.landing-footer p{max-width:460px;margin-top:20px;line-height:1.65}.landing-footer form{min-width:min(100%,390px)}.landing-footer label{display:block;color:#fff;font-weight:700;margin-bottom:10px}.landing-footer form>div{display:flex;border:1px solid rgba(255,255,255,.2);border-radius:8px;overflow:hidden}.landing-footer input{flex:1;min-width:0;padding:11px;background:transparent;border:0;color:#fff;outline:0}.landing-footer form button{border:0;background:#e8eef9;color:#111318;padding:0 15px;font-weight:800;cursor:pointer}.landing-footer form small{display:block;margin-top:8px;color:#87d8d0}.footer-bottom{max-width:1200px;margin:45px auto 0!important;padding-top:20px;border-top:1px solid rgba(255,255,255,.1);font-size:12px}
  @media(max-width:760px){.landing-links,.sign-in{display:none}.landing-nav{height:62px;padding:0 20px}.landing-hero{min-height:auto;padding:120px 20px 70px}.landing-hero-grid,.feature-grid,.testimonial-grid,.landing-stats{grid-template-columns:1fr;gap:18px}.landing-footer>div{flex-direction:column;gap:25px}.landing-section,.landing-testimonials{padding:70px 20px}.hero-actions{align-items:flex-start;flex-direction:column}}
`;
