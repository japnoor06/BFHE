// import React, { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { motion } from 'framer-motion';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// import { ProgressBar, PageHeader, StatCard, InfoBox } from '../components/ui';
// import { formatINR } from '../utils/currency';

// export default function BudgetPage() {
//   const { latest: score } = useSelector(s => s.score);
//   const { profile } = useSelector(s => s.profile);
//   const metrics = score?.metrics ?? {};
//   const income = metrics.monthlyIncome || 0;

//   const [percents, setPercents] = useState({ needs: 50, wants: 30, savings: 20 });

//   const needs   = Math.round(income * percents.needs   / 100);
//   const wants   = Math.round(income * percents.wants   / 100);
//   const savings = Math.round(income * percents.savings / 100);

//   const expenses    = profile?.expenses ?? {};
//   const actualNeeds   = (expenses.houseRent||0) + (expenses.groceries||0) + (expenses.electricityBill||0) + (expenses.gasBill||0) + (expenses.waterBill||0) + (expenses.internetMobile||0) + (expenses.medicalExpenses||0) + (metrics.totalMonthlyEMI||0);
//   const actualWants   = (expenses.vehicleFuel||0) + (expenses.otherExpenses||0);
//   const actualSavings = income - actualNeeds - actualWants;

//   const budgetData = [
//     { name: 'Needs (50%)',    budget: needs,   actual: actualNeeds,              color: '#F0B429' },
//     { name: 'Wants (30%)',    budget: wants,   actual: actualWants,              color: '#4F8EF7' },
//     { name: 'Savings (20%)', budget: savings, actual: Math.max(0, actualSavings), color: '#31C48D' },
//   ];

//   /**
//    * Fix: slider adjustment that guarantees the three values always sum to exactly 100.
//    * Strategy: when one slider moves, distribute the remainder proportionally between
//    * the other two based on their current ratio — preventing any category going negative.
//    */
//   const handleSlider = (key, val) => {
//     const clamped = Math.max(5, Math.min(90, val));
//     const remaining = 100 - clamped;
//     const others = Object.keys(percents).filter(k => k !== key);
//     const otherSum = others.reduce((s, k) => s + percents[k], 0);

//     let newPercents = { ...percents, [key]: clamped };

//     if (otherSum === 0) {
//       // Edge case: distribute evenly
//       newPercents[others[0]] = Math.floor(remaining / 2);
//       newPercents[others[1]] = remaining - newPercents[others[0]];
//     } else {
//       // Distribute proportionally so neither goes below 5
//       let a = Math.round((percents[others[0]] / otherSum) * remaining);
//       let b = remaining - a;
//       // Enforce minimum of 5 for each
//       if (a < 5) { a = 5; b = remaining - 5; }
//       if (b < 5) { b = 5; a = remaining - 5; }
//       newPercents[others[0]] = a;
//       newPercents[others[1]] = b;
//     }

//     setPercents(newPercents);
//   };

//   const NEEDS_ITEMS = [
//     { label: 'House Rent',      key: 'houseRent'       },
//     { label: 'Groceries',       key: 'groceries'       },
//     { label: 'Electricity',     key: 'electricityBill' },
//     { label: 'Gas',             key: 'gasBill'         },
//     { label: 'Water',           key: 'waterBill'       },
//     { label: 'Internet & Mobile', key: 'internetMobile' },
//     { label: 'Medical',         key: 'medicalExpenses' },
//     { label: 'Loan EMIs',       value: metrics.totalMonthlyEMI||0 }
//   ];

//   return (
//     <div style={{ padding:'28px 28px 48px' }}>
//       <PageHeader title="◧ Smart Budget Planner" subtitle="Optimize your spending using the 50/30/20 rule"/>

//       <InfoBox type="info">
//         <strong>The 50/30/20 Rule:</strong> Allocate 50% to needs (rent, groceries, EMIs), 30% to wants (entertainment, dining), and 20% to savings &amp; investments.
//       </InfoBox>

//       <div style={{ height:16 }}/>

