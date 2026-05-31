import { LOTTERY_CONFIG } from '../data/lottery-config.js';

class StateManager {
  constructor() {
    this.state = {
      currentLottery: 'ssq',
      currentPrizePool: 0,
      simulationResults: [],
      purchaseHistoryMap: {},
      historyIndexMap: {},
      currentPage: 1,
      bulletinPage: 1,
      betMode: 'random',
      betType: 'single',
      betMultiplier: 1,
      addOnEnabled: false,
      selectedNumbers: [],
      lastPurchaseData: null,
      lastPurchaseTickets: null,
      lastPurchaseCount: null,
      isSimulating: false,
      isPurchasing: false,
      workerHandle: null,
      purchaseWorkerHandle: null
    };
    this.listeners = {};
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.notify(key, value, oldValue);
  }

  update(key, updater) {
    const oldValue = this.state[key];
    const newValue = updater(oldValue);
    this.state[key] = newValue;
    this.notify(key, newValue, oldValue);
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  notify(key, newValue, oldValue) {
    const callbacks = this.listeners[key] || [];
    callbacks.forEach(cb => cb(newValue, oldValue));
    
    const allCallbacks = this.listeners['*'] || [];
    allCallbacks.forEach(cb => cb(key, newValue, oldValue));
  }

  getCurrentHistory() {
    return this.state.purchaseHistoryMap[this.state.currentLottery] || [];
  }

  setCurrentHistory(history) {
    this.update('purchaseHistoryMap', map => ({
      ...map,
      [this.state.currentLottery]: history
    }));
  }

  getCurrentHistoryIndex() {
    const history = this.getCurrentHistory();
    const index = this.state.historyIndexMap[this.state.currentLottery] ?? -1;
    return index >= history.length ? history.length - 1 : index;
  }

  setCurrentHistoryIndex(index) {
    this.update('historyIndexMap', map => ({
      ...map,
      [this.state.currentLottery]: index
    }));
  }

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

  addSimulationResult(result) {
    this.update('simulationResults', results => [...results, result]);
  }

  setSimulationResults(results) {
    this.set('simulationResults', results);
  }

  clearSimulationResults() {
    this.set('simulationResults', []);
    this.set('currentPage', 1);
    this.set('bulletinPage', 1);
  }

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
    
    if (currentIndex < history.length - 1) {
      history = history.slice(0, currentIndex + 1);
    }
    
    history.push(historyItem);
    
    if (history.length > 10) {
      history.shift();
    }
    
    this.setCurrentHistory(history);
    this.setCurrentHistoryIndex(history.length - 1);
    
    return historyItem;
  }

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

  clearPurchaseHistory() {
    this.setCurrentHistory([]);
    this.setCurrentHistoryIndex(-1);
  }

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

  getLotteryList() {
    return LOTTERY_CONFIG;
  }
}

export const stateManager = new StateManager();
export default stateManager;
