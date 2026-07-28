#!/usr/bin/env python3
"""
简单的HTTP服务器，用于测试v3.0彩票模拟器
"""

import http.server
import socketserver
import os
import sys

# 设置端口
PORT = 8080

# 切换到脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        # 添加CORS头，允许本地开发
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    try:
        with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
            print(f"彩票模拟器服务器已启动")
            print(f"访问地址: http://localhost:{PORT}")
            print(f"按 Ctrl+C 停止服务器")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except Exception as e:
        print(f"服务器启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()