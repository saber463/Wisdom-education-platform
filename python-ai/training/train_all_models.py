#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一键训练所有AI模型
"""

import os
import sys
import subprocess
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_training_script(script_name, description):
    """运行训练脚本"""
    logger.info(f"\n{'='*60}")
    logger.info(f"开始训练: {description}")
    logger.info(f"脚本: {script_name}")
    logger.info(f"{'='*60}\n")
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            check=True,
            capture_output=False
        )
        logger.info(f"✓ {description} 训练完成")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"✗ {description} 训练失败: {e}")
        return False


def main():
    """主函数"""
    start_time = datetime.now()
    
    logger.info("="*60)
    logger.info("智慧教育平台 - AI模型批量训练")
    logger.info("="*60)
    
    # 检查GPU
    logger.info("\n1. 检测GPU环境...")
    try:
        subprocess.run([sys.executable, 'check_gpu.py'], check=True)
    except subprocess.CalledProcessError:
        logger.warning("⚠️ GPU检测失败，但将继续训练（使用CPU）")
    
    # 训练任务列表
    training_tasks = [
        ('train_learning_analytics.py', 'BERT学情分析模型'),
        ('train_resource_recommendation.py', 'BERT资源推荐模型'),
        ('train_speech_assessment.py', 'Wav2Vec2口语评测模型')
    ]
    
    results = []
    
    # 依次训练
    for script, description in training_tasks:
        success = run_training_script(script, description)
        results.append((description, success))
    
    # 总结
    end_time = datetime.now()
    duration = end_time - start_time
    
    logger.info("\n" + "="*60)
    logger.info("训练总结")
    logger.info("="*60)
    
    for description, success in results:
        status = "✓ 成功" if success else "✗ 失败"
        logger.info(f"{status} - {description}")
    
    success_count = sum(1 for _, success in results if success)
    total_count = len(results)
    
    logger.info(f"\n成功: {success_count}/{total_count}")
    logger.info(f"总耗时: {duration}")
    
    if success_count == total_count:
        logger.info("\n✓ 所有模型训练完成！")
        return 0
    else:
        logger.warning(f"\n⚠️ {total_count - success_count} 个模型训练失败")
        return 1


if __name__ == '__main__':
    sys.exit(main())
