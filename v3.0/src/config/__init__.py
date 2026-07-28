# -*- coding: utf-8 -*-
"""
彩票配置模块
提供配置定义、验证、管理功能
"""

from .validator import (
    LotteryConfigValidator,
    validate_lottery_config,
    format_validation_errors,
    ValidationError
)

from .manager import (
    LotteryConfigManager,
    get_config_manager
)

__all__ = [
    'LotteryConfigValidator',
    'validate_lottery_config',
    'format_validation_errors',
    'ValidationError',
    'LotteryConfigManager',
    'get_config_manager'
]
