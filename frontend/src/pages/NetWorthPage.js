// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { motion, AnimatePresence } from 'framer-motion';
// import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
// import { fetchNetWorth, addAsset, deleteAsset, addLiability, deleteLiability } from '../store/slices/netWorthSlice';
// import { PageHeader, StatCard, EmptyState } from '../components/ui';
// import { formatINR } from '../utils/currency';

// const ASSET_CATS = ['cash_savings','fixed_deposit','mutual_funds','stocks','ppf_epf','real_estate','gold','crypto','nps','other'];
// const LIAB_CATS = ['home_loan','vehicle_loan','personal_loan','education_loan','credit_card','business_loan','other'];
// const COLORS = ['#F0B429','#0DCFAA','#4F8EF7','#F05252','#9061F9','#FF8A4C','#31C48D','#FB923C','#A78BFA','#60A5FA'];

// const fmtCat = s => s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

// export default function NetWorthPage() {
//   const dispatch = useDispatch();
//   const { data: nw, analysis, loading } = useSelector(s => s.netWorth);
//   const [tab, setTab] = useState('assets');
//   const [showForm, setShowForm] = useState(false);
//   const [form, setForm] = useState({ name:'', category:'cash_savings', currentValue:'', purchaseValue:'', notes:'', outstandingAmount:'', interestRate:'' });

//   useEffect(() => { dispatch(fetchNetWorth()); }, [dispatch]);

//   const assets = nw?.assets || [];
//   const liabilities = nw?.liabilities || [];
//   const assetData = Object.entries(analysis?.assetBreakdown||{}).map(([name,value])=>({name,value}));
//   const liabData = Object.entries(analysis?.liabilityBreakdown||{}).map(([name,value])=>({name,value}));

//   const handleAdd = async () => {
//     if (tab==='assets') {
//       await dispatch(addAsset({ name:form.name, category:form.category, currentValue:parseFloat(form.currentValue)||0, purchaseValue:parseFloat(form.purchaseValue)||0, notes:form.notes }));
//     } else {
//       await dispatch(addLiability({ name:form.name, category:form.category, outstandingAmount:parseFloat(form.outstandingAmount)||0, interestRate:parseFloat(form.interestRate)||0, notes:form.notes }));
//     }
//     dispatch(fetchNetWorth());
//     setShowForm(false);
//     setForm({ name:'', category:'cash_savings', currentValue:'', purchaseValue:'', notes:'', outstandingAmount:'', interestRate:'' });
//   };

//   const nwColor = (analysis?.netWorth||0) >= 0 ? 'var(--green)' : 'var(--red)';

//   return (
//     <div style={{ padding:'28px 28px 48px' }}>
//       <PageHeader title="◈ Net Worth Tracker" subtitle="Track assets, liabilities and your overall financial wealth"
//         action={<button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ Add {tab==='assets'?'Asset':'Liability'}</button>}/>

//       {/* Stats */}
//       <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:24 }}>
//         <StatCard label="Net Worth" value={formatINR(analysis?.netWorth||0)} sub={analysis?.netWorthGrade||'—'} color={nwColor} icon="📊" delay={0}/>
//         <StatCard label="Total Assets" value={formatINR(analysis?.totalAssets||0)} sub={`${assets.length} items`} color="var(--teal)" icon="📈" delay={0.05}/>
//         <StatCard label="Total Liabilities" value={formatINR(analysis?.totalLiabilities||0)} sub={`${liabilities.length} items`} color="var(--red)" icon="📉" delay={0.1}/>
//         <StatCard label="Solvency Ratio" value={analysis?.solvencyRatio?`${analysis.solvencyRatio}x`:'—'} sub="Assets / Liabilities" color="var(--purple)" icon="⚖️" delay={0.15}/>
//       </div>

