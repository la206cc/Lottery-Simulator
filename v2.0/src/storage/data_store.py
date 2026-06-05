import os
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from typing import List, Dict, Optional
from datetime import datetime

class DataStore:
    def __init__(self, base_path: str = 'data'):
        self.base_path = base_path
        os.makedirs(os.path.join(base_path, 'simulations'), exist_ok=True)
        os.makedirs(os.path.join(base_path, 'purchases'), exist_ok=True)
    
    def save_draws(self, lottery_id: str, draws: List[Dict[str, List[int]]], 
                   draw_date: Optional[str] = None):
        """保存开奖结果"""
        if not draws:
            return
        
        date_str = draw_date or datetime.now().strftime('%Y%m%d')
        filepath = os.path.join(self.base_path, 'simulations', f'{lottery_id}_{date_str}.parquet')
        
        data = []
        for i, draw in enumerate(draws):
            row = {'draw_id': i, 'draw_date': date_str}
            for zone_name, numbers in draw.items():
                for j, num in enumerate(numbers, 1):
                    row[f'{zone_name.lower()}_{j}'] = num
            data.append(row)
        
        df = pd.DataFrame(data)
        table = pa.Table.from_pandas(df)
        pq.write_to_dataset(
            table,
            root_path=os.path.join(self.base_path, 'simulations', lottery_id),
            partition_cols=['draw_date'],
            existing_data_behavior='overwrite_or_ignore'
        )
    
    def save_purchases(self, lottery_id: str, purchases: List[Dict[str, List[int]]],
                      batch_id: str = None):
        """保存购买记录"""
        if not purchases:
            return
        
        batch_str = batch_id or datetime.now().strftime('%Y%m%d_%H%M%S')
        filepath = os.path.join(self.base_path, 'purchases', f'{lottery_id}_{batch_str}.parquet')
        
        data = []
        for i, purchase in enumerate(purchases):
            row = {'ticket_id': i, 'batch_id': batch_str}
            for zone_name, numbers in purchase.items():
                for j, num in enumerate(numbers, 1):
                    row[f'{zone_name.lower()}_{j}'] = num
            data.append(row)
        
        df = pd.DataFrame(data)
        table = pa.Table.from_pandas(df)
        pq.write_to_dataset(
            table,
            root_path=os.path.join(self.base_path, 'purchases', lottery_id),
            partition_cols=['batch_id'],
            existing_data_behavior='overwrite_or_ignore'
        )
    
    def load_draws(self, lottery_id: str, date_filter: Optional[str] = None) -> pd.DataFrame:
        """加载开奖数据"""
        path = os.path.join(self.base_path, 'simulations', lottery_id)
        if not os.path.exists(path):
            return pd.DataFrame()
        
        dataset = pq.ParquetDataset(path)
        df = dataset.read().to_pandas()
        
        if date_filter:
            df = df[df['draw_date'] == date_filter]
        
        return df
    
    def load_purchases(self, lottery_id: str, batch_filter: Optional[str] = None) -> pd.DataFrame:
        """加载购买数据"""
        path = os.path.join(self.base_path, 'purchases', lottery_id)
        if not os.path.exists(path):
            return pd.DataFrame()
        
        dataset = pq.ParquetDataset(path)
        df = dataset.read().to_pandas()
        
        if batch_filter:
            df = df[df['batch_id'] == batch_filter]
        
        return df
    
    def get_stats(self, lottery_id: str) -> Dict:
        """获取统计信息"""
        draws_path = os.path.join(self.base_path, 'simulations', lottery_id)
        purchases_path = os.path.join(self.base_path, 'purchases', lottery_id)
        
        draw_count = 0
        if os.path.exists(draws_path):
            try:
                dataset = pq.ParquetDataset(draws_path)
                draw_count = dataset.read().num_rows
            except:
                pass
        
        purchase_count = 0
        if os.path.exists(purchases_path):
            try:
                dataset = pq.ParquetDataset(purchases_path)
                purchase_count = dataset.read().num_rows
            except:
                pass
        
        return {
            'lottery_id': lottery_id,
            'draw_count': draw_count,
            'purchase_count': purchase_count,
            'last_updated': datetime.now().isoformat()
        }
