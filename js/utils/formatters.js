/**
 * 格式化工具函数模块
 * 提供数字、金额、百分比等格式化功能
 */

/**
 * 格式化金额
 * 根据金额大小自动选择合适的单位（元、万、亿）
 * 
 * @param {number} amount - 金额数值
 * @param {string} currency - 货币符号（默认¥）
 * @returns {string} 格式化后的金额字符串
 */
export function formatMoney(amount, currency = '¥') {
  if (amount >= 100000000 && currency === '¥') {
    return `${currency}${(amount / 100000000).toFixed(2)}亿`;
  } else if (amount >= 10000 && currency === '¥') {
    return `${currency}${(amount / 10000).toFixed(amount % 10000 ? 1 : 0)}万`;
  }
  return `${currency}${amount.toLocaleString()}`;
}

/**
 * 格式化数字
 * 添加千分位分隔符
 * 
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * 格式化百分比
 * 将小数转换为百分比字符串
 * 
 * @param {number} value - 小数（如0.5表示50%）
 * @param {number} decimals - 小数位数（默认2）
 * @returns {string} 百分比字符串
 */
export function formatPercentage(value, decimals = 2) {
  return `${parseFloat(value).toFixed(decimals)}%`;
}

/**
 * 格式化货币（别名）
 * 
 * @param {number} amount - 金额数值
 * @param {string} currency - 货币符号
 * @returns {string} 格式化后的货币字符串
 */
export function formatCurrency(amount, currency) {
  return formatMoney(amount, currency);
}

/**
 * 格式化大数字
 * 根据数字大小自动选择合适的单位（个、万、亿）
 * 
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字字符串
 */
export function formatLargeNumber(num) {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)}亿`;
  } else if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString();
}

/**
 * 解析数字字符串
 * 将字符串转换为数字，失败返回0
 * 
 * @param {string} str - 数字字符串
 * @returns {number} 解析后的数字
 */
export function parseNumber(str) {
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * 数值限制
 * 将数值限制在指定范围内
 * 
 * @param {number} value - 要限制的数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的数值
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 格式化球号码
 * 给号码添加前导零
 * 
 * @param {number} num - 号码
 * @param {number} padding - 最小长度（默认2）
 * @returns {string} 格式化后的号码字符串
 */
export function formatBallNumber(num, padding = 2) {
  return num.toString().padStart(padding, '0');
}

/**
 * 格式化比例
 * 将分子分母转换为最简比例形式
 * 
 * @param {number} numerator - 分子
 * @param {number} denominator - 分母
 * @returns {string} 最简比例字符串
 */
export function formatRatio(numerator, denominator) {
  if (denominator === 0) return '0:0';
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}:${denominator / divisor}`;
}

/**
 * 格式化字节数
 * 根据字节大小自动选择合适的单位（Bytes、KB、MB、GB）
 * 
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字节字符串
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}