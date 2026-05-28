const DPR = window.devicePixelRatio || 1;

function setupCanvas(canvas, width, height) {
  canvas.width = width * DPR;
  canvas.height = height * DPR;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  return ctx;
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function debounce(func, wait = 150) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const COLORS = {
  bg: '#1a1a2e',
  card: '#16213e',
  border: '#0f3460',
  text: '#e0e0e0',
  textMuted: '#8892b0',
  grid: '#2a2a4a',
  accent: '#e94560',
  blue: '#3498db',
  red: '#e74c3c',
  orange: '#f39c12',
  green: '#2ecc71',
  purple: '#9b59b6',
  cyan: '#1abc9c',
  warm: '#f39c12',
  hot: '#e74c3c',
  cold: '#3498db'
};

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawBarChart(canvas, data, options = {}) {
  const container = canvas.parentElement;
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(container);
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const width = Math.max(100, options.width || (rect.width - paddingLeft - paddingRight) || 600);
  const height = options.height || 250;
  
  // 设置 ResizeObserver 监听容器尺寸变化
  if (!canvas._resizeObserver) {
    try {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          if (newWidth > 0 && canvas._lastWidth !== newWidth) {
            canvas._lastWidth = newWidth;
            // 使用 requestAnimationFrame 避免频繁重绘
            requestAnimationFrame(() => {
              if (canvas._lastData && canvas._lastOptions) {
                drawBarChart(canvas, canvas._lastData, canvas._lastOptions);
              }
            });
          }
        }
      });
      resizeObserver.observe(container);
      canvas._resizeObserver = resizeObserver;
    } catch (e) {
      console.warn('ResizeObserver not supported:', e);
    }
  }
  
  // 保存最后使用的数据和选项
  canvas._lastData = data;
  canvas._lastOptions = options;
  canvas._lastWidth = width;
  
  const ctx = setupCanvas(canvas, width, height);
  clearCanvas(canvas);

  const padding = { top: 40, right: 30, bottom: 60, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const labels = data.map(d => d.label);
  const values = data.map(d => d.value);
  const barColor = options.color || COLORS.accent;
  const referenceLine = options.referenceLine || null;
  const deviationColors = options.deviationColors || false;
  const hasNegative = values.some(v => v < 0);

  let minVal, maxVal, zeroY;
  if (hasNegative) {
    const dataMax = Math.max(...values);
    const dataMin = Math.min(...values);
    const absMax = Math.max(Math.abs(dataMax), Math.abs(dataMin)) * 1.2;
    minVal = -absMax;
    maxVal = absMax;
  } else if (referenceLine !== null) {
    const deviations = values.map(v => Math.abs(v - referenceLine));
    const maxDev = Math.max(...deviations);
    const margin = Math.max(maxDev * 0.6, referenceLine * 0.05);
    minVal = Math.max(0, referenceLine - margin);
    maxVal = referenceLine + margin;
  } else {
    minVal = 0;
    maxVal = Math.max(...values) * 1.15;
  }
  const range = maxVal - minVal;

  zeroY = padding.top + chartH - ((0 - minVal) / range) * chartH;

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(options.title || '', width / 2, 24);

  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + chartH - (chartH / gridLines) * i;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const val = (minVal + (range / gridLines) * i).toFixed(2);
    ctx.fillText(val, padding.left - 8, y + 4);
  }

  if (hasNegative) {
    ctx.strokeStyle = COLORS.textMuted + '88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(padding.left + chartW, zeroY);
    ctx.stroke();

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0', padding.left + 4, zeroY - 4);
  }

  if (referenceLine !== null && !hasNegative) {
    const refY = padding.top + chartH - ((referenceLine - minVal) / range) * chartH;
    ctx.strokeStyle = COLORS.green + 'cc';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, refY);
    ctx.lineTo(padding.left + chartW, refY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COLORS.green;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('理论值', padding.left + chartW - 36, refY - 6);
  }

  const barW = Math.max(4, (chartW / labels.length) * 0.7);
  const gap = chartW / labels.length;

  const tooltipAreas = [];

  labels.forEach((label, i) => {
    const x = padding.left + gap * i + (gap - barW) / 2;

    let fillColor;
    if (hasNegative) {
      fillColor = values[i] >= 0 ? COLORS.red : COLORS.blue;
    } else if (deviationColors && referenceLine !== null) {
      const diff = values[i] - referenceLine;
      const maxDiff = Math.max(...values.map(v => Math.abs(v - referenceLine))) || 1;
      const ratio = diff / maxDiff;
      if (ratio > 0) {
        fillColor = COLORS.red;
      } else {
        fillColor = COLORS.blue;
      }
    } else {
      fillColor = barColor;
    }

    let barY, barH;
    if (hasNegative) {
      const baseY = zeroY;
      const valY = padding.top + chartH - ((values[i] - minVal) / range) * chartH;
      barY = Math.min(baseY, valY);
      barH = Math.abs(valY - baseY);
    } else {
      barH = ((values[i] - minVal) / range) * chartH;
      barY = padding.top + chartH - barH;
    }

    const gradient = ctx.createLinearGradient(x, barY, x, barY + barH);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, fillColor + '44');
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, x, barY, barW, Math.max(barH, 1), Math.min(3, barW / 2));
    ctx.fill();

    tooltipAreas.push({ x, y: barY, w: barW, h: Math.max(barH, 10), label, value: values[i] });

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    if (labels.length <= 40) {
      ctx.save();
      ctx.translate(x + barW / 2, padding.top + chartH + 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  });

  if (hasNegative) {
    const legendY = padding.top + 10;
    const legendX = padding.left + 10;
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(legendX, legendY, 10, 10);
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('高于理论', legendX + 14, legendY + 9);
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(legendX + 72, legendY, 10, 10);
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText('低于理论', legendX + 86, legendY + 9);
  } else if (deviationColors && referenceLine !== null) {
    const legendY = padding.top + 10;
    const legendX = padding.left + 10;
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(legendX, legendY, 10, 10);
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('高于理论', legendX + 14, legendY + 9);
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(legendX + 72, legendY, 10, 10);
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText('低于理论', legendX + 86, legendY + 9);
  }

  setupTooltip(canvas, tooltipAreas, options.tooltipFormatter);
}

