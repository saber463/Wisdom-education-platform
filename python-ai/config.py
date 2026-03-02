"""
Python AI服务配置文件
"""

import os
from dotenv import load_dotenv

load_dotenv()

# 服务器配置
PORT = int(os.getenv('PORT', 5000))
GRPC_PORT = int(os.getenv('GRPC_PORT', 50051))

# 数据库配置
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'edu_education_platform')

# BERT模型配置
BERT_MODEL_PATH = os.getenv('BERT_MODEL_PATH', 'bert-base-chinese')
MODEL_CACHE_DIR = os.getenv('MODEL_CACHE_DIR', './models')

# OCR配置
TESSERACT_PATH = os.getenv('TESSERACT_PATH', r'C:\Program Files\Tesseract-OCR\tesseract.exe')
