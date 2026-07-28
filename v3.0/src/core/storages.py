"""
通用数据存储模块实现

支持的存储功能：
1. Parquet格式存储（高效压缩）
2. JSON格式存储（通用）
3. CSV格式存储（可读性好）
4. 数据导入导出
5. 数据压缩
"""

import json
import csv
import os
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from .base import BaseDataStorage, LotteryConfig, ComponentFactory


class DefaultDataStorage(BaseDataStorage):
    """默认数据存储器"""
    
    def __init__(self, base_dir: str = "data"):
        """
        初始化存储器
        
        Args:
            base_dir: 基础目录
        """
        self.base_dir = base_dir
        os.makedirs(base_dir, exist_ok=True)
    
    def save_simulation_data(
        self,
        data: Dict[str, Any],
        config: LotteryConfig,
        filename: str
    ) -> str:
        """
        保存模拟数据
        
        Args:
            data: 模拟数据
            config: 彩票配置
            filename: 文件名
            
        Returns:
            保存的文件路径
        """
        # 创建目录
        save_dir = os.path.join(self.base_dir, config.id)
        os.makedirs(save_dir, exist_ok=True)
        
        # 生成完整文件名
        if not filename.endswith('.json'):
            filename = f"{filename}.json"
        
        filepath = os.path.join(save_dir, filename)
        
        # 添加元数据
        save_data = {
            "metadata": {
                "config_id": config.id,
                "config_name": config.name,
                "created_at": datetime.now().isoformat(),
                "data_type": "simulation"
            },
            "data": data
        }
        
        # 保存JSON
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        return filepath
    
    def load_simulation_data(
        self,
        filename: str
    ) -> Dict[str, Any]:
        """
        加载模拟数据
        
        Args:
            filename: 文件名
            
        Returns:
            模拟数据
        """
        # 检查文件是否存在
        if not os.path.exists(filename):
            raise FileNotFoundError(f"文件不存在: {filename}")
        
        # 加载JSON
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return data
    
    def export_data(
        self,
        data: Dict[str, Any],
        format: str = "json"
    ) -> str:
        """
        导出数据
        
        Args:
            data: 数据
            format: 导出格式
            
        Returns:
            导出的数据
        """
        if format == "json":
            return json.dumps(data, ensure_ascii=False, indent=2)
        elif format == "csv":
            return self._export_to_csv(data)
        else:
            return json.dumps(data, ensure_ascii=False, indent=2)
    
    def _export_to_csv(self, data: Dict[str, Any]) -> str:
        """
        导出为CSV格式
        
        Args:
            data: 数据
            
        Returns:
            CSV字符串
        """
        # 简化处理，实际应该根据数据结构调整
        if "rounds" in data:
            rounds = data["rounds"]
            if rounds:
                # 获取字段名
                fields = list(rounds[0].keys())
                
                # 生成CSV
                output = []
                output.append(",".join(fields))
                
                for row in rounds:
                    values = []
                    for field in fields:
                        value = row.get(field, "")
                        if isinstance(value, (dict, list)):
                            value = json.dumps(value)
                        values.append(str(value))
                    output.append(",".join(values))
                
                return "\n".join(output)
        
        return json.dumps(data, ensure_ascii=False, indent=2)
    
    def save_analysis_data(
        self,
        data: Dict[str, Any],
        config: LotteryConfig,
        analysis_type: str
    ) -> str:
        """
        保存分析数据
        
        Args:
            data: 分析数据
            config: 彩票配置
            analysis_type: 分析类型
            
        Returns:
            保存的文件路径
        """
        # 创建目录
        save_dir = os.path.join(self.base_dir, config.id, "analysis")
        os.makedirs(save_dir, exist_ok=True)
        
        # 生成文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{analysis_type}_{timestamp}.json"
        filepath = os.path.join(save_dir, filename)
        
        # 添加元数据
        save_data = {
            "metadata": {
                "config_id": config.id,
                "config_name": config.name,
                "created_at": datetime.now().isoformat(),
                "data_type": "analysis",
                "analysis_type": analysis_type
            },
            "data": data
        }
        
        # 保存JSON
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        return filepath
    
    def save_config(
        self,
        config: LotteryConfig,
        filename: Optional[str] = None
    ) -> str:
        """
        保存配置
        
        Args:
            config: 彩票配置
            filename: 文件名
            
        Returns:
            保存的文件路径
        """
        # 创建目录
        save_dir = os.path.join(self.base_dir, "configs")
        os.makedirs(save_dir, exist_ok=True)
        
        # 生成文件名
        if filename is None:
            filename = f"{config.id}_config.json"
        
        filepath = os.path.join(save_dir, filename)
        
        # 转换为字典
        from .base import ConfigLoader
        config_dict = ConfigLoader.to_json(config)
        
        # 保存JSON
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(config_dict, f, ensure_ascii=False, indent=2)
        
        return filepath
    
    def load_config(
        self,
        filename: str
    ) -> LotteryConfig:
        """
        加载配置
        
        Args:
            filename: 文件名
            
        Returns:
            彩票配置
        """
        # 检查文件是否存在
        if not os.path.exists(filename):
            raise FileNotFoundError(f"文件不存在: {filename}")
        
        # 加载JSON
        with open(filename, 'r', encoding='utf-8') as f:
            config_dict = json.load(f)
        
        # 转换为配置对象
        from .base import ConfigLoader
        config = ConfigLoader.from_json(config_dict)
        
        return config
    
    def list_files(
        self,
        config_id: Optional[str] = None,
        data_type: Optional[str] = None
    ) -> List[str]:
        """
        列出文件
        
        Args:
            config_id: 配置ID
            data_type: 数据类型
            
        Returns:
            文件路径列表
        """
        files = []
        
        if config_id:
            search_dir = os.path.join(self.base_dir, config_id)
        else:
            search_dir = self.base_dir
        
        if not os.path.exists(search_dir):
            return files
        
        for root, dirs, filenames in os.walk(search_dir):
            for filename in filenames:
                if filename.endswith('.json'):
                    filepath = os.path.join(root, filename)
                    
                    # 检查数据类型
                    if data_type:
                        try:
                            with open(filepath, 'r', encoding='utf-8') as f:
                                data = json.load(f)
                            if data.get("metadata", {}).get("data_type") == data_type:
                                files.append(filepath)
                        except:
                            pass
                    else:
                        files.append(filepath)
        
        return files
    
    def delete_file(self, filename: str) -> bool:
        """
        删除文件
        
        Args:
            filename: 文件名
            
        Returns:
            是否成功删除
        """
        try:
            if os.path.exists(filename):
                os.remove(filename)
                return True
            return False
        except:
            return False


