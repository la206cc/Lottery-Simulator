/**
 * 彩票配置编辑器 - 前端逻辑
 */

// 全局状态
let currentConfig = null;
let currentConfigId = null;
let isPreset = false;
let presetConfigs = {};
let userConfigs = {};

// DOM元素缓存
const elements = {};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    bindEvents();
    loadConfigs();
});

// 初始化DOM元素引用
function initElements() {
    elements.configForm = document.getElementById('config-form');
    elements.presetList = document.getElementById('preset-list');
    elements.userConfigList = document.getElementById('user-config-list');
    elements.currentConfigName = document.getElementById('current-config-name');
    elements.configTypeBadge = document.getElementById('config-type-badge');
    elements.zonesContainer = document.getElementById('zones-container');
    elements.playTypesContainer = document.getElementById('play-types-container');
    elements.prizesContainer = document.getElementById('prizes-container');
    elements.poolTiersContainer = document.getElementById('pool-tiers-container');
    elements.guaranteeRulesContainer = document.getElementById('guarantee-rules-container');
    elements.specialNumberZone = document.getElementById('special-number-zone');
    elements.validationResult = document.getElementById('validation-result');
    elements.validationMessages = document.getElementById('validation-messages');
}

// 绑定事件
function bindEvents() {
    // 按钮事件
    document.getElementById('btn-new-config').addEventListener('click', showNewConfigModal);
    document.getElementById('btn-load-preset').addEventListener('click', showPresetModal);
    document.getElementById('btn-import').addEventListener('click', importConfig);
    document.getElementById('btn-export').addEventListener('click', exportConfig);
    document.getElementById('btn-save').addEventListener('click', saveConfig);
    document.getElementById('btn-delete-config').addEventListener('click', showDeleteModal);
    document.getElementById('btn-duplicate-config').addEventListener('click', duplicateConfig);

    // 动态元素添加按钮
    document.getElementById('btn-add-zone').addEventListener('click', () => addZone());
    document.getElementById('btn-add-play-type').addEventListener('click', () => addPlayType());
    document.getElementById('btn-add-prize').addEventListener('click', () => addPrize());
    document.getElementById('btn-add-pool-tier').addEventListener('click', () => addPoolTier());
    document.getElementById('btn-add-guarantee').addEventListener('click', () => addGuaranteeRule());

    // 模态框关闭按钮
    document.getElementById('close-preset-modal').addEventListener('click', () => hideModal('modal-load-preset'));
    document.getElementById('close-delete-modal').addEventListener('click', () => hideModal('modal-confirm-delete'));
    document.getElementById('close-new-modal').addEventListener('click', () => hideModal('modal-new-config'));
    document.getElementById('cancel-delete').addEventListener('click', () => hideModal('modal-confirm-delete'));
    document.getElementById('cancel-new').addEventListener('click', () => hideModal('modal-new-config'));
    document.getElementById('confirm-delete').addEventListener('click', deleteConfig);
    document.getElementById('confirm-new').addEventListener('click', createNewConfig);

    // 文件导入
    document.getElementById('import-file-input').addEventListener('change', handleImportFile);

    // 表单变化监听
    elements.configForm.addEventListener('input', onFormChange);
}

// 加载配置列表
async function loadConfigs() {
    try {
        // 从预设文件加载
        const presetIds = ['ssq', 'dlt', 'fc3d', 'qxc', 'pls', 'plw', 'qlc', 'kl8'];
        const presetNames = {
            'ssq': '双色球',
            'dlt': '超级大乐透',
            'fc3d': '福彩3D',
            'qxc': '七星彩',
            'pls': '排列三',
            'plw': '排列五',
            'qlc': '七乐彩',
            'kl8': '快乐8'
        };

        // 渲染预设列表
        elements.presetList.innerHTML = '';
        presetIds.forEach(id => {
            const li = createConfigListItem(id, presetNames[id] || id, true);
            elements.presetList.appendChild(li);
        });

        // 从localStorage加载用户配置
        const savedUserConfigs = localStorage.getItem('lottery_user_configs');
        if (savedUserConfigs) {
            userConfigs = JSON.parse(savedUserConfigs);
        }

        renderUserConfigList();
    } catch (error) {
        console.error('加载配置失败:', error);
    }
}

// 渲染用户配置列表
function renderUserConfigList() {
    elements.userConfigList.innerHTML = '';

    const userConfigIds = Object.keys(userConfigs);
    if (userConfigIds.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-state';
        li.textContent = '暂无自定义配置';
        li.style.cursor = 'default';
        elements.userConfigList.appendChild(li);
        return;
    }

    userConfigIds.forEach(id => {
        const config = userConfigs[id];
        const li = createConfigListItem(id, config.name || id, false);
        elements.userConfigList.appendChild(li);
    });
}

