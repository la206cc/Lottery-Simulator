/**
 * 随机数引擎模块
 * 提供彩票号码生成所需的随机算法
 */

/**
 * Fisher-Yates 洗牌算法
 * 从指定范围内随机选取不重复的数字
 * 
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @param {number} count - 选取数量
 * @returns {array} 排序后的随机数字数组
 */
export function fisherYatesPick(min, max, count) {
  // 创建数字池
  const pool = [];
  for (let i = min; i <= max; i++) pool.push(i);
  
  // Fisher-Yates 洗牌
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  
  // 取前count个并排序
  return pool.slice(0, count).sort((a, b) => a - b);
}

/**
 * 简单随机选取（可重复）
 * 从指定范围内随机选取数字，允许重复
 * 
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @param {number} count - 选取数量
 * @returns {array} 随机数字数组（可能包含重复）
 */
export function randomPick(min, max, count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return result;
}

/**
 * 数组随机打乱
 * 对给定数组进行随机排序
 * 
 * @param {array} array - 要打乱的数组
 * @returns {array} 打乱后的新数组
 */
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}