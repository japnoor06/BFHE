import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fetchProfile } from '../store/slices/profileSlice';
import { fetchLatestScore, fetchScoreHistory, fetchRecommendations, fetchAIRecommendations } from '../store/slices/scoreSlice';
import { fetchGoals } from '../store/slices/goalsSlice';
import { fetchNetWorth } from '../store/slices/netWorthSlice';
import { fetchAlerts } from '../store/slices/alertsSlice';
import { StatCard, SectionCard, ProgressBar, EmptyState } from '../components/ui';
import { formatINR, getScoreColor } from '../utils/currency';
import RecommendationPanel from '../components/dashboard/RecommendationPanel';

const COLORS = ['#c9d9f5', '#87d8d0', '#91a9d0', '#23D160', '#e4ebf8', '#a9c8ff', '#FF4A4A', '#b9a9f7'];

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { profile, loans } = useSelector(s => s.profile);
  const { latest: score, history, recommendations, aiRecommendations, aiLoading } = useSelector(s => s.score);
  const { goals } = useSelector(s => s.goals);
  const { analysis: nwAnalysis, data: nwData } = useSelector(s => s.netWorth);
  const { unreadCount } = useSelector(s => s.alerts);

  useEffect(() => {
    dispatch(fetchProfile()); dispatch(fetchLatestScore()); dispatch(fetchScoreHistory());
    dispatch(fetchRecommendations()); dispatch(fetchGoals()); dispatch(fetchNetWorth());
    dispatch(fetchAlerts());
  }, [dispatch]);

  // Trigger Gemini once both score and profile are loaded
  useEffect(() => {
    if (score && profile) {
      dispatch(fetchAIRecommendations({ user, score, profile: { ...profile, loans }, goals, netWorth: nwData }));
    }
  }, [score?.totalScore, profile?._id]);

  const SCORE_RADIUS = 80;
  const SCORE_ARC = Math.PI * SCORE_RADIUS; // semicircle arc length ≈ 251.33
  const sc = score?.totalScore ?? 0;
  const grade = score?.grade ?? 'N/A';
  const scoreColor = getScoreColor(grade);
  // Bug fix: score from Prisma has fields top-level (monthlyIncome, savingsRate…),
  // NOT nested under .metrics. score.components likewise does not exist;
  // component scores (dtiScore, savingsScore…) are also top-level.
  const metrics = score ? {
    monthlyIncome:        score.monthlyIncome        || 0,
    totalMonthlyEMI:      score.totalMonthlyEMI      || 0,
    totalMonthlyExpenses: score.totalMonthlyExpenses || 0,
    savingsRate:          score.savingsRate          || 0,
    dtiRatio:             score.dtiRatio             || 0,
    creditUtilization:    score.creditUtilization    || 0,
    emergencyFundMonths:  score.emergencyFundMonths  || 0,
  } : {};
  const components = score ? {
    dtiScore:      score.dtiScore      ?? 0,
    savingsScore:  score.savingsScore  ?? 0,
    emergencyScore:score.emergencyScore?? 0,
    creditScore:   score.creditScore   ?? 0,
    expenseScore:  score.expenseScore  ?? 0,
  } : {};
  // Bug fix: profile from Prisma is flat — expense fields are top-level,
  // NOT nested under profile.expenses
  const expenses = profile || {};
  const expLabels = { houseRent:'Rent', groceries:'Groceries', electricityBill:'Electricity', gasBill:'Gas', waterBill:'Water', internetMobile:'Internet', medicalExpenses:'Medical', vehicleFuel:'Fuel', schoolFees:'Education', otherExpenses:'Other' };
  const expenseData = Object.entries(expLabels)
    .map(([k, name]) => ({ name, value: expenses[k] || 0 }))
    .filter(item => item.value > 0)
    .sort((a,b) => b.value - a.value);
  const trendData = history.slice(-15).map(s => ({ date: new Date(s.createdAt).toLocaleDateString('en-IN',{month:'short',day:'numeric'}), score: s.totalScore }));
  const activeGoals = goals.filter(g=>g.status==='active').slice(0,3);
  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';

  return (
    <div className="dash-page" style={{ padding: '28px 28px 48px' }}>
      {/* Header */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="dash-header" style={{ marginBottom: 24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:900, marginBottom:3 }}>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color:'var(--text-2)', fontSize:14 }}>Financial health overview {score && <span style={{color:'var(--text-3)'}}>· {getRelTime(score.createdAt)}</span>}</p>
        </div>
        {unreadCount > 0 && (
          <motion.button whileHover={{scale:1.02}} onClick={()=>navigate('/alerts')}
            style={{ background:'var(--red-dim)', border:'1px solid rgba(240,82,82,0.3)', borderRadius:9, padding:'9px 16px', color:'var(--red)', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'var(--font-body)' }}>
            🔔 {unreadCount} Alert{unreadCount>1?'s':''} →
          </motion.button>
        )}
      </motion.div>

      {/* Stat Row */}
      <div className="dash-stats" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:12, marginBottom:18 }}>
        <StatCard label="Monthly Income" value={formatINR(metrics.monthlyIncome)} sub="After tax" color="var(--teal)" icon="💵" delay={0} />
        <StatCard label="Total EMI" value={formatINR(metrics.totalMonthlyEMI)} sub={`${metrics.dtiRatio?.toFixed(1)??0}% of income`} color={metrics.dtiRatio>50?'var(--red)':'var(--gold)'} icon="🏦" delay={0.05} />
        <StatCard label="Savings Rate" value={`${metrics.savingsRate?.toFixed(1)??0}%`} sub="Monthly" color={metrics.savingsRate>=20?'var(--green)':metrics.savingsRate>=10?'var(--gold)':'var(--red)'} icon="💰" delay={0.1} />
        <StatCard label="Net Worth" value={nwAnalysis?formatINR(nwAnalysis.netWorth):'—'} sub={nwAnalysis?.netWorthGrade??'Add assets'} color="var(--purple)" icon="📈" delay={0.15} />
        <StatCard label="Credit Usage" value={`${metrics.creditUtilization?.toFixed(1)??0}%`} sub={metrics.creditUtilization>30?'Above safe limit':'Within safe limit'} color={metrics.creditUtilization>50?'var(--red)':metrics.creditUtilization>30?'var(--gold)':'var(--green)'} icon="💳" delay={0.2} />
        <StatCard label="Emergency Fund" value={`${metrics.emergencyFundMonths?.toFixed(1)??0} mo`} sub={metrics.emergencyFundMonths>=6?'Fully funded':'Target: 6 months'} color={metrics.emergencyFundMonths>=6?'var(--green)':metrics.emergencyFundMonths>=3?'var(--gold)':'var(--red)'} icon="🛡️" delay={0.25} />
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid" style={{ gap:16, alignItems:'start' }}>

        {/* LEFT — Score */}
        <div className="dash-left" style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Score Gauge */}
          <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} transition={{delay:0.1}} className="card" style={{ textAlign:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:180, height:180, borderRadius:'50%', background: scoreColor+'12', filter:'blur(35px)', pointerEvents:'none' }} />
            <div style={{ position:'relative' }}>
              {/* SVG Arc Gauge */}
              <svg width="200" height="120" viewBox="0 0 200 120" style={{ display:'block', margin:'0 auto' }}>
                {/* track */}
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--bg-elevated)" strokeWidth="16" strokeLinecap="round" />
                {/* score fill */}
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={scoreColor} strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={`${(sc/100)*SCORE_ARC} ${SCORE_ARC}`} style={{ transition:'stroke-dasharray 1s ease' }} />
                {/* labels */}
                <text x="18" y="115" fill="var(--text-3)" fontSize="10" textAnchor="middle">0</text>
                <text x="182" y="115" fill="var(--text-3)" fontSize="10" textAnchor="middle">100</text>
              </svg>
              <div style={{ marginTop:-16, marginBottom:8 }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:900, color:scoreColor, lineHeight:1 }}>{sc}</div>
                <span className={`badge ${grade==='Excellent'?'badge-green':grade==='Good'?'badge-teal':grade==='Fair'?'badge-gold':'badge-red'}`} style={{marginTop:6}}>{grade}</span>
              </div>
              <p style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.5 }}>{getGradeMsg(grade)}</p>
            </div>
            {/* Breakdown */}
            <div style={{ marginTop:16, borderTop:'1px solid var(--border)', paddingTop:14, textAlign:'left' }}>
              <div style={{ fontSize:10, fontWeight:800, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Score Breakdown</div>
              {[['dtiScore','DTI Ratio','📊'],['savingsScore','Savings','💰'],['emergencyScore','Emergency','🛡️'],['creditScore','Credit','💳'],['expenseScore','Expenses','🧾']].map(([key,label,icon])=>{
                const val = components[key]??0;
                const c = val>=75?'var(--green)':val>=50?'var(--gold)':'var(--red)';
                return (
                  <div key={key} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:11, color:'var(--text-2)' }}>{icon} {label}</span>
                      <span style={{ fontSize:11, fontWeight:800, color:c }}>{val}</span>
                    </div>
                    <ProgressBar value={val} color={c} height={4} />
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Metrics */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="card">
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, marginBottom:14 }}>Key Ratios</div>
            {[
              { label:'Debt-to-Income', value:metrics.dtiRatio??0, max:100, reverse:true, good:30, warn:50, suffix:'%' },
              { label:'Savings Rate', value:metrics.savingsRate??0, max:50, reverse:false, good:20, warn:10, suffix:'%' },
              { label:'Credit Utilization', value:metrics.creditUtilization??0, max:100, reverse:true, good:30, warn:50, suffix:'%' },
            ].map(item=>{
              const good = item.reverse?item.value<=item.good:item.value>=item.good;
              const warn = item.reverse?item.value<=item.warn:item.value>=item.warn;
              const color = good?'var(--green)':warn?'var(--gold)':'var(--red)';
              return (
                <div key={item.label} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'var(--text-2)' }}>{item.label}</span>
                    <span style={{ fontSize:12, fontWeight:800, color }}>{item.value.toFixed(1)}{item.suffix}</span>
                  </div>
                  <ProgressBar value={item.value} max={item.max} color={color} height={5} />
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* RIGHT — Charts & Goals */}
        <div className="dash-right" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Score Trend */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.12}} className="card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800 }}>Score Trend</div>
              <span style={{ fontSize:12, color:'var(--text-3)' }}>{trendData.length} updates</span>
            </div>
            {trendData.length>1?(
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={trendData} margin={{top:5,right:5,left:-28,bottom:0}}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={scoreColor} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={scoreColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:'var(--text-3)',fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={{fill:'var(--text-3)',fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v)=>[v,'Score']} contentStyle={{ background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }} itemStyle={{ color: '#fff', fontWeight: 600 }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Area type="monotone" dataKey="score" stroke={scoreColor} strokeWidth={2.5} fill="url(#sg)" dot={false} activeDot={{r:5,fill:scoreColor,strokeWidth:2,stroke:'var(--bg-card)'}}/>
                </AreaChart>
              </ResponsiveContainer>
            ):<EmptyState icon="📈" title="Not enough data" subtitle="Update profile a few times to see trends"/>}
          </motion.div>

          {/* Expense + Goals Row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Expense Pie */}
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.18}} className="card">
              <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, marginBottom:4 }}>Expense Breakdown</div>
              <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:10 }}>{formatINR(Object.keys(expLabels).reduce((s,k)=>s+(expenses[k]||0),0))}/mo</div>
              {expenseData.length>0?(
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={expenseData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                        {expenseData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} stroke="none"/>)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [formatINR(value), name]} contentStyle={{ background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }} itemStyle={{ color: '#fff', fontWeight: 600 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {expenseData.slice(0,4).map((item,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:COLORS[i], flexShrink:0 }}/>
                        <span style={{ color:'var(--text-2)' }}>{item.name}</span>
                      </div>
                      <span style={{ fontWeight:700 }}>{formatINR(item.value)}</span>
                    </div>
                  ))}
                </>
              ):<EmptyState icon="📊" title="No data" subtitle="Add expenses in profile"/>}
            </motion.div>

            {/* Goals */}
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.22}} className="card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800 }}>🎯 Goals</div>
                <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/goals')} style={{ fontSize:12 }}>All →</button>
              </div>
              {activeGoals.length>0?(
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {activeGoals.map(goal=>{
                    const pct=Math.min(100,Math.round((goal.currentAmount/goal.targetAmount)*100));
                    return (
                      <div key={goal.id} style={{ background:'var(--bg-elevated)', borderRadius:9, padding:'10px 12px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ fontSize:13, fontWeight:700 }}>{goal.icon} {goal.title}</span>
                          <span style={{ fontSize:12, fontWeight:800, color:'var(--gold)' }}>{pct}%</span>
                        </div>
                        <ProgressBar value={pct} color={pct>=75?'var(--green)':pct>=40?'var(--gold)':'var(--blue)'} height={5}/>
                        <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:10, color:'var(--text-3)' }}>
                          <span>{formatINR(goal.currentAmount)}</span><span>{formatINR(goal.targetAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/goals')} style={{ width:'100%', marginTop:4 }}>+ New Goal</button>
                </div>
              ):<EmptyState icon="🎯" title="No goals yet" subtitle="Set your first financial goal" action={<button className="btn btn-primary btn-sm" onClick={()=>navigate('/goals')}>Set Goal</button>}/>}
            </motion.div>
          </div>

          {/* Recommendations Panel */}
          <RecommendationPanel aiRecommendations={aiRecommendations} recommendations={recommendations} aiLoading={aiLoading} />
        </div>
      </div>
    </div>
  );
}

const getGradeMsg = (g) => ({ Excellent:'🎉 Outstanding!', Good:'👍 Strong, keep going.', Fair:'📊 Room to grow.', Poor:'⚠️ Act now.', Critical:'🚨 Urgent action needed.' }[g]||'Complete profile to see score.');
const getRelTime = (d) => { const m=Math.floor((Date.now()-new Date(d).getTime())/60000); if(m<1)return'just now'; if(m<60)return`${m}m ago`; const h=Math.floor(m/60); if(h<24)return`${h}h ago`; return`${Math.floor(h/24)}d ago`; };