// 创建配置列表项
function createConfigListItem(id, name, isPresetItem) {
    const li = document.createElement('li');
    li.dataset.id = id;
    li.dataset.isPreset = isPresetItem;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'config-name';
    nameSpan.textContent = name;

    const badge = document.createElement('span');
    badge.className = 'config-badge-small';
    badge.textContent = isPresetItem ? '预设' : '自定义';

    li.appendChild(nameSpan);
    li.appendChild(badge);

    li.addEventListener('click', () => loadConfig(id, isPresetItem));

    return li;
}

// 加载配置
async function loadConfig(id, isPresetItem) {
    try {
        let config;

        if (isPresetItem) {
            // 从预设加载
            const response = await fetch(`../../data/presets/${id}.json`);
            if (!response.ok) {
                throw new Error(`加载预设失败: ${response.statusText}`);
            }
            config = await response.json();
            presetConfigs[id] = config;
            
            // 将预设配置也保存到用户配置中，以便主页读取完整信息
            if (!userConfigs[id]) {
                userConfigs[id] = JSON.parse(JSON.stringify(config));
                saveUserConfigsToStorage();
                renderUserConfigList();
            }
        } else {
            // 从用户配置加载
            config = userConfigs[id];
            if (!config) {
                throw new Error('配置不存在');
            }
        }

        currentConfig = JSON.parse(JSON.stringify(config));
        currentConfigId = id;
        isPreset = isPresetItem;
        
        // 保存当前配置ID到localStorage，供主页显示
        localStorage.setItem('current_lottery_config_id', id);

        // 更新UI
        updateConfigInfo();
        renderConfigForm();
        highlightSelectedConfig(id, isPresetItem);
    } catch (error) {
        console.error('加载配置失败:', error);
        alert('加载配置失败: ' + error.message);
    }
}

// 更新配置信息显示
function updateConfigInfo() {
    if (!currentConfig) {
        elements.currentConfigName.textContent = '请选择或新建配置';
        elements.configTypeBadge.textContent = '';
        elements.configTypeBadge.style.display = 'none';
        return;
    }

    elements.currentConfigName.textContent = currentConfig.name || currentConfig.id;
    elements.configTypeBadge.textContent = isPreset ? '预设' : '自定义';
    elements.configTypeBadge.className = `config-badge ${isPreset ? '' : 'user'}`;
    elements.configTypeBadge.style.display = 'inline-block';
}

// 高亮选中的配置
function highlightSelectedConfig(id, isPresetItem) {
    // 移除所有高亮
    document.querySelectorAll('.config-items li').forEach(li => {
        li.classList.remove('active');
    });

    // 添加高亮
    const selector = `.config-items li[data-id="${id}"][data-is-preset="${isPresetItem}"]`;
    const selectedLi = document.querySelector(selector);
    if (selectedLi) {
        selectedLi.classList.add('active');
    }
}

// 渲染配置表单
function renderConfigForm() {
    if (!currentConfig) return;

    // 基础信息
    setInputValue('lottery-id', currentConfig.id);
    setInputValue('lottery-name', currentConfig.name);
    setInputValue('lottery-full-name', currentConfig.fullName);
    setInputValue('lottery-category', currentConfig.category);
    setInputValue('lottery-interval', currentConfig.issueInterval);
    setInputValue('lottery-price', currentConfig.pricePerBet);

    // 特殊功能
    setCheckboxValue('can-add-on', currentConfig.canAddOn);
    setInputValue('add-on-price', currentConfig.addOnPrice);
    setCheckboxValue('has-special-number', currentConfig.hasSpecialNumber);
    setCheckboxValue('has-reverse-prize', currentConfig.hasReversePrize);
    setInputValue('reverse-threshold', currentConfig.reverseThreshold);

    // 投注模拟参数
    if (currentConfig.betType) {
        setInputValue('bet-single-ratio', currentConfig.betType.singleRatio);
        setInputValue('bet-complex-ratio', currentConfig.betType.complexRatio);
        setInputValue('bet-dantuo-ratio', currentConfig.betType.danTuoRatio);
    }

    if (currentConfig.multiplier) {
        setInputValue('mult-1x', currentConfig.multiplier.ratio1x);
        setInputValue('mult-2-5x', currentConfig.multiplier.ratio2_5x);
        setInputValue('mult-6-20x', currentConfig.multiplier.ratio6_20x);
        setInputValue('mult-20x-plus', currentConfig.multiplier.ratio20xPlus);
        setInputValue('max-multiplier', currentConfig.multiplier.maxMultiplier);
    }

    // 渲染动态区域
    renderZones();
    renderPlayTypes();
    renderPrizes();
    renderPoolTiers();
    renderGuaranteeRules();
    updateSpecialNumberZoneOptions();
}

// 设置输入框值
function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
        element.value = value;
    }
}

