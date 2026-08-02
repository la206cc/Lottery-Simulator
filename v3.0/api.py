#!/usr/bin/env python3
"""
V3.0 彩票模拟器 - 统一服务器 (Flask API + 静态文件)

启动: python api.py
访问: http://localhost:5000
"""

import os, sys, json

# 确保项目根目录在 Python 路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from src.core.main import LotteryEngine, list_presets

app = Flask(__name__, static_folder='.')
CORS(app)


# ====== API 路由 ======

@app.route('/api/presets', methods=['GET'])
def get_presets():
    try:
        presets = list_presets()
        return jsonify({"success": True, "data": presets})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/config/<preset_id>', methods=['GET'])
def get_config(preset_id):
    try:
        engine = LotteryEngine(preset_id)
        config = engine.get_config()
        return jsonify({"success": True, "data": config})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 404


@app.route('/api/simulate', methods=['POST'])
def simulate():
    try:
        data = request.get_json()
        config_id = data.get('config_id', 'ssq')
        num_rounds = data.get('num_rounds', 1000)
        initial_pool = data.get('initial_pool', 100000000)
        initial_capital = data.get('initial_capital', 10000)
        strategy = data.get('strategy', None)
        mode = data.get('mode', 'single_draw')
        params = data.get('params', None)

        if num_rounds < 1 or num_rounds > 1000000:
            return jsonify({"success": False, "error": "模拟轮次必须在 1 到 1,000,000 之间"}), 400
        if mode not in ('single_draw', 'multi_draw'):
            return jsonify({"success": False, "error": "无效的模拟模式"}), 400

        engine = LotteryEngine(config_id)

        result = engine.simulator.simulate(
            config=engine.config,
            num_rounds=num_rounds,
            initial_pool=initial_pool,
            initial_capital=initial_capital,
            strategy=strategy,
            mode=mode
        )

        return jsonify({"success": True, "data": {"result": result}})

    except Exception as e:
        return jsonify({"success": False, "error": f"模拟失败: {str(e)}"}), 500


@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        config_id = data.get('config_id', 'ssq')
        sim_result = data.get('result', {})
        analysis_types = data.get('analysis_types', ['frequency', 'missing', 'trend'])

        if not sim_result:
            return jsonify({"success": False, "error": "缺少模拟结果数据"}), 400

        engine = LotteryEngine(config_id)
        analysis = engine.analyze(sim_result, analysis_types=analysis_types)
        return jsonify({"success": True, "data": analysis})

    except Exception as e:
        return jsonify({"success": False, "error": f"分析失败: {str(e)}"}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"success": True, "message": "彩票模拟器 v3.0 运行正常"})


# ====== 静态文件服务 ======

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory('.', path)
    return jsonify({"error": "Not found"}), 404


# ====== 启动 ======

def main():
    print("=" * 50)
    print("  彩票模拟器 v3.0 统一服务器")
    print("  http://localhost:5000")
    print("=" * 50)

    try:
        presets = list_presets()
        print(f"  已加载 {len(presets)} 种彩种预设: ", end="")
        print(", ".join(p.get('name', p.get('id', '?')) for p in presets))
    except Exception:
        print("  (预设加载失败，使用默认配置)")

    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)


if __name__ == '__main__':
    main()