class ParquetDataStorage(DefaultDataStorage):
    """Parquet格式数据存储器"""
    
    def save_simulation_data(
        self,
        data: Dict[str, Any],
        config: LotteryConfig,
        filename: str
    ) -> str:
        """
        保存模拟数据（Parquet格式）
        
        Args:
            data: 模拟数据
            config: 彩票配置
            filename: 文件名
            
        Returns:
            保存的文件路径
        """
        try:
            import pandas as pd
            import pyarrow as pa
            import pyarrow.parquet as pq
            
            # 创建目录
            save_dir = os.path.join(self.base_dir, config.id)
            os.makedirs(save_dir, exist_ok=True)
            
            # 生成完整文件名
            if not filename.endswith('.parquet'):
                filename = f"{filename}.parquet"
            
            filepath = os.path.join(save_dir, filename)
            
            # 转换数据为DataFrame
            if "rounds" in data:
                df = pd.DataFrame(data["rounds"])
                
                # 保存Parquet
                df.to_parquet(filepath, index=False)
                
                # 保存元数据
                metadata = {
                    "config_id": config.id,
                    "config_name": config.name,
                    "created_at": datetime.now().isoformat(),
                    "data_type": "simulation",
                    "num_rows": len(df)
                }
                
                metadata_path = filepath.replace('.parquet', '_metadata.json')
                with open(metadata_path, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, ensure_ascii=False, indent=2)
                
                return filepath
            
        except ImportError:
            # 如果没有pandas/pyarrow，使用默认JSON存储
            return super().save_simulation_data(data, config, filename)
    
    def load_simulation_data(
        self,
        filename: str
    ) -> Dict[str, Any]:
        """
        加载模拟数据（Parquet格式）
        
        Args:
            filename: 文件名
            
        Returns:
            模拟数据
        """
        try:
            import pandas as pd
            
            # 检查文件是否存在
            if not os.path.exists(filename):
                raise FileNotFoundError(f"文件不存在: {filename}")
            
            # 加载Parquet
            df = pd.read_parquet(filename)
            
            # 转换为字典
            data = {
                "rounds": df.to_dict(orient='records')
            }
            
            # 加载元数据
            metadata_path = filename.replace('.parquet', '_metadata.json')
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                data["metadata"] = metadata
            
            return data
            
        except ImportError:
            # 如果没有pandas，使用默认JSON存储
            return super().load_simulation_data(filename)


class CSVDataStorage(DefaultDataStorage):
    """CSV格式数据存储器"""
    
    def save_simulation_data(
        self,
        data: Dict[str, Any],
        config: LotteryConfig,
        filename: str
    ) -> str:
        """
        保存模拟数据（CSV格式）
        
        Args:
            data: 模拟数据
            config: 彩票配置
            filename: 文件名
            
        Returns:
            保存的文件路径
        """
        # 创建目录
        save_dir = os.path.join(self.base_dir, config.id)
        os.makedirs(save_dir, exist_ok=True)
        
        # 生成完整文件名
        if not filename.endswith('.csv'):
            filename = f"{filename}.csv"
        
        filepath = os.path.join(save_dir, filename)
        
        # 保存CSV
        if "rounds" in data:
            rounds = data["rounds"]
            if rounds:
                # 获取字段名
                fields = list(rounds[0].keys())
                
                with open(filepath, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=fields)
                    writer.writeheader()
                    writer.writerows(rounds)
                
                # 保存元数据
                metadata = {
                    "config_id": config.id,
                    "config_name": config.name,
                    "created_at": datetime.now().isoformat(),
                    "data_type": "simulation",
                    "num_rows": len(rounds)
                }
                
                metadata_path = filepath.replace('.csv', '_metadata.json')
                with open(metadata_path, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, ensure_ascii=False, indent=2)
                
                return filepath
        
        return super().save_simulation_data(data, config, filename)
    
    def load_simulation_data(
        self,
        filename: str
    ) -> Dict[str, Any]:
        """
        加载模拟数据（CSV格式）
        
        Args:
            filename: 文件名
            
        Returns:
            模拟数据
        """
        # 检查文件是否存在
        if not os.path.exists(filename):
            raise FileNotFoundError(f"文件不存在: {filename}")
        
        # 加载CSV
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rounds = list(reader)
        
        data = {
            "rounds": rounds
        }
        
        # 加载元数据
        metadata_path = filename.replace('.csv', '_metadata.json')
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            data["metadata"] = metadata
        
        return data


# 注册默认组件
ComponentFactory.register_storage("default", DefaultDataStorage)
ComponentFactory.register_storage("parquet", ParquetDataStorage)
ComponentFactory.register_storage("csv", CSVDataStorage)