// 设置复选框值
function setCheckboxValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.checked = !!value;
    }
}

// 渲染号码区域
function renderZones() {
    elements.zonesContainer.innerHTML = '';
    if (!currentConfig.zones) return;

    currentConfig.zones.forEach((zone, index) => {
        const zoneHtml = createZoneHtml(zone, index);
        elements.zonesContainer.insertAdjacentHTML('beforeend', zoneHtml);
    });
}

// 创建区域HTML
function createZoneHtml(zone, index) {
    return `
        <div class="dynamic-item" data-index="${index}">
            <div class="dynamic-item-header">
                <span class="dynamic-item-title">区域 ${index + 1}</span>
                <div class="dynamic-item-actions">
                    ${index > 0 ? `<button type="button" class="btn-icon" onclick="moveZone(${index}, -1)" title="上移">↑</button>` : ''}
                    ${index < currentConfig.zones.length - 1 ? `<button type="button" class="btn-icon" onclick="moveZone(${index}, 1)" title="下移">↓</button>` : ''}
                    <button type="button" class="btn-icon danger" onclick="removeZone(${index})" title="删除">×</button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>区域名称</label>
                    <input type="text" value="${zone.name || ''}" onchange="updateZone(${index}, 'name', this.value)" placeholder="如: 红球">
                </div>
                <div class="form-group">
                    <label>最小号码</label>
                    <input type="number" value="${zone.min ?? 1}" onchange="updateZone(${index}, 'min', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>最大号码</label>
                    <input type="number" value="${zone.max ?? 33}" onchange="updateZone(${index}, 'max', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>选取数量</label>
                    <input type="number" value="${zone.count ?? 6}" onchange="updateZone(${index}, 'count', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${zone.repeatable ? 'checked' : ''} onchange="updateZone(${index}, 'repeatable', this.checked)">
                        允许重复
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${zone.allowExtra ? 'checked' : ''} onchange="updateZone(${index}, 'allowExtra', this.checked)">
                        支持复式
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${zone.allowDanTuo ? 'checked' : ''} onchange="updateZone(${index}, 'allowDanTuo', this.checked)">
                        支持胆拖
                    </label>
                </div>
                <div class="form-group">
                    <label>显示颜色</label>
                    <select onchange="updateZone(${index}, 'color', this.value)">
                        <option value="">无</option>
                        <option value="red" ${zone.color === 'red' ? 'selected' : ''}>红色</option>
                        <option value="blue" ${zone.color === 'blue' ? 'selected' : ''}>蓝色</option>
                        <option value="green" ${zone.color === 'green' ? 'selected' : ''}>绿色</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

// 添加区域
function addZone() {
    if (!currentConfig) {
        alert('请先选择或创建一个配置');
        return;
    }

    if (!currentConfig.zones) {
        currentConfig.zones = [];
    }

    const newZone = {
        name: `区域${currentConfig.zones.length + 1}`,
        min: 1,
        max: 33,
        count: 6,
        repeatable: false,
        sorted: true,
        allowExtra: false,
        allowDanTuo: false
    };

    currentConfig.zones.push(newZone);
    renderZones();
    updateSpecialNumberZoneOptions();
}

// 更新区域
function updateZone(index, field, value) {
    if (currentConfig && currentConfig.zones && currentConfig.zones[index]) {
        currentConfig.zones[index][field] = value;
        updateSpecialNumberZoneOptions();
    }
}

// 删除区域
function removeZone(index) {
    if (!currentConfig || !currentConfig.zones) return;
    if (currentConfig.zones.length <= 1) {
        alert('至少需要一个号码区域');
        return;
    }

    currentConfig.zones.splice(index, 1);
    renderZones();
    updateSpecialNumberZoneOptions();
}

// 移动区域
function moveZone(index, direction) {
    if (!currentConfig || !currentConfig.zones) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentConfig.zones.length) return;

    const temp = currentConfig.zones[index];
    currentConfig.zones[index] = currentConfig.zones[newIndex];
    currentConfig.zones[newIndex] = temp;

    renderZones();
}

// 渲染玩法类型
function renderPlayTypes() {
    elements.playTypesContainer.innerHTML = '';
    if (!currentConfig.playTypes || currentConfig.playTypes.length === 0) {
        document.getElementById('play-types-section').style.display = 'none';
        return;
    }

    document.getElementById('play-types-section').style.display = 'block';

    currentConfig.playTypes.forEach((playType, index) => {
        const html = createPlayTypeHtml(playType, index);
        elements.playTypesContainer.insertAdjacentHTML('beforeend', html);
    });
}

// 创建玩法类型HTML
function createPlayTypeHtml(playType, index) {
    return `
        <div class="dynamic-item" data-index="${index}">
            <div class="dynamic-item-header">
                <span class="dynamic-item-title">玩法 ${index + 1}</span>
                <div class="dynamic-item-actions">
                    <button type="button" class="btn-icon danger" onclick="removePlayType(${index})" title="删除">×</button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>玩法ID</label>
                    <input type="text" value="${playType.id || ''}" onchange="updatePlayType(${index}, 'id', this.value)">
                </div>
                <div class="form-group">
                    <label>玩法名称</label>
                    <input type="text" value="${playType.name || ''}" onchange="updatePlayType(${index}, 'name', this.value)">
                </div>
                <div class="form-group">
                    <label>匹配方式</label>
                    <select onchange="updatePlayType(${index}, 'matchType', this.value)">
                        <option value="exact" ${playType.matchType === 'exact' ? 'selected' : ''}>按位匹配</option>
                        <option value="any" ${playType.matchType === 'any' ? 'selected' : ''}>不按位匹配</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>奖金倍数</label>
                    <input type="number" value="${playType.prizeMultiplier ?? 1}" step="0.1" onchange="updatePlayType(${index}, 'prizeMultiplier', parseFloat(this.value))">
                </div>
            </div>
        </div>
    `;
}

// 添加玩法类型
function addPlayType() {
    if (!currentConfig) {
        alert('请先选择或创建一个配置');
        return;
    }

    if (!currentConfig.playTypes) {
        currentConfig.playTypes = [];
    }

    const newPlayType = {
        id: `play${currentConfig.playTypes.length + 1}`,
        name: `玩法${currentConfig.playTypes.length + 1}`,
        matchType: 'exact',
        prizeMultiplier: 1.0
    };

    currentConfig.playTypes.push(newPlayType);
    renderPlayTypes();
}

// 更新玩法类型
function updatePlayType(index, field, value) {
    if (currentConfig && currentConfig.playTypes && currentConfig.playTypes[index]) {
        currentConfig.playTypes[index][field] = value;
    }
}

// 删除玩法类型
function removePlayType(index) {
    if (!currentConfig || !currentConfig.playTypes) return;

    currentConfig.playTypes.splice(index, 1);
    renderPlayTypes();
}

// 渲染奖级
function renderPrizes() {
    elements.prizesContainer.innerHTML = '';
    if (!currentConfig.prizes) return;

    currentConfig.prizes.forEach((prize, index) => {
        const html = createPrizeHtml(prize, index);
        elements.prizesContainer.insertAdjacentHTML('beforeend', html);
    });
}

// 创建奖级HTML
function createPrizeHtml(prize, index) {
    const matchPatternStr = JSON.stringify(prize.matchPattern || []);

    return `
        <div class="dynamic-item" data-index="${index}">
            <div class="dynamic-item-header">
                <span class="dynamic-item-title">奖级 ${prize.level}: ${prize.name || ''}</span>
                <div class="dynamic-item-actions">
                    ${index > 0 ? `<button type="button" class="btn-icon" onclick="movePrize(${index}, -1)" title="上移">↑</button>` : ''}
                    ${index < currentConfig.prizes.length - 1 ? `<button type="button" class="btn-icon" onclick="movePrize(${index}, 1)" title="下移">↓</button>` : ''}
                    <button type="button" class="btn-icon danger" onclick="removePrize(${index})" title="删除">×</button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>奖级</label>
                    <input type="number" value="${prize.level ?? (index + 1)}" onchange="updatePrize(${index}, 'level', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>奖级名称</label>
                    <input type="text" value="${prize.name || ''}" onchange="updatePrize(${index}, 'name', this.value)">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${prize.fixed ? 'checked' : ''} onchange="updatePrize(${index}, 'fixed', this.checked)">
                        固定奖金
                    </label>
                </div>
                <div class="form-group">
                    <label>中奖条件 (JSON数组)</label>
                    <input type="text" value='${matchPatternStr}' onchange="updatePrizeMatchPattern(${index}, this.value)">
                </div>
                ${prize.fixed ? `
                    <div class="form-group">
                        <label>固定金额（元）</label>
                        <input type="number" value="${prize.amount ?? 0}" onchange="updatePrize(${index}, 'amount', parseFloat(this.value))">
                    </div>
                ` : `
                    <div class="form-group">
                        <label>奖池占比</label>
                        <input type="number" value="${prize.poolRatio ?? 0.75}" step="0.01" onchange="updatePrize(${index}, 'poolRatio', parseFloat(this.value))">
                    </div>
                `}
                <div class="form-group">
                    <label>单注封顶（元）</label>
                    <input type="number" value="${prize.maxPerTicket ?? ''}" onchange="updatePrize(${index}, 'maxPerTicket', this.value ? parseFloat(this.value) : null)">
                </div>
                <div class="form-group">
                    <label>总奖金封顶（元）</label>
                    <input type="number" value="${prize.maxTotal ?? ''}" onchange="updatePrize(${index}, 'maxTotal', this.value ? parseFloat(this.value) : null)">
                </div>
            </div>
        </div>
    `;
}

// 添加奖级
function addPrize() {
    if (!currentConfig) {
        alert('请先选择或创建一个配置');
        return;
    }

    if (!currentConfig.prizes) {
        currentConfig.prizes = [];
    }

    const maxLevel = currentConfig.prizes.reduce((max, p) => Math.max(max, p.level || 0), 0);

    const newPrize = {
        level: maxLevel + 1,
        name: `${maxLevel + 1}等奖`,
        matchPattern: [[0]],
        fixed: true,
        amount: 0
    };

    currentConfig.prizes.push(newPrize);
    renderPrizes();
}

// 更新奖级
function updatePrize(index, field, value) {
    if (currentConfig && currentConfig.prizes && currentConfig.prizes[index]) {
        currentConfig.prizes[index][field] = value;
        renderPrizes(); // 重新渲染以更新UI
    }
}

// 更新奖级中奖条件
function updatePrizeMatchPattern(index, value) {
    if (currentConfig && currentConfig.prizes && currentConfig.prizes[index]) {
        try {
            const pattern = JSON.parse(value);
            currentConfig.prizes[index].matchPattern = pattern;
        } catch (e) {
            console.error('中奖条件JSON格式错误:', e);
        }
    }
}

// 删除奖级
function removePrize(index) {
    if (!currentConfig || !currentConfig.prizes) return;

    currentConfig.prizes.splice(index, 1);
    renderPrizes();
}

// 移动奖级
function movePrize(index, direction) {
    if (!currentConfig || !currentConfig.prizes) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentConfig.prizes.length) return;

    const temp = currentConfig.prizes[index];
    currentConfig.prizes[index] = currentConfig.prizes[newIndex];
    currentConfig.prizes[newIndex] = temp;

    renderPrizes();
}

// 渲染奖池分档
function renderPoolTiers() {
    elements.poolTiersContainer.innerHTML = '';
    if (!currentConfig.poolTiers || currentConfig.poolTiers.length === 0) {
        return;
    }

    currentConfig.poolTiers.forEach((tier, index) => {
        const html = createPoolTierHtml(tier, index);
        elements.poolTiersContainer.insertAdjacentHTML('beforeend', html);
    });
}

// 创建奖池分档HTML
function createPoolTierHtml(tier, index) {
    return `
        <div class="dynamic-item" data-index="${index}">
            <div class="dynamic-item-header">
                <span class="dynamic-item-title">分档 ${index + 1}</span>
                <div class="dynamic-item-actions">
                    ${index > 0 ? `<button type="button" class="btn-icon" onclick="movePoolTier(${index}, -1)" title="上移">↑</button>` : ''}
                    ${index < currentConfig.poolTiers.length - 1 ? `<button type="button" class="btn-icon" onclick="movePoolTier(${index}, 1)" title="下移">↓</button>` : ''}
                    <button type="button" class="btn-icon danger" onclick="removePoolTier(${index})" title="删除">×</button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>奖池最低值（元）</label>
                    <input type="number" value="${tier.min ?? 0}" onchange="updatePoolTier(${index}, 'min', parseFloat(this.value))">
                </div>
                <div class="form-group">
                    <label>奖池最高值（元，空=无上限）</label>
                    <input type="number" value="${tier.max ?? ''}" onchange="updatePoolTier(${index}, 'max', this.value ? parseFloat(this.value) : null)">
                </div>
                <div class="form-group">
                    <label>一等奖占比</label>
                    <input type="number" value="${tier.firstPrizeRatio ?? 0.75}" step="0.01" onchange="updatePoolTier(${index}, 'firstPrizeRatio', parseFloat(this.value))">
                </div>
                <div class="form-group">
                    <label>二等奖占比</label>
                    <input type="number" value="${tier.secondPrizeRatio ?? 0.25}" step="0.01" onchange="updatePoolTier(${index}, 'secondPrizeRatio', parseFloat(this.value))">
                </div>
                <div class="form-group">
                    <label>一等奖第二部分占比</label>
                    <input type="number" value="${tier.secondPartRatio ?? ''}" step="0.01" onchange="updatePoolTier(${index}, 'secondPartRatio', this.value ? parseFloat(this.value) : null)">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${tier.hasReverse ? 'checked' : ''} onchange="updatePoolTier(${index}, 'hasReverse', this.checked)">
                        倒置规则
                    </label>
                </div>
            </div>
        </div>
    `;
}

// 添加奖池分档
function addPoolTier() {
    if (!currentConfig) {
        alert('请先选择或创建一个配置');
        return;
    }

    if (!currentConfig.poolTiers) {
        currentConfig.poolTiers = [];
    }

    const maxMin = currentConfig.poolTiers.reduce((max, t) => Math.max(max, t.min || 0), 0);

    const newTier = {
        min: maxMin,
        max: null,
        firstPrizeRatio: 0.75,
        secondPrizeRatio: 0.25,
        secondPartRatio: null
    };

    currentConfig.poolTiers.push(newTier);
    renderPoolTiers();
}

// 更新奖池分档
function updatePoolTier(index, field, value) {
    if (currentConfig && currentConfig.poolTiers && currentConfig.poolTiers[index]) {
        currentConfig.poolTiers[index][field] = value;
    }
}

// 删除奖池分档
function removePoolTier(index) {
    if (!currentConfig || !currentConfig.poolTiers) return;

    currentConfig.poolTiers.splice(index, 1);
    renderPoolTiers();
}

// 移动奖池分档
function movePoolTier(index, direction) {
    if (!currentConfig || !currentConfig.poolTiers) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentConfig.poolTiers.length) return;

    const temp = currentConfig.poolTiers[index];
    currentConfig.poolTiers[index] = currentConfig.poolTiers[newIndex];
    currentConfig.poolTiers[newIndex] = temp;

    renderPoolTiers();
}

// 渲染保底规则
function renderGuaranteeRules() {
    elements.guaranteeRulesContainer.innerHTML = '';
    if (!currentConfig.guaranteeRules || currentConfig.guaranteeRules.length === 0) {
        return;
    }

    currentConfig.guaranteeRules.forEach((rule, index) => {
        const html = createGuaranteeRuleHtml(rule, index);
        elements.guaranteeRulesContainer.insertAdjacentHTML('beforeend', html);
    });
}

// 创建保底规则HTML
function createGuaranteeRuleHtml(rule, index) {
    return `
        <div class="dynamic-item" data-index="${index}">
            <div class="dynamic-item-header">
                <span class="dynamic-item-title">规则 ${index + 1}</span>
                <div class="dynamic-item-actions">
                    ${index > 0 ? `<button type="button" class="btn-icon" onclick="moveGuaranteeRule(${index}, -1)" title="上移">↑</button>` : ''}
                    ${index < currentConfig.guaranteeRules.length - 1 ? `<button type="button" class="btn-icon" onclick="moveGuaranteeRule(${index}, 1)" title="下移">↓</button>` : ''}
                    <button type="button" class="btn-icon danger" onclick="removeGuaranteeRule(${index})" title="删除">×</button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>受影响奖级</label>
                    <input type="number" value="${rule.level ?? 1}" onchange="updateGuaranteeRule(${index}, 'level', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>保底条件</label>
                    <input type="text" value="${rule.condition || ''}" onchange="updateGuaranteeRule(${index}, 'condition', this.value)">
                </div>
                <div class="form-group">
                    <label>触发保底的奖级</label>
                    <input type="number" value="${rule.triggerLevel ?? ''}" onchange="updateGuaranteeRule(${index}, 'triggerLevel', this.value ? parseInt(this.value) : null)">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" ${rule.cascade ? 'checked' : ''} onchange="updateGuaranteeRule(${index}, 'cascade', this.checked)">
                        级联触发
                    </label>
                </div>
                <div class="form-group">
                    <label>规则说明</label>
                    <input type="text" value="${rule.description || ''}" onchange="updateGuaranteeRule(${index}, 'description', this.value)">
                </div>
            </div>
        </div>
    `;
}

// 添加保底规则
function addGuaranteeRule() {
    if (!currentConfig) {
        alert('请先选择或创建一个配置');
        return;
    }

    if (!currentConfig.guaranteeRules) {
        currentConfig.guaranteeRules = [];
    }

    const newRule = {
        level: 1,
        condition: '',
        triggerLevel: null,
        cascade: false,
        description: ''
    };

    currentConfig.guaranteeRules.push(newRule);
    renderGuaranteeRules();
}

// 更新保底规则
function updateGuaranteeRule(index, field, value) {
    if (currentConfig && currentConfig.guaranteeRules && currentConfig.guaranteeRules[index]) {
        currentConfig.guaranteeRules[index][field] = value;
    }
}

// 删除保底规则
function removeGuaranteeRule(index) {
    if (!currentConfig || !currentConfig.guaranteeRules) return;

    currentConfig.guaranteeRules.splice(index, 1);
    renderGuaranteeRules();
}

// 移动保底规则
function moveGuaranteeRule(index, direction) {
    if (!currentConfig || !currentConfig.guaranteeRules) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentConfig.guaranteeRules.length) return;

    const temp = currentConfig.guaranteeRules[index];
    currentConfig.guaranteeRules[index] = currentConfig.guaranteeRules[newIndex];
    currentConfig.guaranteeRules[newIndex] = temp;

    renderGuaranteeRules();
}

// 更新特别号码区域选项
function updateSpecialNumberZoneOptions() {
    const select = elements.specialNumberZone;
    const currentValue = currentConfig?.specialNumberZone || '';

    select.innerHTML = '<option value="">-- 无 --</option>';

    if (currentConfig?.zones) {
        currentConfig.zones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone.name;
            option.textContent = zone.name;
            if (zone.name === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
}

// 表单变化处理
function onFormChange(event) {
    if (!currentConfig) return;

    const name = event.target.name;
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    // 处理嵌套属性
    if (name.includes('.')) {
        const parts = name.split('.');
        if (parts.length === 2) {
            if (!currentConfig[parts[0]]) {
                currentConfig[parts[0]] = {};
            }
            currentConfig[parts[0]][parts[1]] = event.target.type === 'number' ? parseFloat(value) || 0 : value;
        }
    } else {
        currentConfig[name] = event.target.type === 'number' ? parseFloat(value) || 0 : value;
    }
}

// 显示新建配置模态框
function showNewConfigModal() {
    document.getElementById('new-config-id').value = '';
    document.getElementById('new-config-name').value = '';
    showModal('modal-new-config');
}

// 创建新配置
function createNewConfig() {
    const id = document.getElementById('new-config-id').value.trim();
    const name = document.getElementById('new-config-name').value.trim();

    if (!id || !name) {
        alert('请填写配置ID和名称');
        return;
    }

    if (!/^[a-z0-9_]+$/.test(id)) {
        alert('ID只能包含小写字母、数字和下划线');
        return;
    }

    if (presetConfigs[id] || userConfigs[id]) {
        alert('ID已存在');
        return;
    }

    // 创建默认配置
    currentConfig = {
        id: id,
        name: name,
        fullName: name,
        category: '乐透型',
        issueInterval: 'weekly',
        pricePerBet: 2,
        currency: 'CNY',
        zones: [
            {
                name: '前区',
                min: 1,
                max: 35,
                count: 5,
                repeatable: false,
                sorted: true,
                allowExtra: true,
                maxExtra: 20,
                allowDanTuo: true
            }
        ],
        prizes: [
            {
                level: 1,
                name: '一等奖',
                matchPattern: [[5]],
                fixed: false,
                poolRatio: 0.75,
                maxPerTicket: 5000000
            }
        ],
        betType: {
            singleRatio: 0.60,
            complexRatio: 0.30,
            danTuoRatio: 0.10
        },
        multiplier: {
            ratio1x: 0.75,
            ratio2_5x: 0.20,
            ratio6_20x: 0.045,
            ratio20xPlus: 0.005,
            maxMultiplier: 100
        }
    };

    currentConfigId = id;
    isPreset = false;

    // 添加到用户配置
    userConfigs[id] = currentConfig;
    saveUserConfigsToStorage();

    // 更新UI
    renderUserConfigList();
    updateConfigInfo();
    renderConfigForm();
    highlightSelectedConfig(id, false);

    hideModal('modal-new-config');
}

// 显示预设模态框
function showPresetModal() {
    const presetGrid = document.getElementById('preset-grid');
    presetGrid.innerHTML = '';

    const presets = [
        { id: 'ssq', name: '双色球' },
        { id: 'dlt', name: '超级大乐透' },
        { id: 'fc3d', name: '福彩3D' },
        { id: 'qxc', name: '七星彩' },
        { id: 'pls', name: '排列三' },
        { id: 'plw', name: '排列五' },
        { id: 'qlc', name: '七乐彩' },
        { id: 'kl8', name: '快乐8' }
    ];

    presets.forEach(preset => {
        const card = document.createElement('div');
        card.className = 'preset-card';
        card.innerHTML = `
            <div class="preset-name">${preset.name}</div>
            <div class="preset-id">${preset.id}</div>
        `;
        card.addEventListener('click', () => {
            loadConfig(preset.id, true);
            hideModal('modal-load-preset');
        });
        presetGrid.appendChild(card);
    });

    showModal('modal-load-preset');
}

// 显示删除确认模态框
function showDeleteModal() {
    if (!currentConfig) {
        alert('请先选择一个配置');
        return;
    }

    if (isPreset) {
        alert('预设配置不允许删除');
        return;
    }

    document.getElementById('delete-config-name').textContent = currentConfig.name;
    showModal('modal-confirm-delete');
}

// 删除配置
function deleteConfig() {
    if (!currentConfigId || isPreset) return;

    delete userConfigs[currentConfigId];
    saveUserConfigsToStorage();

    currentConfig = null;
    currentConfigId = null;
    isPreset = false;

    renderUserConfigList();
    updateConfigInfo();
    renderConfigForm();

    hideModal('modal-confirm-delete');
}

// 复制配置
function duplicateConfig() {
    if (!currentConfig) {
        alert('请先选择一个配置');
        return;
    }

    const newId = prompt('请输入新配置ID:', currentConfig.id + '_copy');
    if (!newId) return;

    if (!/^[a-z0-9_]+$/.test(newId)) {
        alert('ID只能包含小写字母、数字和下划线');
        return;
    }

    if (userConfigs[newId]) {
        alert('ID已存在');
        return;
    }

    const newConfig = JSON.parse(JSON.stringify(currentConfig));
    newConfig.id = newId;
    newConfig.name = currentConfig.name + ' (副本)';

    userConfigs[newId] = newConfig;
    saveUserConfigsToStorage();

    renderUserConfigList();
    loadConfig(newId, false);
}

// 保存配置
function saveConfig() {
    if (!currentConfig) {
        alert('请先选择或创建一个配置');
        return;
    }

    // 验证配置
    const validation = validateConfig(currentConfig);
    showValidationResult(validation);

    if (!validation.valid) {
        alert('配置验证失败，请检查错误信息');
        return;
    }

    if (isPreset) {
        // 如果是预设，创建用户配置副本
        const newId = currentConfig.id + '_custom';
        if (!userConfigs[newId]) {
            currentConfig.id = newId;
            isPreset = false;
        }
    }

    userConfigs[currentConfig.id] = currentConfig;
    saveUserConfigsToStorage();
    
    // 保存当前配置ID到localStorage，供主页显示
    localStorage.setItem('current_lottery_config_id', currentConfig.id);

    renderUserConfigList();
    highlightSelectedConfig(currentConfig.id, false);

    alert('配置保存成功！');
}

// 验证配置
function validateConfig(config) {
    const errors = [];
    const warnings = [];

    // 必填字段
    if (!config.id) errors.push('缺少彩票ID');
    if (!config.name) errors.push('缺少彩票名称');
    if (!config.pricePerBet || config.pricePerBet <= 0) errors.push('单注价格必须大于0');

    // 区域配置
    if (!config.zones || config.zones.length === 0) {
        errors.push('至少需要一个号码区域');
    } else {
        config.zones.forEach((zone, i) => {
            if (!zone.name) errors.push(`区域${i + 1}缺少名称`);
            if (zone.min >= zone.max) errors.push(`区域${i + 1}的min必须小于max`);
            if (zone.count <= 0) errors.push(`区域${i + 1}的选取数量必须大于0`);
        });
    }

    // 奖级配置
    if (!config.prizes || config.prizes.length === 0) {
        errors.push('至少需要一个奖级');
    } else {
        config.prizes.forEach((prize, i) => {
            if (!prize.name) errors.push(`奖级${i + 1}缺少名称`);
            if (!prize.matchPattern || prize.matchPattern.length === 0) {
                errors.push(`奖级${i + 1}缺少中奖条件`);
            }
        });
    }

    // 投注类型占比
    if (config.betType) {
        const total = (config.betType.singleRatio || 0) +
                      (config.betType.complexRatio || 0) +
                      (config.betType.danTuoRatio || 0);
        if (Math.abs(total - 1) > 0.01) {
            warnings.push(`投注类型占比之和应为1.0，当前为${total.toFixed(3)}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// 显示验证结果
function showValidationResult(validation) {
    const container = elements.validationMessages;
    container.innerHTML = '';

    if (validation.errors.length === 0 && validation.warnings.length === 0) {
        container.innerHTML = '<div class="validation-message success">✓ 配置验证通过</div>';
    } else {
        validation.errors.forEach(error => {
            container.innerHTML += `<div class="validation-message error">❌ ${error}</div>`;
        });
        validation.warnings.forEach(warning => {
            container.innerHTML += `<div class="validation-message warning">⚠️ ${warning}</div>`;
        });
    }

    elements.validationResult.style.display = 'block';
}

// 导入配置
function importConfig() {
    document.getElementById('import-file-input').click();
}

// 处理导入文件
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);
            if (!config.id) {
                alert('配置文件缺少ID字段');
                return;
            }

            userConfigs[config.id] = config;
            saveUserConfigsToStorage();

            renderUserConfigList();
            loadConfig(config.id, false);

            alert('配置导入成功！');
        } catch (error) {
            alert('导入失败: ' + error.message);
        }
    };
    reader.readAsText(file);

    // 清空input
    event.target.value = '';
}

// 导出配置
function exportConfig() {
    if (!currentConfig) {
        alert('请先选择一个配置');
        return;
    }

    const dataStr = JSON.stringify(currentConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentConfig.id}_config.json`;
    link.click();

    URL.revokeObjectURL(url);
}

// 保存用户配置到localStorage
function saveUserConfigsToStorage() {
    localStorage.setItem('lottery_user_configs', JSON.stringify(userConfigs));
}

// 显示模态框
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// 隐藏模态框
function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