export function drawLineChart(canvas, data, options = {}) {
  const container = canvas.parentElement;
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(container);
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const width = Math.max(100, options.width || (rect.width - paddingLeft - paddingRight) || 600);
  const height = options.height || 250;
  
  // 设置 ResizeObserver 监听容器尺寸变化
  if (!canvas._resizeObserver) {
    try {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          if (newWidth > 0 && canvas._lastWidth !== newWidth) {
            canvas._lastWidth = newWidth;
            // 使用 requestAnimationFrame 避免频繁重绘
            requestAnimationFrame(() => {
              if (canvas._lastData && canvas._lastOptions) {
                drawLineChart(canvas, canvas._lastData, canvas._lastOptions);
              }
            });
          }
        }
      });
      resizeObserver.observe(container);
      canvas._resizeObserver = resizeObserver;
    } catch (e) {
      console.warn('ResizeObserver not supported:', e);
    }
  }
  
  canvas._lastData = data;
  canvas._lastOptions = options;
  canvas._lastWidth = width;
  
  const ctx = setupCanvas(canvas, width, height);
  clearCanvas(canvas);

  const padding = { top: 40, right: 30, bottom: 60, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const labels = data.map(d => d.label);
  const values = data.map(d => d.value);
  const maxVal = Math.max(...values) * 1.15;
  const minVal = Math.min(0, Math.min(...values));
  const range = maxVal - minVal;
  const lineColor = options.color || COLORS.accent;

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(options.title || '', width / 2, 24);

  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + chartH - (chartH / gridLines) * i;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const val = (minVal + (range / gridLines) * i).toFixed(0);
    ctx.fillText(val, padding.left - 8, y + 4);
  }

  const step = labels.length > 1 ? chartW / (labels.length - 1) : 0;
  const points = values.map((v, i) => ({
    x: padding.left + step * i,
    y: padding.top + chartH - ((v - minVal) / range) * chartH
  }));

  const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  areaGradient.addColorStop(0, lineColor + '44');
  areaGradient.addColorStop(1, lineColor + '05');
  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = areaGradient;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  const overlayData = options.overlayData || null;
  if (overlayData && overlayData.length) {
    const overlayMax = Math.max(...overlayData.map(d => d.value));
    if (overlayMax > maxVal) {
      maxVal = overlayMax * 1.15;
    }
    const range2 = maxVal - minVal;
    const overlayPoints = overlayData.map((d, i) => ({
      x: padding.left + step * i,
      y: padding.top + chartH - ((d.value - minVal) / range2) * chartH
    }));
    ctx.beginPath();
    ctx.moveTo(overlayPoints[0].x, overlayPoints[0].y);
    for (let i = 1; i < overlayPoints.length; i++) {
      ctx.lineTo(overlayPoints[i].x, overlayPoints[i].y);
    }
    ctx.strokeStyle = COLORS.green + 'aa';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const tooltipAreas = [];
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    tooltipAreas.push({ x: p.x - 6, y: p.y - 6, w: 12, h: 12, label: labels[i], value: values[i] });
  });

  if (overlayData && overlayData.length) {
    const legendY = padding.top + 10;
    const legendX = padding.left + chartW - 140;
    ctx.fillStyle = lineColor;
    ctx.fillRect(legendX, legendY, 12, 3);
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('实际分布', legendX + 16, legendY + 4);
    ctx.strokeStyle = COLORS.green + 'aa';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 16);
    ctx.lineTo(legendX + 12, legendY + 16);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText('理论正态', legendX + 16, legendY + 20);
  }

  if (labels.length <= 30) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
      ctx.fillText(label, points[i].x, padding.top + chartH + 16);
    });
  }

  setupTooltip(canvas, tooltipAreas, options.tooltipFormatter);
}