//       {/* Charts Row */}
//       {(assetData.length>0||liabData.length>0)&&(
//         <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
//           {assetData.length>0&&(
//             <div className="card">
//               <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, marginBottom:14 }}>Asset Allocation</div>
//               <ResponsiveContainer width="100%" height={160}>
//                 <PieChart><Pie data={assetData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
//                   {assetData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} stroke="none"/>)}
//                 </Pie><Tooltip formatter={v=>[formatINR(v)]} contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/></PieChart>
//               </ResponsiveContainer>
//               {assetData.slice(0,4).map((a,i)=>(
//                 <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
//                   <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:7,height:7,borderRadius:'50%',background:COLORS[i],flexShrink:0 }}/><span style={{ color:'var(--text-2)' }}>{a.name}</span></div>
//                   <span style={{ fontWeight:700 }}>{formatINR(a.value)}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//           {liabData.length>0&&(
//             <div className="card">
//               <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, marginBottom:14 }}>Liability Breakdown</div>
//               <ResponsiveContainer width="100%" height={160}>
//                 <PieChart><Pie data={liabData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
//                   {liabData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} stroke="none"/>)}
//                 </Pie><Tooltip formatter={v=>[formatINR(v)]} contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/></PieChart>
//               </ResponsiveContainer>
//               {liabData.slice(0,4).map((a,i)=>(
//                 <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
//                   <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:7,height:7,borderRadius:'50%',background:COLORS[i],flexShrink:0 }}/><span style={{ color:'var(--text-2)' }}>{a.name}</span></div>
//                   <span style={{ fontWeight:700 }}>{formatINR(a.value)}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Tab Toggle */}
//       <div style={{ display:'flex', gap:8, marginBottom:16 }}>
//         {['assets','liabilities'].map(t=>(
//           <button key={t} className={`btn ${tab===t?'btn-primary':'btn-secondary'}`} onClick={()=>setTab(t)} style={{ textTransform:'capitalize' }}>{t}</button>
//         ))}
//       </div>

//       {/* List */}
//       <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
//         {(tab==='assets'?assets:liabilities).length===0?<EmptyState icon={tab==='assets'?'📈':'📉'} title={`No ${tab} added`} subtitle={`Track your ${tab} to compute net worth`} action={<button className="btn btn-primary btn-sm" onClick={()=>setShowForm(true)}>Add {tab==='assets'?'Asset':'Liability'}</button>}/>:
//         (tab==='assets'?assets:liabilities).map((item,i)=>(
//           <motion.div key={item._id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="card">
//             <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
//               <div>
//                 <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{item.name}</div>
//                 <span style={{ fontSize:11, fontWeight:600, color:tab==='assets'?'var(--teal)':'var(--red)', background:tab==='assets'?'var(--teal-dim)':'var(--red-dim)', padding:'2px 8px', borderRadius:6 }}>{fmtCat(item.category)}</span>
//               </div>
//               <button onClick={()=>{ if(tab==='assets')dispatch(deleteAsset(item._id)); else dispatch(deleteLiability(item._id)); }} style={{ background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',fontSize:16 }}>×</button>
//             </div>
//             <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:tab==='assets'?'var(--teal)':'var(--red)', marginBottom:4 }}>
//               {formatINR(tab==='assets'?item.currentValue:item.outstandingAmount)}
//             </div>
//             {tab==='assets'&&item.purchaseValue>0&&(
//               <div style={{ fontSize:11, color:'var(--text-3)' }}>Bought for {formatINR(item.purchaseValue)} · {item.currentValue>item.purchaseValue?<span style={{color:'var(--green)'}}>+{formatINR(item.currentValue-item.purchaseValue)}</span>:<span style={{color:'var(--red)'}}>{formatINR(item.currentValue-item.purchaseValue)}</span>}</div>
//             )}
//             {tab==='liabilities'&&item.interestRate>0&&<div style={{ fontSize:11, color:'var(--text-3)' }}>{item.interestRate}% p.a.</div>}
//           </motion.div>
//         ))}
//       </div>

