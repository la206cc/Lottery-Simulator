export const COLORS = {
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

export function setupCanvas(canvas, width, height) {
  const DPR = window.devicePixelRatio || 1;
  canvas.width = width * DPR;
  canvas.height = height * DPR;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  return ctx;
}

export function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function debounce(func, wait = 150) {
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

export function setupResizeObserver(canvas, callback) {
  if (!canvas) return null;
  
  try {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth > 0) {
          requestAnimationFrame(() => {
            callback(newWidth);
          });
        }
      }
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    
    return resizeObserver;
  } catch (e) {
    console.warn('ResizeObserver not supported:', e);
    return null;
  }
}

export function drawRoundedRect(ctx, x, y, w, h, r) {
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

let tooltipEl = null;

export function setupTooltip(canvas, areas, formatter) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chart-tooltip';
    tooltipEl.style.cssText = 'position:fixed;padding:8px 12px;background:rgba(22,33,62,0.95);color:#e0e0e0;border:1px solid #0f3460;border-radius:6px;font-size:12px;pointer-events:none;z-index:1000;display:none;white-space:nowrap;';
    document.body.appendChild(tooltipEl);
  }
  
  const existing = canvas._tooltipHandler;
  if (existing) {
    canvas.removeEventListener('mousemove', existing);
    canvas.removeEventListener('mouseleave', existing);
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

export function getChartDimensions(canvas, options = {}) {
  const container = canvas.parentElement;
  if (!container) return { width: 600, height: 250 };
  
  const rect = container.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(container);
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const width = Math.max(100, options.width || (rect.width - paddingLeft - paddingRight) || 600);
  const height = options.height || 250;
  
  return { width, height };
}