export function drawPieChart(canvas, data, options = {}) {
  const container = canvas.parentElement;
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(container);
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
  const availableWidth = rect.width - paddingLeft - paddingRight;
  const availableHeight = rect.height - paddingTop - paddingBottom;
  const size = Math.min(Math.max(180, options.width || options.height || availableWidth || availableHeight || 250), 280);
  const width = size;
  const height = size;
  
  // 设置 ResizeObserver 监听容器尺寸变化
  if (!canvas._resizeObserver) {
    try {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          if (newWidth > 0 && canvas._lastWidth !== newWidth) {
            canvas._lastWidth = newWidth;
            // 使用 requestAnimationFrame 避免频繁重绘
            requestAnimationFrame(() => {
              if (canvas._lastData && canvas._lastOptions) {
                drawPieChart(canvas, canvas._lastData, canvas._lastOptions);
              }
            });
          }
        }
      });
      resizeObserver.observe(container);
      canvas._resizeObserver = resizeObserver;
    } catch (e) {
      console.warn('ResizeObserver not supported:', e);
    }
  }
  
  canvas._lastData = data;
  canvas._lastOptions = options;
  canvas._lastWidth = width;
  
  const ctx = setupCanvas(canvas, width, height);
  clearCanvas(canvas);

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(options.title || '', width / 2, 24);

  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const radius = Math.min(width, height) / 2 - 60;
  const total = data.reduce((s, d) => s + d.value, 0);

  const defaultColors = [COLORS.red, COLORS.blue, COLORS.orange, COLORS.green, COLORS.purple, COLORS.cyan];
  let startAngle = -Math.PI / 2;
  const tooltipAreas = [];

  data.forEach((d, i) => {
    const sliceAngle = (d.value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;
    const color = d.color || defaultColors[i % defaultColors.length];

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = COLORS.card;
    ctx.lineWidth = 2;
    ctx.stroke();

    const midAngle = startAngle + sliceAngle / 2;
    const labelR = radius * 0.65;
    const lx = centerX + Math.cos(midAngle) * labelR;
    const ly = centerY + Math.sin(midAngle) * labelR;

    if (sliceAngle > 0.2) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${d.label}`, lx, ly - 8);
      ctx.font = '11px sans-serif';
      ctx.fillText(`${(d.value / total * 100).toFixed(1)}%`, lx, ly + 8);
    }

    tooltipAreas.push({
      x: centerX + Math.cos(midAngle) * radius * 0.5 - 20,
      y: centerY + Math.sin(midAngle) * radius * 0.5 - 20,
      w: 40, h: 40,
      label: d.label,
      value: d.value,
      percentage: (d.value / total * 100).toFixed(1)
    });

    startAngle = endAngle;
  });

  setupTooltip(canvas, tooltipAreas, options.tooltipFormatter);
}

export function drawHeatmap(canvas, data, options = {}) {
  const container = canvas.parentElement;
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(container);
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const width = Math.max(100, options.width || (rect.width - paddingLeft - paddingRight) || 600);
  const height = options.height || 120;
  
  // 设置 ResizeObserver 监听容器尺寸变化
  if (!canvas._resizeObserver) {
    try {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          if (newWidth > 0 && canvas._lastWidth !== newWidth) {
            canvas._lastWidth = newWidth;
            // 使用 requestAnimationFrame 避免频繁重绘
            requestAnimationFrame(() => {
              if (canvas._lastData && canvas._lastOptions) {
                drawHeatmap(canvas, canvas._lastData, canvas._lastOptions);
              }
            });
          }
        }
      });
      resizeObserver.observe(container);
      canvas._resizeObserver = resizeObserver;
    } catch (e) {
      console.warn('ResizeObserver not supported:', e);
    }
  }
  
  canvas._lastData = data;
  canvas._lastOptions = options;
  canvas._lastWidth = width;
  
  const ctx = setupCanvas(canvas, width, height);
  clearCanvas(canvas);

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(options.title || '', width / 2, 24);

  const padding = { top: 50, right: 20, bottom: 20, left: 20 };
  const cols = data.length;
  const cellW = Math.max(20, (width - padding.left - padding.right) / cols);
  const cellH = Math.max(20, Math.min(40, (height - padding.top - padding.bottom)));

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const tooltipAreas = [];

  data.forEach((d, i) => {
    const x = padding.left + i * cellW;
    const y = padding.top;
    const ratio = (d.value - minVal) / range;

    let r, g, b;
    if (ratio < 0.5) {
      const t = ratio * 2;
      r = Math.round(52 + (243 - 52) * t);
      g = Math.round(152 + (156 - 152) * t);
      b = Math.round(219 + (18 - 219) * t);
    } else {
      const t = (ratio - 0.5) * 2;
      r = Math.round(243 + (231 - 243) * t);
      g = Math.round(156 + (76 - 156) * t);
      b = Math.round(18 + (60 - 18) * t);
    }

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    drawRoundedRect(ctx, x + 2, y, cellW - 4, cellH, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.label, x + cellW / 2, y + cellH / 2 - 6);
    ctx.font = '10px sans-serif';
    ctx.fillText(d.value.toString(), x + cellW / 2, y + cellH / 2 + 8);

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + cellW / 2, y + cellH + 14);

    tooltipAreas.push({
      x, y, w: cellW, h: cellH,
      label: d.label,
      value: d.value,
      percentage: d.percentage
    });
  });

  setupTooltip(canvas, tooltipAreas, options.tooltipFormatter);
}

function setupTooltip(canvas, areas, formatter) {
  const existing = canvas._tooltipHandler;
  if (existing) {
    canvas.removeEventListener('mousemove', existing);
    canvas.removeEventListener('mouseleave', existing);
  }

  let tooltipEl = document.getElementById('chart-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chart-tooltip';
    tooltipEl.style.cssText = 'position:fixed;padding:8px 12px;background:rgba(22,33,62,0.95);color:#e0e0e0;border:1px solid #0f3460;border-radius:6px;font-size:12px;pointer-events:none;z-index:1000;display:none;white-space:nowrap;';
    document.body.appendChild(tooltipEl);
  }

  const handler = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    for (const area of areas) {
      if (mx >= area.x && mx <= area.x + area.w && my >= area.y && my <= area.y + area.h) {
        found = area;
        break;
      }
    }

    if (found) {
      tooltipEl.style.display = 'block';
      tooltipEl.style.left = (e.clientX + 12) + 'px';
      tooltipEl.style.top = (e.clientY - 10) + 'px';
      if (formatter) {
        tooltipEl.innerHTML = formatter(found);
      } else {
        tooltipEl.innerHTML = `<strong>${found.label}</strong>: ${found.value}${found.percentage ? ` (${found.percentage}%)` : ''}`;
      }
    } else {
      tooltipEl.style.display = 'none';
    }
  };

  const leaveHandler = () => {
    tooltipEl.style.display = 'none';
  };

  canvas.addEventListener('mousemove', handler);
  canvas.addEventListener('mouseleave', leaveHandler);
  canvas._tooltipHandler = handler;
}
