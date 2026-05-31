export function formatMoney(amount, currency = '¥') {
  if (amount >= 100000000 && currency === '¥') {
    return `${currency}${(amount / 100000000).toFixed(2)}亿`;
  } else if (amount >= 10000 && currency === '¥') {
    return `${currency}${(amount / 10000).toFixed(amount % 10000 ? 1 : 0)}万`;
  }
  return `${currency}${amount.toLocaleString()}`;
}

export function formatNumber(num) {
  return num.toLocaleString();
}

export function formatPercentage(value, decimals = 2) {
  return `${parseFloat(value).toFixed(decimals)}%`;
}

export function formatCurrency(amount, currency) {
  return formatMoney(amount, currency);
}

export function formatLargeNumber(num) {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)}亿`;
  } else if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString();
}

export function parseNumber(str) {
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatBallNumber(num, padding = 2) {
  return num.toString().padStart(padding, '0');
}

export function formatRatio(numerator, denominator) {
  if (denominator === 0) return '0:0';
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}:${denominator / divisor}`;
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
