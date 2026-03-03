#!/bin/bash

# 通用测试报告生成脚本
# 用于在 CI/CD 中自动生成测试报告

set -e

MODULE_NAME="${1:-unknown}"
REPORT_DIR="${2:-test-reports}"
COVERAGE_DIR="${3:-coverage}"

mkdir -p "${REPORT_DIR}"

TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')

echo "# ${MODULE_NAME} 测试报告" > "${REPORT_DIR}/TEST_REPORT.md"
echo "" >> "${REPORT_DIR}/TEST_REPORT.md"
echo "## 测试概览" >> "${REPORT_DIR}/TEST_REPORT.md"
echo "" >> "${REPORT_DIR}/TEST_REPORT.md"
echo "- **报告生成时间**: ${TIMESTAMP}" >> "${REPORT_DIR}/TEST_REPORT.md"
echo "- **模块名称**: ${MODULE_NAME}" >> "${REPORT_DIR}/TEST_REPORT.md"
echo "" >> "${REPORT_DIR}/TEST_REPORT.md"
echo "## 测试结果" >> "${REPORT_DIR}/TEST_REPORT.md"
echo "" >> "${REPORT_DIR}/TEST_REPORT.md"

if [ -d "${COVERAGE_DIR}" ]; then
    echo "### 覆盖率报告" >> "${REPORT_DIR}/TEST_REPORT.md"
    echo "" >> "${REPORT_DIR}/TEST_REPORT.md"
    
    if [ -f "${COVERAGE_DIR}/coverage-summary.json" ]; then
        echo "#### JSON 格式" >> "${REPORT_DIR}/TEST_REPORT.md"
        echo "" >> "${REPORT_DIR}/TEST_REPORT.md"
        echo '\`\`\`json' >> "${REPORT_DIR}/TEST_REPORT.md"
        cat "${COVERAGE_DIR}/coverage-summary.json" >> "${REPORT_DIR}/TEST_REPORT.md" 2>/dev/null || true
        echo '\`\`\`' >> "${REPORT_DIR}/TEST_REPORT.md"
        echo "" >> "${REPORT_DIR}/TEST_REPORT.md"
    fi
    
    if [ -f "${COVERAGE_DIR}/lcov-report/index.html" ]; then
        echo "#### HTML 报告" >> "${REPORT_DIR}/TEST_REPORT.md"
        echo "" >> "${REPORT_DIR}/TEST_REPORT.md"
        echo "[查看详细覆盖率报告](coverage/lcov-report/index.html)" >> "${REPORT_DIR}/TEST_REPORT.md"
        echo "" >> "${REPORT_DIR}/TEST_REPORT.md"
    fi
fi

echo "---" >> "${REPORT_DIR}/TEST_REPORT.md"
echo "*此报告由 CI/CD 系统自动生成*" >> "${REPORT_DIR}/TEST_REPORT.md"

echo "测试报告已生成: ${REPORT_DIR}/TEST_REPORT.md"
