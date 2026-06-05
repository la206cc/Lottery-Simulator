import { setupCanvas, clearCanvas, setupResizeObserver, drawRoundedRect, setupTooltip, getChartDimensions, COLORS } from './base-chart.js';

export function drawBarChart(canvas, data, options = {}) {
  const { width, height } = getChartDimensions(canvas, options);
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

  let minVal, maxVal;
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
  }

  const barW = Math.max(4, (chartW / labels.length) * 0.7);
  const gap = chartW / labels.length;
  const tooltipAreas = [];

  labels.forEach((label, i) => {
    const x = padding.left + gap * i + (gap - barW) / 2;
    let fillColor = barColor;
    if (deviationColors && referenceLine !== null) {
      const diff = values[i] - referenceLine;
      fillColor = diff > 0 ? COLORS.red : COLORS.blue;
    }

    const barH = ((values[i] - minVal) / range) * chartH;
    const barY = padding.top + chartH - barH;
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

  setupTooltip(canvas, tooltipAreas, options.tooltipFormatter);
}

export function drawLineChart(canvas, data, options = {}) {
  const { width, height } = getChartDimensions(canvas, options);
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

  const tooltipAreas = [];
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    tooltipAreas.push({ x: p.x - 6, y: p.y - 6, w: 12, h: 12, label: labels[i], value: values[i] });
  });

  setupTooltip(canvas, tooltipAreas, options.tooltipFormatter);
}

export function drawPieChart(canvas, data, options = {}) {
  const size = Math.min(280, Math.max(180, canvas.parentElement?.clientWidth - 40 || 250));
  const width = size;
  const height = size;
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
  const { width, height } = getChartDimensions(canvas, { height: 120 });
  const ctx = setupCanvas(canvas, width, height);
  clearCanvas(canvas);

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(options.title || '', width / 2, 24);

  const padding = { top: 50, right: 20, bottom: 20, left: 20 };
  const cols = data.length;
  const cellW = Math.max(20, (width - padding.left - padding.right) / cols);
  const cellH = Math.max(20, Math.min(40, height - padding.top - padding.bottom));

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
