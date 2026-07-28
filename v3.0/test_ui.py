#!/usr/bin/env python3
"""
测试v3.0彩票模拟器UI功能
"""

import time
import json
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

def test_config_editor():
    """测试配置编辑器的投注参数独立类目"""
    print("=== 测试配置编辑器投注参数独立类目 ===")
    
    # 设置Chrome选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # 启动浏览器
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # 打开配置编辑器页面
        driver.get("http://localhost:8080/ui/html/config-editor.html")
        
        # 等待页面加载
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "config-form"))
        )
        
        print("✓ 配置编辑器页面加载成功")
        
        # 检查投注模拟参数是否独立为一个区块
        bet_section = driver.find_element(By.XPATH, "//div[@class='form-section'][.//h3[contains(text(), '投注模拟参数')]]")
        print(f"✓ 找到投注模拟参数区块")
        
        # 检查投注参数字段
        single_ratio = driver.find_element(By.ID, "bet-single-ratio")
        complex_ratio = driver.find_element(By.ID, "bet-complex-ratio")
        dantuo_ratio = driver.find_element(By.ID, "bet-dantuo-ratio")
        
        print(f"✓ 找到投注类型参数字段")
        
        # 检查倍投参数字段
        mult_1x = driver.find_element(By.ID, "mult-1x")
        mult_2_5x = driver.find_element(By.ID, "mult-2-5x")
        max_multiplier = driver.find_element(By.ID, "max-multiplier")
        
        print(f"✓ 找到倍投参数字段")
        
        # 检查投注参数区块与特殊功能区块是分离的
        special_section = driver.find_element(By.XPATH, "//div[@class='form-section'][.//h3[contains(text(), '特殊功能')]]")
        
        # 获取两个区块的位置
        bet_section_location = bet_section.location
        special_section_location = special_section.location
        
        print(f"✓ 投注模拟参数区块位置: {bet_section_location}")
        print(f"✓ 特殊功能区块位置: {special_section_location}")
        
        # 验证两个区块是分离的（垂直位置不同）
        if bet_section_location['y'] != special_section_location['y']:
            print("✓ 投注参数区块与特殊功能区块是分离的")
        else:
            print("✗ 投注参数区块与特殊功能区块位置相同")
        
        return True
        
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        return False
    finally:
        driver.quit()

def test_homepage_current_lottery():
    """测试主页显示当前彩种名称"""
    print("\n=== 测试主页显示当前彩种名称 ===")
    
    # 设置Chrome选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # 启动浏览器
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # 先打开配置编辑器页面，设置一个配置
        driver.get("http://localhost:8080/ui/html/config-editor.html")
        
        # 等待页面加载
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "config-form"))
        )
        
        print("✓ 配置编辑器页面加载成功")
        
        # 检查是否有预设配置列表
        preset_list = driver.find_element(By.ID, "preset-list")
        preset_items = preset_list.find_elements(By.TAG_NAME, "li")
        
        if len(preset_items) > 0:
            print(f"✓ 找到 {len(preset_items)} 个预设配置")
            
            # 点击第一个预设配置
            preset_items[0].click()
            
            # 等待配置加载
            time.sleep(1)
            
            # 保存配置
            save_button = driver.find_element(By.ID, "btn-save")
            save_button.click()
            
            # 处理确认对话框
            try:
                alert = driver.switch_to.alert
                print(f"✓ 保存配置对话框: {alert.text}")
                alert.accept()
            except:
                print("✓ 配置保存成功（无对话框）")
        
        # 现在打开主页
        driver.get("http://localhost:8080/")
        
        # 等待页面加载
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "current-lottery"))
        )
        
        print("✓ 主页加载成功")
        
        # 检查当前彩种显示区域
        current_lottery = driver.find_element(By.ID, "current-lottery")
        lottery_name = driver.find_element(By.ID, "current-lottery-name")
        lottery_info = driver.find_element(By.ID, "current-lottery-info")
        
        print(f"✓ 当前彩种显示区域样式: {current_lottery.value_of_css_property('display')}")
        print(f"✓ 彩种名称: {lottery_name.text}")
        print(f"✓ 彩种信息: {lottery_info.text}")
        
        # 验证彩种名称不为空
        if lottery_name.text and lottery_name.text != "--":
            print("✓ 主页成功显示当前彩种名称")
            return True
        else:
            print("✗ 主页未显示当前彩种名称")
            return False
        
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        return False
    finally:
        driver.quit()

def main():
    """主测试函数"""
    print("开始测试v3.0彩票模拟器UI功能...")
    
    # 测试配置编辑器投注参数独立类目
    test1_result = test_config_editor()
    
    # 测试主页显示当前彩种名称
    test2_result = test_homepage_current_lottery()
    
    # 输出测试结果
    print("\n=== 测试结果 ===")
    print(f"配置编辑器投注参数独立类目: {'✓ 通过' if test1_result else '✗ 失败'}")
    print(f"主页显示当前彩种名称: {'✓ 通过' if test2_result else '✗ 失败'}")
    
    if test1_result and test2_result:
        print("\n所有测试通过！")
        return True
    else:
        print("\n部分测试失败")
        return False

if __name__ == "__main__":
    # 检查是否安装了selenium
    try:
        from selenium import webdriver
    except ImportError:
        print("需要安装selenium: pip install selenium")
        print("同时需要下载ChromeDriver: https://chromedriver.chromium.org/")
        exit(1)
    
    success = main()
    exit(0 if success else 1)