//       <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:24 }}>
//         <StatCard label="Monthly Income"  value={formatINR(income)}   sub="After tax"                           color="var(--teal)"  icon="💵" delay={0}/>
//         <StatCard label="Needs Budget"    value={formatINR(needs)}    sub={`₹${actualNeeds.toLocaleString('en-IN')} actual`}   color={actualNeeds>needs?'var(--red)':'var(--gold)'}  icon="🏠" delay={0.05}/>
//         <StatCard label="Wants Budget"    value={formatINR(wants)}    sub={`₹${actualWants.toLocaleString('en-IN')} actual`}   color={actualWants>wants?'var(--red)':'var(--blue)'}  icon="🛍️" delay={0.1}/>
//         <StatCard label="Savings Target"  value={formatINR(savings)}  sub={`₹${Math.max(0,actualSavings).toLocaleString('en-IN')} actual`} color={actualSavings<savings?'var(--red)':'var(--green)'} icon="💰" delay={0.15}/>
//       </div>

//       <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
//         {/* Sliders */}
//         <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="card">
//           <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, marginBottom:20 }}>Customize Your Budget Split</div>
//           {[
//             { key:'needs',   label:'🏠 Needs',   color:'var(--gold)',  desc:'Essentials: rent, food, utilities, EMIs' },
//             { key:'wants',   label:'🎉 Wants',   color:'var(--blue)',  desc:'Lifestyle: dining, travel, shopping'     },
//             { key:'savings', label:'💰 Savings', color:'var(--green)', desc:'Future: investments, emergency fund, goals' }
//           ].map(item=>(
//             <div key={item.key} style={{ marginBottom:20 }}>
//               <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
//                 <div>
//                   <div style={{ fontSize:14, fontWeight:700 }}>{item.label} <span style={{ color:item.color }}>{percents[item.key]}%</span></div>
//                   <div style={{ fontSize:11, color:'var(--text-3)' }}>{item.desc}</div>
//                 </div>
//                 <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:item.color }}>{formatINR(Math.round(income*percents[item.key]/100))}</div>
//               </div>
//               <input type="range" min="5" max="90" value={percents[item.key]}
//                 onChange={e=>handleSlider(item.key, parseInt(e.target.value))}
//                 style={{ width:'100%', accentColor:item.color }}/>
//             </div>
//           ))}
//           <div style={{ background:'var(--bg-elevated)', borderRadius:9, padding:'10px 14px', fontSize:12, color:'var(--text-2)' }}>
//             Total: {percents.needs+percents.wants+percents.savings}%
//             {percents.needs+percents.wants+percents.savings !== 100 &&
//               <span style={{color:'var(--red)'}}> ⚠️ Must equal 100%</span>}
//           </div>
//         </motion.div>

//         {/* Budget vs Actual Chart */}
//         <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="card">
//           <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, marginBottom:16 }}>Budget vs Actual</div>
//           <ResponsiveContainer width="100%" height={220}>
//             <BarChart data={budgetData} margin={{top:5,right:5,left:-20,bottom:0}}>
//               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
//               <XAxis dataKey="name" tick={{fill:'var(--text-3)',fontSize:10}} axisLine={false} tickLine={false}/>
//               <YAxis tick={{fill:'var(--text-3)',fontSize:11}} axisLine={false} tickLine={false}/>
//               <Tooltip formatter={v=>[formatINR(v)]} contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/>
//               <Bar dataKey="budget" name="Budget" radius={[4,4,0,0]} fill="rgba(255,255,255,0.08)"/>
//               <Bar dataKey="actual" name="Actual"  radius={[4,4,0,0]}>
//                 {budgetData.map((entry,i)=><Cell key={i} fill={entry.actual>entry.budget?'var(--red)':entry.color}/>)}
//               </Bar>
//             </BarChart>
//           </ResponsiveContainer>
//           <div style={{ display:'flex', gap:16, marginTop:8, justifyContent:'center', fontSize:12 }}>
//             <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10,height:10,borderRadius:2,background:'rgba(255,255,255,0.15)' }}/><span style={{ color:'var(--text-2)' }}>Budget</span></div>
//             <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10,height:10,borderRadius:2,background:'var(--gold)' }}/><span style={{ color:'var(--text-2)' }}>Actual</span></div>
//           </div>
//         </motion.div>
//       </div>

