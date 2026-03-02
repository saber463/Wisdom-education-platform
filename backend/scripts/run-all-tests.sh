#!/bin/bash
# 运行所有测试脚本
# Task: 22.1, 22.2, 22.3

echo "=========================================="
echo "开始运行所有测试"
echo "=========================================="

# 设置测试环境
export NODE_ENV=test
export DB_NAME=edu_education_platform_test

# 1. 运行单元测试
echo ""
echo "1. 运行单元测试..."
npm run test:unit -- --coverage

# 2. 运行属性测试
echo ""
echo "2. 运行属性测试..."
npm run test:property -- --verbose

# 3. 运行集成测试
echo ""
echo "3. 运行集成测试..."
npm run test:integration

echo ""
echo "=========================================="
echo "所有测试完成"
echo "=========================================="

