import { drawOne, checkPrize, analyzePurchaseResults } from './core/lottery.js';

function generatePurchasesWithMultiplier(lotteryId, count, multiplier = 1) {
  const results = [];
  
  // 生成count个不同的号码
  const uniqueTickets = [];
  for (let i = 0; i < count; i++) {
    uniqueTickets.push(drawOne(lotteryId, true));
  }
  
  // 每个号码重复multiplier次
  for (const ticket of uniqueTickets) {
    for (let i = 0; i < multiplier; i++) {
      results.push(ticket);
    }
  }
  
  return results;
}

let cancelled = false;

self.onmessage = function (e) {
  const msg = e.data;
  if (msg.type === 'start') {
    cancelled = false;
    const { lotteryId, count } = msg;
    const batchSize = 10000;
    const results = [];
    let processed = 0;

    while (processed < count && !cancelled) {
      const batchCount = Math.min(batchSize, count - processed);
      for (let i = 0; i < batchCount; i++) {
        results.push(drawOne(lotteryId));
      }
      processed += batchCount;
      self.postMessage({ type: 'progress', current: processed, total: count });
    }

    if (!cancelled) {
      self.postMessage({ type: 'complete', results });
    } else {
      self.postMessage({ type: 'cancelled' });
    }
  } else if (msg.type === 'purchase') {
    cancelled = false;
    const { lotteryId, count, multiplier = 1, drawResult, guaranteeWin = false } = msg;
    const batchSize = 10000;
    const allTickets = [];
    let processed = 0;
    let addedWinningTicket = false;

    while (processed < count && !cancelled) {
      const batchCount = Math.min(batchSize, count - processed);
      const uniqueTickets = [];
      
      if (guaranteeWin && !addedWinningTicket && drawResult) {
        const winningTicket = drawResult.map(zone => ({
          zoneName: zone.zoneName,
          numbers: [...zone.numbers],
          color: zone.color
        }));
        uniqueTickets.push(winningTicket);
        addedWinningTicket = true;
        
        for (let i = 1; i < batchCount; i++) {
          uniqueTickets.push(drawOne(lotteryId, true));
        }
      } else {
        for (let i = 0; i < batchCount; i++) {
          uniqueTickets.push(drawOne(lotteryId, true));
        }
      }
      
      for (const ticket of uniqueTickets) {
        for (let i = 0; i < multiplier; i++) {
          allTickets.push(ticket);
        }
      }
      
      processed += batchCount;
      self.postMessage({ type: 'purchase-progress', current: processed, total: count });
    }

    if (!cancelled) {
      const results = analyzePurchaseResults(lotteryId, drawResult, allTickets);
      self.postMessage({ type: 'purchase-complete', results });
    } else {
      self.postMessage({ type: 'cancelled' });
    }
  } else if (msg.type === 'cancel') {
    cancelled = true;
  }
};
