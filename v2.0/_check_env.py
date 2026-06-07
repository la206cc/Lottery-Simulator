import sys
print(f"Python: {sys.version}")
try:
    import numpy
    print(f"numpy: {numpy.__version__}")
except ImportError as e:
    print(f"numpy missing: {e}")
try:
    import psutil
    print(f"psutil: {psutil.__version__}")
except ImportError as e:
    print(f"psutil missing: {e}")
print("OK")
