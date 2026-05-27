import { init } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    init();
  } catch (e) {
    console.error('Init error:', e);
    document.body.innerHTML = `<div style="color:red;padding:20px;font-size:14px;"><h3>初始化错误</h3><pre>${e.stack || e.message}</pre></div>`;
  }
});
