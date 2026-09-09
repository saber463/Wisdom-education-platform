#!/usr/bin/env bash
# 本地 mermaid 渲染脚本：mmdc + chrome-headless-shell v151 + no-sandbox
export PUPPETEER_EXECUTABLE_PATH=/root/.cache/puppeteer/chrome-headless-shell/linux-151.0.7922.71/chrome-headless-shell-linux64/chrome-headless-shell
export PUPPETEER_SKIP_DOWNLOAD=true
CONFIG=/workspace/docs/.puppeteer/config.json
mmdc -p "$CONFIG" "$@"
