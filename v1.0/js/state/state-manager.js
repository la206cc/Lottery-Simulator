/**
 * 状态管理器模块
 * 管理应用的全局状态，支持状态监听和响应式更新
 */

import { LOTTERY_CONFIG } from '../lottery-config.js';

/**
 * StateManager 类
 * 提供状态的获取、设置、更新和监听功能
 */
class StateManager {
  constructor() {
    // 初始化状态对象
    this.state = {
      currentLottery: 'ssq',           // 当前选中的彩票类型
      currentPrizePool: 0,             // 当前奖池金额
      simulationResults: [],           // 模拟结果列表
      purchaseHistoryMap: {},          // 购买历史映射（按彩票类型存储）
      historyIndexMap: {},             // 历史记录索引映射
      currentPage: 1,                  // 当前分页
      bulletinPage: 1,                 // 公告分页
      betMode: 'random',               // 投注模式（random/multi/manual）
      betType: 'single',               // 投注类型（single/multiple）
      betMultiplier: 1,                // 倍投倍数
      addOnEnabled: false,             // 是否启用追加投注
      selectedNumbers: [],             // 用户选择的号码
      lastPurchaseData: null,          // 上次购买数据
      lastPurchaseTickets: null,       // 上次购买的彩票列表
      lastPurchaseCount: null,         // 上次购买数量
      isSimulating: false,             // 是否正在模拟
      isPurchasing: false,             // 是否正在购买
      workerHandle: null,              // 模拟工作线程句柄
      purchaseWorkerHandle: null,       // 购买工作线程句柄
      kl8SelectNum: 8                  // 快乐8当前选中的玩法（选一到选十）
    };
    this.listeners = {};  // 事件监听器映射
  }

  /**
   * 获取状态值
   * 
   * @param {string} key - 状态键名
   * @returns {any} 状态值
   */
  get(key) {
    return this.state[key];
  }

