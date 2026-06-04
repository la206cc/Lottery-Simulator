import { drawOne } from './core/lottery.js';

// Re-export core functions
export { checkPrize, analyzePurchaseResults, generatePurchases, generateManualTicket, generateMultipleTickets, calcBetCount } from './core/lottery.js';

function simulateBatch(lotteryId, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(drawOne(lotteryId));
  }
  return results;
}

export function draw(lotteryId) {
  return drawOne(lotteryId);
}

export function simulate(lotteryId, count) {
  if (count <= 10000) {
    return simulateBatch(lotteryId, count);
  }
  return null;
}

export function startWorkerSimulation(lotteryId, count, onProgress, onComplete) {
  const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

  worker.onmessage = function (e) {
    const msg = e.data;
    if (msg.type === 'progress') {
      if (onProgress) onProgress(msg.current, msg.total);
    } else if (msg.type === 'complete') {
      worker.terminate();
      if (onComplete) onComplete(msg.results);
    } else if (msg.type === 'cancelled') {
      worker.terminate();
    }
  };

  worker.postMessage({ type: 'start', lotteryId, count });

  return {
    cancel() {
      worker.postMessage({ type: 'cancel' });
    }
  };
}

export function generatePurchasesWithMultiplier(lotteryId, count, multiplier = 1, guaranteeWin = false, drawResult = null) {
  const results = [];
  
  // 生成count个不同的号码
  const uniqueTickets = [];
  
  if (guaranteeWin && drawResult) {
    const winningTicket = drawResult.map(zone => ({
      zoneName: zone.zoneName,
      numbers: [...zone.numbers],
      color: zone.color
    }));
    uniqueTickets.push(winningTicket);
    for (let i = 1; i < count; i++) {
      uniqueTickets.push(drawOne(lotteryId, true));
    }
  } else {
    for (let i = 0; i < count; i++) {
      uniqueTickets.push(drawOne(lotteryId, true));
    }
  }
  
  // 每个号码重复multiplier次
  for (const ticket of uniqueTickets) {
    for (let i = 0; i < multiplier; i++) {
      results.push(ticket);
    }
  }
  
  return results;
}
