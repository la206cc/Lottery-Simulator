from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class NumberZone:
    name: str
    min: int
    max: int
    count: int
    repeatable: bool = False
    color: str = '#e74c3c'

@dataclass
class PrizeTier:
    level: int
    name: str
    amount: int
    fixed: bool
    match_pattern: List[List[int]]
    max_per_ticket: Optional[int] = None
    pool_ratio: Optional[float] = None

@dataclass
class LotteryConfig:
    id: str
    name: str
    currency: str
    price_per_bet: float
    zones: List[NumberZone]
    prizes: List[PrizeTier]
    pool_ratio: float = 0.51

LOTTERY_CONFIGS: Dict[str, LotteryConfig] = {
    'ssq': LotteryConfig(
        id='ssq',
        name='双色球',
        currency='¥',
        price_per_bet=2.0,
        zones=[
            NumberZone(name='红球', min=1, max=33, count=6, color='#e74c3c'),
            NumberZone(name='蓝球', min=1, max=16, count=1, color='#3498db')
        ],
        prizes=[
            PrizeTier(level=1, name='一等奖', amount=5000000, fixed=False, match_pattern=[[6, 1]], max_per_ticket=5000000),
            PrizeTier(level=2, name='二等奖', amount=0, fixed=False, match_pattern=[[6, 0]], pool_ratio=0.25),
            PrizeTier(level=3, name='三等奖', amount=3000, fixed=True, match_pattern=[[5, 1]]),
            PrizeTier(level=4, name='四等奖', amount=200, fixed=True, match_pattern=[[5, 0], [4, 1]]),
            PrizeTier(level=5, name='五等奖', amount=10, fixed=True, match_pattern=[[4, 0], [3, 1]]),
            PrizeTier(level=6, name='六等奖', amount=5, fixed=True, match_pattern=[[2, 1], [1, 1], [0, 1]])
        ],
        pool_ratio=0.51
    ),
    'dlt': LotteryConfig(
        id='dlt',
        name='超级大乐透',
        currency='¥',
        price_per_bet=2.0,
        zones=[
            NumberZone(name='前区', min=1, max=35, count=5, color='#e74c3c'),
            NumberZone(name='后区', min=1, max=12, count=2, color='#3498db')
        ],
        prizes=[
            PrizeTier(level=1, name='一等奖', amount=5000000, fixed=False, match_pattern=[[5, 2]], max_per_ticket=5000000),
            PrizeTier(level=2, name='二等奖', amount=0, fixed=False, match_pattern=[[5, 1]], pool_ratio=0.22),
            PrizeTier(level=3, name='三等奖', amount=5000, fixed=True, match_pattern=[[5, 0], [4, 2]]),
            PrizeTier(level=4, name='四等奖', amount=300, fixed=True, match_pattern=[[4, 1]]),
            PrizeTier(level=5, name='五等奖', amount=150, fixed=True, match_pattern=[[4, 0], [3, 2]]),
            PrizeTier(level=6, name='六等奖', amount=15, fixed=True, match_pattern=[[3, 1], [2, 2]]),
            PrizeTier(level=7, name='七等奖', amount=5, fixed=True, match_pattern=[[3, 0], [2, 1], [1, 2], [0, 2]])
        ],
        pool_ratio=0.51
    ),
    'fc3d': LotteryConfig(
        id='fc3d',
        name='福彩3D',
        currency='¥',
        price_per_bet=2.0,
        zones=[
            NumberZone(name='号码', min=0, max=9, count=3, repeatable=True, color='#f39c12')
        ],
        prizes=[
            PrizeTier(level=1, name='直选', amount=1040, fixed=True, match_pattern=[[3]]),
            PrizeTier(level=2, name='组三', amount=346, fixed=True, match_pattern=[[3]]),
            PrizeTier(level=3, name='组六', amount=173, fixed=True, match_pattern=[[3]])
        ],
        pool_ratio=0.53
    ),
    'qxc': LotteryConfig(
        id='qxc',
        name='七星彩',
        currency='¥',
        price_per_bet=2.0,
        zones=[
            NumberZone(name='前区', min=0, max=9, count=6, repeatable=True, color='#e74c3c'),
            NumberZone(name='后区', min=0, max=14, count=1, repeatable=True, color='#3498db')
        ],
        prizes=[
            PrizeTier(level=1, name='一等奖', amount=5000000, fixed=False, match_pattern=[[6, 1]], max_per_ticket=5000000),
            PrizeTier(level=2, name='二等奖', amount=0, fixed=False, match_pattern=[[6, 0]], pool_ratio=0.10),
            PrizeTier(level=3, name='三等奖', amount=3000, fixed=True, match_pattern=[[5, 1]]),
            PrizeTier(level=4, name='四等奖', amount=500, fixed=True, match_pattern=[[5, 0], [4, 1]]),
            PrizeTier(level=5, name='五等奖', amount=30, fixed=True, match_pattern=[[4, 0], [3, 1]]),
            PrizeTier(level=6, name='六等奖', amount=5, fixed=True, match_pattern=[[3, 0], [2, 1], [1, 1], [0, 1]])
        ],
        pool_ratio=0.50
    ),
    'pls': LotteryConfig(
        id='pls',
        name='排列三',
        currency='¥',
        price_per_bet=2.0,
        zones=[
            NumberZone(name='号码', min=0, max=9, count=3, repeatable=True, color='#f39c12')
        ],
        prizes=[
            PrizeTier(level=1, name='直选', amount=1040, fixed=True, match_pattern=[[3]]),
            PrizeTier(level=2, name='组三', amount=346, fixed=True, match_pattern=[[3]]),
            PrizeTier(level=3, name='组六', amount=173, fixed=True, match_pattern=[[3]])
        ],
        pool_ratio=0.53
    ),
    'plw': LotteryConfig(
        id='plw',
        name='排列五',
        currency='¥',
        price_per_bet=2.0,
        zones=[
            NumberZone(name='号码', min=0, max=9, count=5, repeatable=True, color='#f39c12')
        ],
        prizes=[
            PrizeTier(level=1, name='一等奖', amount=100000, fixed=True, match_pattern=[[5]])
        ],
        pool_ratio=0.50
    ),
    'qlc': LotteryConfig(
        id='qlc',
        name='七乐彩',
        currency='¥',
        price_per_bet=2.0,
        zones=[
            NumberZone(name='基本号', min=1, max=30, count=7, color='#e74c3c')
        ],
        prizes=[
            PrizeTier(level=1, name='一等奖', amount=5000000, fixed=False, match_pattern=[[7]], max_per_ticket=5000000, pool_ratio=0.70),
            PrizeTier(level=2, name='二等奖', amount=0, fixed=False, match_pattern=[[6, 1]], pool_ratio=0.10),
            PrizeTier(level=3, name='三等奖', amount=0, fixed=False, match_pattern=[[6, 0]], pool_ratio=0.20),
            PrizeTier(level=4, name='四等奖', amount=200, fixed=True, match_pattern=[[5, 1]]),
            PrizeTier(level=5, name='五等奖', amount=60, fixed=True, match_pattern=[[5, 0]]),
            PrizeTier(level=6, name='六等奖', amount=12, fixed=True, match_pattern=[[4, 1]]),
            PrizeTier(level=7, name='七等奖', amount=10, fixed=True, match_pattern=[[4, 0]])
        ],
        pool_ratio=0.50
    ),
    'kl8': LotteryConfig(
        id='kl8',
        name='快乐8',
        currency='¥',
        price_per_bet=2.0,
        zones=[
            NumberZone(name='选号', min=1, max=80, count=10, color='#e67e22')
        ],
        prizes=[
            PrizeTier(level=1, name='选十中十', amount=5000000, fixed=False, match_pattern=[[10]], max_per_ticket=5000000, pool_ratio=0.60),
            PrizeTier(level=2, name='选十中九', amount=8000, fixed=True, match_pattern=[[9]]),
            PrizeTier(level=3, name='选十中八', amount=720, fixed=True, match_pattern=[[8]]),
            PrizeTier(level=4, name='选十中七', amount=80, fixed=True, match_pattern=[[7]]),
            PrizeTier(level=5, name='选十中六', amount=5, fixed=True, match_pattern=[[6]]),
            PrizeTier(level=6, name='选十中五', amount=3, fixed=True, match_pattern=[[5]]),
            PrizeTier(level=7, name='选十中零', amount=2, fixed=True, match_pattern=[[0]])
        ],
        pool_ratio=0.58
    )
}

def get_lottery_config(lottery_id: str) -> LotteryConfig:
    return LOTTERY_CONFIGS.get(lottery_id)

def list_lottery_types() -> List[str]:
    return list(LOTTERY_CONFIGS.keys())