//       {/* Add Form Modal */}
//       <AnimatePresence>
//         {showForm&&(
//           <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }} onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
//             <motion.div initial={{scale:0.94,y:20}} animate={{scale:1,y:0}} exit={{scale:0.94,y:20}} style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:28,width:'100%',maxWidth:440 }}>
//               <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,marginBottom:20 }}>Add {tab==='assets'?'Asset':'Liability'}</div>
//               <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
//                 <div className="form-group"><label className="form-label">Name</label><input className="form-input" placeholder="e.g. HDFC Savings Account" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
//                 <div className="form-group"><label className="form-label">Category</label>
//                   <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
//                     {(tab==='assets'?ASSET_CATS:LIAB_CATS).map(c=><option key={c} value={c}>{fmtCat(c)}</option>)}
//                   </select>
//                 </div>
//                 {tab==='assets'?(
//                   <div className="grid-2">
//                     <div className="form-group"><label className="form-label">Current Value (₹)</label><input className="form-input" type="number" placeholder="0" value={form.currentValue} onChange={e=>setForm({...form,currentValue:e.target.value})}/></div>
//                     <div className="form-group"><label className="form-label">Purchase Value (₹)</label><input className="form-input" type="number" placeholder="0" value={form.purchaseValue} onChange={e=>setForm({...form,purchaseValue:e.target.value})}/></div>
//                   </div>
//                 ):(
//                   <div className="grid-2">
//                     <div className="form-group"><label className="form-label">Outstanding (₹)</label><input className="form-input" type="number" placeholder="0" value={form.outstandingAmount} onChange={e=>setForm({...form,outstandingAmount:e.target.value})}/></div>
//                     <div className="form-group"><label className="form-label">Interest Rate (%)</label><input className="form-input" type="number" placeholder="0" value={form.interestRate} onChange={e=>setForm({...form,interestRate:e.target.value})}/></div>
//                   </div>
//                 )}
//                 <div style={{ display:'flex', gap:10 }}>
//                   <button className="btn btn-secondary" style={{ flex:1 }} onClick={()=>setShowForm(false)}>Cancel</button>
//                   <button className="btn btn-primary" style={{ flex:2 }} onClick={handleAdd} disabled={loading}>{loading?<><span className="spinner"/>Adding...</>:`Add ${tab==='assets'?'Asset':'Liability'}`}</button>
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchNetWorth, addAsset, deleteAsset, addLiability, deleteLiability } from '../store/slices/netWorthSlice';
import { PageHeader, StatCard, EmptyState } from '../components/ui';
import { formatINR } from '../utils/currency';

const ASSET_CATS = ['cash_savings', 'fixed_deposit', 'mutual_funds', 'stocks', 'ppf_epf', 'real_estate', 'gold', 'crypto', 'nps', 'other'];
const LIAB_CATS = ['home_loan', 'vehicle_loan', 'personal_loan', 'education_loan', 'credit_card', 'business_loan', 'other'];
const COLORS = ['#c9d9f5', '#87d8d0', '#91a9d0', '#23D160', '#e4ebf8', '#a9c8ff', '#FF4A4A', '#b9a9f7', '#c8b9fa', '#8fc9f5'];

