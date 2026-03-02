#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GPU环境检测脚本
"""

import sys

def check_gpu():
    """检测GPU环境"""
    print("="*50)
    print("GPU环境检测")
    print("="*50)
    
    # 检测PyTorch
    try:
        import torch
        print(f"✓ PyTorch版本: {torch.__version__}")
    except ImportError:
        print("✗ PyTorch未安装")
        print("  安装命令: pip install torch")
        return False
    
    # 检测CUDA
    if torch.cuda.is_available():
        print(f"✓ CUDA可用")
        print(f"  CUDA版本: {torch.version.cuda}")
        print(f"  GPU数量: {torch.cuda.device_count()}")
        
        for i in range(torch.cuda.device_count()):
            print(f"\n  GPU {i}: {torch.cuda.get_device_name(i)}")
            print(f"    显存总量: {torch.cuda.get_device_properties(i).total_memory / 1024**3:.2f} GB")
            print(f"    显存已用: {torch.cuda.memory_allocated(i) / 1024**3:.2f} GB")
            print(f"    显存可用: {(torch.cuda.get_device_properties(i).total_memory - torch.cuda.memory_allocated(i)) / 1024**3:.2f} GB")
        
        print("\n✓ GPU环境正常，可以开始训练")
        return True
    else:
        print("✗ CUDA不可用")
        print("  当前将使用CPU训练（速度极慢）")
        print("\n建议:")
        print("  1. 安装NVIDIA GPU驱动")
        print("  2. 安装CUDA Toolkit")
        print("  3. 安装支持CUDA的PyTorch版本")
        print("     pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118")
        return False


if __name__ == '__main__':
    success = check_gpu()
    sys.exit(0 if success else 1)