  /**
   * 设置状态值
   * 
   * @param {string} key - 状态键名
   * @param {any} value - 状态值
   */
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.notify(key, value, oldValue);
  }

  /**
   * 更新状态值（函数式更新）
   * 
   * @param {string} key - 状态键名
   * @param {function} updater - 更新函数，接收旧值返回新值
   */
  update(key, updater) {
    const oldValue = this.state[key];
    const newValue = updater(oldValue);
    this.state[key] = newValue;
    this.notify(key, newValue, oldValue);
  }

  /**
   * 添加状态监听器
   * 
   * @param {string} event - 事件名（状态键名或'*'表示所有状态）
   * @param {function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * 移除状态监听器
   * 
   * @param {string} event - 事件名
   * @param {function} callback - 要移除的回调函数
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * 通知监听器状态变化
   * 
   * @param {string} key - 状态键名
   * @param {any} newValue - 新值
   * @param {any} oldValue - 旧值
   */
  notify(key, newValue, oldValue) {
    const callbacks = this.listeners[key] || [];
    callbacks.forEach(cb => cb(newValue, oldValue));
    
    // 通知全局监听器
    const allCallbacks = this.listeners['*'] || [];
    allCallbacks.forEach(cb => cb(key, newValue, oldValue));
  }

  /**
   * 获取当前彩票类型的购买历史
   * 
   * @returns {array} 购买历史列表
   */
  getCurrentHistory() {
    return this.state.purchaseHistoryMap[this.state.currentLottery] || [];
  }

  /**
   * 设置当前彩票类型的购买历史
   * 
   * @param {array} history - 购买历史列表
   */
  setCurrentHistory(history) {
    this.update('purchaseHistoryMap', map => ({
      ...map,
      [this.state.currentLottery]: history
    }));
  }

  /**
   * 获取当前彩票类型的历史记录索引
   * 
   * @returns {number} 当前索引
   */
  getCurrentHistoryIndex() {
    const history = this.getCurrentHistory();
    const index = this.state.historyIndexMap[this.state.currentLottery] ?? -1;
    return index >= history.length ? history.length - 1 : index;
  }

  /**
   * 设置当前彩票类型的历史记录索引
   * 
   * @param {number} index - 索引值
   */
  setCurrentHistoryIndex(index) {
    this.update('historyIndexMap', map => ({
      ...map,
      [this.state.currentLottery]: index
    }));
  }

  /**
   * 切换彩票类型
   * 
   * @param {string} lotteryId - 彩票类型ID
   */
  switchLottery(lotteryId) {
    this.set('currentLottery', lotteryId);
    this.set('simulationResults', []);
    this.set('currentPage', 1);
    this.set('bulletinPage', 1);
    this.set('lastPurchaseData', null);
    this.set('lastPurchaseTickets', null);
    this.set('lastPurchaseCount', null);
    this.set('selectedNumbers', []);
  }

  /**
   * 添加模拟结果
   * 
   * @param {object} result - 模拟结果对象
   */
  addSimulationResult(result) {
    this.update('simulationResults', results => [...results, result]);
  }

  /**
   * 设置模拟结果列表
   * 
   * @param {array} results - 模拟结果列表
   */
  setSimulationResults(results) {
    this.set('simulationResults', results);
  }

  /**
   * 清空模拟结果
   */
  clearSimulationResults() {
    this.set('simulationResults', []);
    this.set('currentPage', 1);
    this.set('bulletinPage', 1);
  }

  /**
   * 保存购买记录到历史
   * 
   * @param {array} drawResult - 开奖结果
   * @param {object} results - 购买结果数据
   * @param {number} purchaseCount - 购买数量
   * @returns {object} 保存的历史记录项
   */
  savePurchaseToHistory(drawResult, results, purchaseCount) {
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      lottery: this.state.currentLottery,
      drawResult: drawResult ? JSON.parse(JSON.stringify(drawResult)) : null,
      results: JSON.parse(JSON.stringify(results)),
      betMode: this.state.betMode,
      betType: this.state.betType,
      betMultiplier: this.state.betMultiplier,
      addOnEnabled: this.state.addOnEnabled,
      purchaseCount: purchaseCount || results.totalTickets
    };
    
    let history = this.getCurrentHistory();
    const currentIndex = this.getCurrentHistoryIndex();
    
    // 如果不在最后一条记录，截断后续记录
    if (currentIndex < history.length - 1) {
      history = history.slice(0, currentIndex + 1);
    }
    
    history.push(historyItem);
    
    // 限制历史记录数量（最多10条）
    if (history.length > 10) {
      history.shift();
    }
    
    this.setCurrentHistory(history);
    this.setCurrentHistoryIndex(history.length - 1);
    
    return historyItem;
  }

  /**
   * 从历史记录加载购买数据
   * 
   * @param {number} index - 历史记录索引
   * @returns {object|null} 历史记录项
   */
  loadPurchaseFromHistory(index) {
    const history = this.getCurrentHistory();
    if (index < 0 || index >= history.length) return null;
    
    this.setCurrentHistoryIndex(index);
    const item = history[index];
    
    this.set('betMode', item.betMode);
    this.set('betType', item.betType);
    this.set('betMultiplier', item.betMultiplier || 1);
    this.set('addOnEnabled', item.addOnEnabled || false);
    
    return item;
  }

  /**
   * 清空购买历史
   */
  clearPurchaseHistory() {
    this.setCurrentHistory([]);
    this.setCurrentHistoryIndex(-1);
  }

  /**
   * 重置所有状态
   */
  resetAll() {
    this.set('purchaseHistoryMap', {});
    this.set('historyIndexMap', {});
    this.set('simulationResults', []);
    this.set('currentPage', 1);
    this.set('bulletinPage', 1);
    this.set('lastPurchaseData', null);
    this.set('lastPurchaseTickets', null);
    this.set('lastPurchaseCount', null);
  }

  /**
   * 获取所有彩票类型列表
   * 
   * @returns {array} 彩票配置数组
   */
  getLotteryList() {
    return LOTTERY_CONFIG;
  }
}

// 创建单例状态管理器
export const stateManager = new StateManager();
export default stateManager;