//       {/* Needs Breakdown */}
//       <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="card" style={{ marginTop:16 }}>
//         <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, marginBottom:16 }}>🏠 Needs Breakdown</div>
//         <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
//           {NEEDS_ITEMS.map(item=>{
//             const actual = item.value !== undefined ? item.value : (expenses[item.key]||0);
//             const budgetShare = Math.round(needs / NEEDS_ITEMS.length);
//             const over = actual > budgetShare;
//             return (
//               <div key={item.label} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'12px 14px' }}>
//                 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
//                   <span style={{ fontSize:13, fontWeight:600 }}>{item.label}</span>
//                   <span style={{ fontSize:13, fontWeight:800, color:over?'var(--red)':'var(--text)' }}>{formatINR(actual)}</span>
//                 </div>
//                 <ProgressBar value={actual} max={Math.max(actual,budgetShare)} color={over?'var(--red)':'var(--gold)'} height={4}/>
//                 {over&&<div style={{ fontSize:10, color:'var(--red)', marginTop:4 }}>Over budget</div>}
//               </div>
//             );
//           })}
//         </div>
//       </motion.div>
//     </div>
//   );
// }
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ProgressBar, PageHeader, StatCard, InfoBox } from '../components/ui';
import { formatINR } from '../utils/currency';
import { fetchProfile } from '../store/slices/profileSlice';
import { fetchLatestScore } from '../store/slices/scoreSlice';

