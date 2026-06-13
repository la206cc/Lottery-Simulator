/**
 * 权重自适应零和波动算法（最终稳定版）
 * 特性：小占比自动收窄波动、大数承载主要波动、项数越多权重贴合度越高、总和恒为100%
 * @param {number[]} values 原始占比数组，sum(values) = 100
 * @param {number} K 全局相对波动系数 0 ~ 2（滑块值）
 * @returns {number[]} 波动数组，sum(noise) = 0
 */
function getAdaptiveWeightNoise(values, K) {
    // 关闭波动直接返回0数组
    if (K <= 0.001) {
        return new Array(values.length).fill(0);
    }

    const len = values.length;
    const noise = [];
    let totalDelta = 0;
    const MIN_BOUND = 0;
    const MAX_BOUND = 100;

    // 1. 生成前 n-1 项：权重波动 + 预边界约束
    for (let i = 0; i < len - 1; i++) {
        const val = values[i];
        // 按权重计算理论最大绝对波动
        const weightDelta = val * K / 100;
        // 下限：不能让结果 < 0
        const deltaLower = Math.max(-val, -weightDelta);
        // 上限：不能让结果 > 100
        const deltaUpper = Math.min(MAX_BOUND - val, weightDelta);
        // 在安全区间生成随机波动
        const delta = deltaLower + (deltaUpper - deltaLower) * Math.random();

        noise.push(delta);
        totalDelta += delta;
    }

    // 2. 最后一项补全，保证整组波动和 = 0
    const lastDelta = -totalDelta;
    noise.push(lastDelta);

    // 3. 全局边界校验 + 偏移重平衡（兜底，解决极端值/浮点误差）
    let offsetSum = 0;
    const validIndexList = [];

    for (let i = 0; i < len; i++) {
        const val = values[i];
        const d = noise[i];
        const current = val + d;

        if (current < MIN_BOUND) {
            // 触底锁定，记录偏移量
            const cut = current - MIN_BOUND;
            noise[i] = MIN_BOUND - val;
            offsetSum += cut;
        } else if (current > MAX_BOUND) {
            // 触顶锁定，记录偏移量
            const cut = current - MAX_BOUND;
            noise[i] = MAX_BOUND - val;
            offsetSum += cut;
        } else {
            // 正常项，后续分摊偏移
            validIndexList.push(i);
        }
    }

    // 4. 将边界截断产生的偏移，分摊到正常项，恢复零和
    if (validIndexList.length > 0 && Math.abs(offsetSum) > 1e-9) {
        const avgOffset = offsetSum / validIndexList.length;
        validIndexList.forEach(idx => {
            noise[idx] -= avgOffset;
        });
    }

    return noise;
}

/**
 * 应用波动并最终兜底（双层防护）
 */
function applyFinalNoise(baseVals, noiseArr) {
    const MIN = 0;
    const MAX = 100;
    return baseVals.map((v, i) => {
        let res = v + noiseArr[i];
        return Math.max(MIN, Math.min(MAX, res));
    });
}