const fmtCat = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function NetWorthPage() {
  const dispatch = useDispatch();
  const { data: nw, analysis, loading } = useSelector(s => s.netWorth);
  const [tab, setTab] = useState('assets');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'cash_savings', currentValue: '', purchaseValue: '', notes: '', outstandingAmount: '', interestRate: '' });

  useEffect(() => { dispatch(fetchNetWorth()); }, [dispatch]);

  const assets = nw?.assets || [];
  const liabilities = nw?.liabilities || [];
  const assetData = Object.entries(analysis?.assetBreakdown || {}).map(([name, value]) => ({ name, value }));
  const liabData = Object.entries(analysis?.liabilityBreakdown || {}).map(([name, value]) => ({ name, value }));

  const handleAdd = async () => {
    if (tab === 'assets') {
      await dispatch(addAsset({ name: form.name, category: form.category, currentValue: parseFloat(form.currentValue) || 0, purchaseValue: parseFloat(form.purchaseValue) || 0, notes: form.notes }));
    } else {
      await dispatch(addLiability({ name: form.name, category: form.category, outstandingAmount: parseFloat(form.outstandingAmount) || 0, interestRate: parseFloat(form.interestRate) || 0, notes: form.notes }));
    }
    setShowForm(false);
    setForm({ name: '', category: 'cash_savings', currentValue: '', purchaseValue: '', notes: '', outstandingAmount: '', interestRate: '' });
  };

  const nwColor = (analysis?.netWorth || 0) >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div style={{ padding: '28px 28px 48px' }}>
      <PageHeader title="◈ Net Worth Tracker" subtitle="Track assets, liabilities and your overall financial wealth"
        action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add {tab === 'assets' ? 'Asset' : 'Liability'}</button>} />

      {/* Stats */}
      <div className="nw-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Net Worth" value={formatINR(analysis?.netWorth || 0)} sub={analysis?.netWorthGrade || '—'} color={nwColor} icon="📊" delay={0} />
        <StatCard label="Total Assets" value={formatINR(analysis?.totalAssets || 0)} sub={`${assets.length} items`} color="var(--teal)" icon="📈" delay={0.05} />
        <StatCard label="Total Liabilities" value={formatINR(analysis?.totalLiabilities || 0)} sub={`${liabilities.length} items`} color="var(--red)" icon="📉" delay={0.1} />
        <StatCard label="Solvency Ratio" value={analysis?.solvencyRatio ? `${analysis.solvencyRatio}x` : '—'} sub="Assets / Liabilities" color="var(--purple)" icon="⚖️" delay={0.15} />
      </div>

      {/* Charts Row */}
      {(assetData.length > 0 || liabData.length > 0) && (
        <div className="nw-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {assetData.length > 0 && (
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Asset Allocation</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart><Pie data={assetData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                  {assetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie><Tooltip formatter={(value, name) => [formatINR(value), name]} contentStyle={{ background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }} itemStyle={{ color: '#fff', fontWeight: 600 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} /></PieChart>
              </ResponsiveContainer>
              {assetData.slice(0, 4).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} /><span style={{ color: 'var(--text-2)' }}>{a.name}</span></div>
                  <span style={{ fontWeight: 700 }}>{formatINR(a.value)}</span>
                </div>
              ))}
            </div>
          )}
          {liabData.length > 0 && (
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Liability Breakdown</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart><Pie data={liabData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                  {liabData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie><Tooltip formatter={(value, name) => [formatINR(value), name]} contentStyle={{ background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }} itemStyle={{ color: '#fff', fontWeight: 600 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} /></PieChart>
              </ResponsiveContainer>
              {liabData.slice(0, 4).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} /><span style={{ color: 'var(--text-2)' }}>{a.name}</span></div>
                  <span style={{ fontWeight: 700 }}>{formatINR(a.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['assets', 'liabilities'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
        {(tab === 'assets' ? assets : liabilities).length === 0 ? <EmptyState icon={tab === 'assets' ? '📈' : '📉'} title={`No ${tab} added`} subtitle={`Track your ${tab} to compute net worth`} action={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>Add {tab === 'assets' ? 'Asset' : 'Liability'}</button>} /> :
          (tab === 'assets' ? assets : liabilities).map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{item.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: tab === 'assets' ? 'var(--teal)' : 'var(--red)', background: tab === 'assets' ? 'var(--teal-dim)' : 'var(--red-dim)', padding: '2px 8px', borderRadius: 6 }}>{fmtCat(item.category)}</span>
                </div>
                <button onClick={() => { if (tab === 'assets') dispatch(deleteAsset(item.id)); else dispatch(deleteLiability(item.id)); }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: tab === 'assets' ? 'var(--teal)' : 'var(--red)', marginBottom: 4 }}>
                {formatINR(tab === 'assets' ? item.currentValue : item.outstandingAmount)}
              </div>
              {tab === 'assets' && item.purchaseValue > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Bought for {formatINR(item.purchaseValue)} · {item.currentValue > item.purchaseValue ? <span style={{ color: 'var(--green)' }}>+{formatINR(item.currentValue - item.purchaseValue)}</span> : <span style={{ color: 'var(--red)' }}>{formatINR(item.currentValue - item.purchaseValue)}</span>}</div>
              )}
              {tab === 'liabilities' && item.interestRate > 0 && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.interestRate}% p.a.</div>}
            </motion.div>
          ))}
      </div>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Add {tab === 'assets' ? 'Asset' : 'Liability'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" placeholder="e.g. HDFC Savings Account" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {(tab === 'assets' ? ASSET_CATS : LIAB_CATS).map(c => <option key={c} value={c}>{fmtCat(c)}</option>)}
                  </select>
                </div>
                {tab === 'assets' ? (
                  <div className="grid-2">
                    <div className="form-group"><label className="form-label">Current Value (₹)</label><input className="form-input" type="number" placeholder="0" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Purchase Value (₹)</label><input className="form-input" type="number" placeholder="0" value={form.purchaseValue} onChange={e => setForm({ ...form, purchaseValue: e.target.value })} /></div>
                  </div>
                ) : (
                  <div className="grid-2">
                    <div className="form-group"><label className="form-label">Outstanding (₹)</label><input className="form-input" type="number" placeholder="0" value={form.outstandingAmount} onChange={e => setForm({ ...form, outstandingAmount: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Interest Rate (%)</label><input className="form-input" type="number" placeholder="0" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} /></div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAdd} disabled={loading}>{loading ? <><span className="spinner" />Adding...</> : `Add ${tab === 'assets' ? 'Asset' : 'Liability'}`}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
