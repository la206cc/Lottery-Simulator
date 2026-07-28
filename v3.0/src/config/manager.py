# -*- coding: utf-8 -*-
"""
彩票配置管理器
负责配置的加载、保存、切换、导入导出
"""
import json
import os
import shutil
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path
from copy import deepcopy

from .validator import LotteryConfigValidator, validate_lottery_config, ValidationError


class LotteryConfigManager:
    """彩票配置管理器"""
    
    # 默认配置目录
    PRESETS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'presets')
    USER_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'user')
    
    def __init__(self):
        """初始化配置管理器"""
        self._current_config: Optional[Dict] = None
        self._current_id: Optional[str] = None
        self._config_cache: Dict[str, Dict] = {}
        self._presets: Dict[str, Dict] = {}
        self._user_configs: Dict[str, Dict] = {}
        
        # 确保目录存在
        os.makedirs(self.PRESETS_DIR, exist_ok=True)
        os.makedirs(self.USER_DIR, exist_ok=True)
        
        # 加载预设
        self._load_presets()
        self._load_user_configs()
    
    def _load_presets(self):
        """加载预设配置"""
        self._presets.clear()
        
        if not os.path.exists(self.PRESETS_DIR):
            return
        
        for filename in os.listdir(self.PRESETS_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(self.PRESETS_DIR, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                        if 'id' in config:
                            self._presets[config['id']] = config
                except (json.JSONDecodeError, IOError) as e:
                    print(f"加载预设配置失败 {filename}: {e}")
    
    def _load_user_configs(self):
        """加载用户配置"""
        self._user_configs.clear()
        
        if not os.path.exists(self.USER_DIR):
            return
        
        for filename in os.listdir(self.USER_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(self.USER_DIR, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                        if 'id' in config:
                            self._user_configs[config['id']] = config
                except (json.JSONDecodeError, IOError) as e:
                    print(f"加载用户配置失败 {filename}: {e}")
    
    def get_all_configs(self) -> Dict[str, Dict]:
        """获取所有配置（预设+用户）"""
        all_configs = {}
        all_configs.update(self._presets)
        all_configs.update(self._user_configs)
        return all_configs
    
    def get_presets(self) -> Dict[str, Dict]:
        """获取所有预设配置"""
        return deepcopy(self._presets)
    
    def get_user_configs(self) -> Dict[str, Dict]:
        """获取所有用户配置"""
        return deepcopy(self._user_configs)
    
    def get_config(self, lottery_id: str) -> Optional[Dict]:
        """获取指定ID的配置"""
        # 优先从用户配置中查找
        if lottery_id in self._user_configs:
            return deepcopy(self._user_configs[lottery_id])
        # 其次从预设中查找
        if lottery_id in self._presets:
            return deepcopy(self._presets[lottery_id])
        return None
    
    def get_current_config(self) -> Optional[Dict]:
        """获取当前选中的配置"""
        return deepcopy(self._current_config) if self._current_config else None
    
    def get_current_id(self) -> Optional[str]:
        """获取当前选中的配置ID"""
        return self._current_id
    
    def set_current_config(self, lottery_id: str) -> bool:
        """设置当前选中的配置"""
        config = self.get_config(lottery_id)
        if config:
            self._current_config = config
            self._current_id = lottery_id
            return True
        return False
    
    def save_user_config(self, config: Dict, overwrite: bool = False) -> Tuple[bool, str]:
        """
        保存用户配置
        
        Args:
            config: 配置字典
            overwrite: 是否允许覆盖
            
        Returns:
            (是否成功, 消息)
        """
        # 验证配置
        is_valid, errors = validate_lottery_config(config)
        if not is_valid:
            error_msg = "\n".join([f"- {e.message}" for e in errors if e.severity == "error"])
            return False, f"配置验证失败:\n{error_msg}"
        
        lottery_id = config.get('id', '')
        
        # 检查是否是预设（不允许覆盖预设）
        if lottery_id in self._presets and not overwrite:
            return False, f"ID '{lottery_id}' 是预设配置，不允许覆盖。请使用其他ID。"
        
        # 检查是否已存在
        if lottery_id in self._user_configs and not overwrite:
            return False, f"配置 '{lottery_id}' 已存在，如需覆盖请设置 overwrite=True"
        
        # 保存文件
        filepath = os.path.join(self.USER_DIR, f"{lottery_id}.json")
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            # 更新缓存
            self._user_configs[lottery_id] = deepcopy(config)
            
            return True, f"配置 '{lottery_id}' 保存成功"
        except IOError as e:
            return False, f"保存失败: {e}"
    
    def delete_user_config(self, lottery_id: str) -> Tuple[bool, str]:
        """
        删除用户配置
        
        Args:
            lottery_id: 配置ID
            
        Returns:
            (是否成功, 消息)
        """
        # 不允许删除预设
        if lottery_id in self._presets:
            return False, f"ID '{lottery_id}' 是预设配置，不允许删除"
        
        # 不允许删除不存在的配置
        if lottery_id not in self._user_configs:
            return False, f"配置 '{lottery_id}' 不存在"
        
        # 删除文件
        filepath = os.path.join(self.USER_DIR, f"{lottery_id}.json")
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
            
            # 更新缓存
            del self._user_configs[lottery_id]
            
            # 如果删除的是当前配置，清空当前选择
            if self._current_id == lottery_id:
                self._current_config = None
                self._current_id = None
            
            return True, f"配置 '{lottery_id}' 删除成功"
        except IOError as e:
            return False, f"删除失败: {e}"
    
    def import_config(self, filepath: str, overwrite: bool = False) -> Tuple[bool, str]:
        """
        从文件导入配置
        
        Args:
            filepath: 配置文件路径
            overwrite: 是否允许覆盖
            
        Returns:
            (是否成功, 消息)
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            return self.save_user_config(config, overwrite)
        except FileNotFoundError:
            return False, f"文件不存在: {filepath}"
        except json.JSONDecodeError as e:
            return False, f"JSON格式错误: {e}"
        except IOError as e:
            return False, f"读取文件失败: {e}"
    
    def export_config(self, lottery_id: str, filepath: str) -> Tuple[bool, str]:
        """
        导出配置到文件
        
        Args:
            lottery_id: 配置ID
            filepath: 导出文件路径
            
        Returns:
            (是否成功, 消息)
        """
        config = self.get_config(lottery_id)
        if not config:
            return False, f"配置 '{lottery_id}' 不存在"
        
        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            return True, f"配置已导出到: {filepath}"
        except IOError as e:
            return False, f"导出失败: {e}"
    
    def create_default_config(self, lottery_id: str, name: str) -> Dict:
        """
        创建默认配置模板
        
        Args:
            lottery_id: 彩票ID
            name: 彩票名称
            
        Returns:
            默认配置字典
        """
        return {
            "id": lottery_id,
            "name": name,
            "fullName": name,
            "category": "乐透型",
            "issueInterval": "weekly",
            "pricePerBet": 2,
            "currency": "CNY",
            
            "zones": [
                {
                    "name": "前区",
                    "min": 1,
                    "max": 35,
                    "count": 5,
                    "repeatable": False,
                    "sorted": True,
                    "allowExtra": True,
                    "maxExtra": 20,
                    "allowDanTuo": True
                }
            ],
            
            "prizes": [
                {
                    "level": 1,
                    "name": "一等奖",
                    "matchPattern": [[5]],
                    "fixed": False,
                    "poolRatio": 0.75,
                    "maxPerTicket": 5000000
                },
                {
                    "level": 2,
                    "name": "二等奖",
                    "matchPattern": [[4]],
                    "fixed": True,
                    "amount": 10000
                }
            ],
            
            "betType": {
                "singleRatio": 0.60,
                "complexRatio": 0.30,
                "danTuoRatio": 0.10
            },
            
            "multiplier": {
                "ratio1x": 0.75,
                "ratio2_5x": 0.20,
                "ratio6_20x": 0.045,
                "ratio20xPlus": 0.005,
                "maxMultiplier": 100
            }
        }
    
    def duplicate_config(self, source_id: str, new_id: str, new_name: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        复制配置
        
        Args:
            source_id: 源配置ID
            new_id: 新配置ID
            new_name: 新配置名称
            
        Returns:
            (是否成功, 消息, 新配置)
        """
        source_config = self.get_config(source_id)
        if not source_config:
            return False, f"源配置 '{source_id}' 不存在", None
        
        # 检查新ID是否已存在
        if new_id in self._presets or new_id in self._user_configs:
            return False, f"ID '{new_id}' 已存在", None
        
        # 创建新配置
        new_config = deepcopy(source_config)
        new_config['id'] = new_id
        new_config['name'] = new_name
        if 'fullName' in new_config:
            new_config['fullName'] = new_name
        
        # 保存
        success, msg = self.save_user_config(new_config)
        if success:
            return True, msg, new_config
        else:
            return False, msg, None
    
    def list_config_ids(self) -> Dict[str, List[str]]:
        """列出所有配置ID（按类型分组）"""
        return {
            "presets": list(self._presets.keys()),
            "user": list(self._user_configs.keys())
        }
    
    def refresh(self):
        """刷新配置列表"""
        self._load_presets()
        self._load_user_configs()


# 便捷函数
def get_config_manager() -> LotteryConfigManager:
    """获取配置管理器单例"""
    if not hasattr(get_config_manager, '_instance'):
        get_config_manager._instance = LotteryConfigManager()
    return get_config_manager._instance