export default function BudgetPage() {
  const dispatch = useDispatch();
  const { latest: score } = useSelector(s => s.score);
  const { profile } = useSelector(s => s.profile);

  // Fetch data on mount so page works even when navigated to directly
  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchLatestScore());
  }, [dispatch]);
  // Bug fix: score from Prisma has fields top-level, NOT nested under .metrics
  const income = score
    ? (score.monthlyIncome || score.metrics?.monthlyIncome || 0)
    : 0;
  const totalMonthlyEMI = score
    ? (score.totalMonthlyEMI || score.metrics?.totalMonthlyEMI || 0)
    : 0;

  const [percents, setPercents] = useState({ needs: 50, wants: 30, savings: 20 });

  const needs = Math.round(income * percents.needs / 100);
  const wants = Math.round(income * percents.wants / 100);
  const savings = Math.round(income * percents.savings / 100);

  // Bug fix: profile from Prisma is flat — expense fields are top-level,
  // NOT nested under profile.expenses
  const expenses = profile || {};
  const actualNeeds = (expenses.houseRent || 0) + (expenses.groceries || 0) + (expenses.electricityBill || 0) + (expenses.gasBill || 0) + (expenses.waterBill || 0) + (expenses.internetMobile || 0) + (expenses.medicalExpenses || 0) + totalMonthlyEMI;
  const actualWants = (expenses.vehicleFuel || 0) + (expenses.otherExpenses || 0);
  const actualSavings = income - actualNeeds - actualWants;

  const budgetData = [
    { name: 'Needs (50%)', budget: needs, actual: actualNeeds, color: '#c9d9f5' },
    { name: 'Wants (30%)', budget: wants, actual: actualWants, color: '#4F8EF7' },
    { name: 'Savings (20%)', budget: savings, actual: Math.max(0, actualSavings), color: '#31C48D' },
  ];

  /**
   * Fix: slider adjustment that guarantees the three values always sum to exactly 100.
   * Strategy: when one slider moves, distribute the remainder proportionally between
   * the other two based on their current ratio — preventing any category going negative.
   */
  const handleSlider = (key, val) => {
    const clamped = Math.max(5, Math.min(90, val));
    const remaining = 100 - clamped;
    const others = Object.keys(percents).filter(k => k !== key);
    const otherSum = others.reduce((s, k) => s + percents[k], 0);

    let a, b;
    if (otherSum === 0) {
      a = Math.floor(remaining / 2);
      b = remaining - a;
    } else {
      a = Math.round((percents[others[0]] / otherSum) * remaining);
      a = Math.min(Math.max(a, 5), remaining - 5);
      b = remaining - a;
    }

    setPercents({ ...percents, [key]: clamped, [others[0]]: a, [others[1]]: b });
  };

  const NEEDS_ITEMS = [
    { label: 'House Rent', key: 'houseRent' },
    { label: 'Groceries', key: 'groceries' },
    { label: 'Electricity', key: 'electricityBill' },
    { label: 'Gas', key: 'gasBill' },
    { label: 'Water', key: 'waterBill' },
    { label: 'Internet & Mobile', key: 'internetMobile' },
    { label: 'Medical', key: 'medicalExpenses' },
    { label: 'Loan EMIs', value: totalMonthlyEMI }
  ];

  return (
    <div style={{ padding: '28px 28px 48px' }}>
      <PageHeader title="◧ Smart Budget Planner" subtitle="Optimize your spending using the 50/30/20 rule" />

      <InfoBox type="info">
        <strong>The 50/30/20 Rule:</strong> Allocate 50% to needs (rent, groceries, EMIs), 30% to wants (entertainment, dining), and 20% to savings &amp; investments.
      </InfoBox>

      <div style={{ height: 16 }} />

      <div className="budget-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Monthly Income" value={formatINR(income)} sub="After tax" color="var(--teal)" icon="💵" delay={0} />
        <StatCard label="Needs Budget" value={formatINR(needs)} sub={`₹${actualNeeds.toLocaleString('en-IN')} actual`} color={actualNeeds > needs ? 'var(--red)' : 'var(--gold)'} icon="🏠" delay={0.05} />
        <StatCard label="Wants Budget" value={formatINR(wants)} sub={`₹${actualWants.toLocaleString('en-IN')} actual`} color={actualWants > wants ? 'var(--red)' : 'var(--blue)'} icon="🛍️" delay={0.1} />
        <StatCard label="Savings Target" value={formatINR(savings)} sub={`₹${Math.max(0, actualSavings).toLocaleString('en-IN')} actual`} color={actualSavings < savings ? 'var(--red)' : 'var(--green)'} icon="💰" delay={0.15} />
      </div>

      <div className="budget-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Sliders */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, marginBottom: 20 }}>Customize Your Budget Split</div>
          {[
            { key: 'needs', label: '🏠 Needs', color: 'var(--gold)', desc: 'Essentials: rent, food, utilities, EMIs' },
            { key: 'wants', label: '🎉 Wants', color: 'var(--blue)', desc: 'Lifestyle: dining, travel, shopping' },
            { key: 'savings', label: '💰 Savings', color: 'var(--green)', desc: 'Future: investments, emergency fund, goals' }
          ].map(item => (
            <div key={item.key} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{item.label} <span style={{ color: item.color }}>{percents[item.key]}%</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.desc}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: item.color }}>{formatINR(Math.round(income * percents[item.key] / 100))}</div>
              </div>
              <input type="range" min="5" max="90" value={percents[item.key]}
                onChange={e => handleSlider(item.key, parseInt(e.target.value))}
                style={{ width: '100%', accentColor: item.color }} />
            </div>
          ))}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: 'var(--text-2)' }}>
            Total: {percents.needs + percents.wants + percents.savings}%
            {percents.needs + percents.wants + percents.savings !== 100 &&
              <span style={{ color: 'var(--red)' }}> ⚠️ Must equal 100%</span>}
          </div>
        </motion.div>

        {/* Budget vs Actual Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Budget vs Actual</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={budgetData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value, name) => [formatINR(value), name]} contentStyle={{ background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }} itemStyle={{ color: '#fff', fontWeight: 600 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="budget" name="Budget" radius={[4, 4, 0, 0]} fill="rgba(255,255,255,0.08)" />
              <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                {budgetData.map((entry, i) => <Cell key={i} fill={entry.actual > entry.budget ? 'var(--red)' : entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} /><span style={{ color: 'var(--text-2)' }}>Budget</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gold)' }} /><span style={{ color: 'var(--text-2)' }}>Actual</span></div>
          </div>
        </motion.div>
      </div>

      {/* Needs Breakdown */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ marginTop: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, marginBottom: 16 }}>🏠 Needs Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          {NEEDS_ITEMS.map(item => {
            const actual = item.value !== undefined ? item.value : (expenses[item.key] || 0);
            const budgetShare = Math.round(needs / NEEDS_ITEMS.length);
            const over = actual > budgetShare;
            return (
              <div key={item.label} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: over ? 'var(--red)' : 'var(--text)' }}>{formatINR(actual)}</span>
                </div>
                <ProgressBar value={actual} max={Math.max(actual, budgetShare)} color={over ? 'var(--red)' : 'var(--gold)'} height={4} />
                {over && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 4 }}>Over budget</div>}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
