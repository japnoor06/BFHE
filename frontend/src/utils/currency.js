export const formatINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const num = Math.abs(Math.round(amount));
  const str = num.toString();
  const lastThree = str.slice(-3);
  const remaining = str.slice(0, -3);
  const formatted = remaining ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
  return (amount < 0 ? '-₹' : '₹') + formatted;
};

export const formatINRCompact = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return formatINR(amount);
};

export const getScoreColor = (grade) => {
  const colors = { Excellent:'#31C48D', Good:'#a9c8ff', Fair:'#c9d9f5', Poor:'#FF8A4C', Critical:'#F05252' };
  return colors[grade] || '#8896B3';
};

export const getScoreBgColor = (grade) => {
  const colors = { Excellent:'rgba(49,196,141,0.12)', Good:'rgba(169,200,255,0.12)', Fair:'rgba(201,217,245,0.12)', Poor:'rgba(255,138,76,0.12)', Critical:'rgba(240,82,82,0.12)' };
  return colors[grade] || 'rgba(138,155,190,0.12)';
};

export const getPriorityStyle = (priority) => {
  const styles = {
    high:   { bg:'rgba(240,82,82,0.12)', color:'#FCA5A5', border:'rgba(240,82,82,0.3)' },
    medium: { bg:'rgba(201,217,245,0.12)', color:'#c9d9f5', border:'rgba(201,217,245,0.3)' },
    low:    { bg:'rgba(49,196,141,0.12)', color:'#6EE7B7', border:'rgba(49,196,141,0.3)' }
  };
  return styles[priority] || styles.medium;
};
