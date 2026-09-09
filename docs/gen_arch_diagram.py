#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成系统架构图 PNG（优化版），替换 ASCII 字符画"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import matplotlib.font_manager as fm

plt.rcParams['font.sans-serif'] = ['Noto Sans CJK SC', 'Noto Sans CJK JP', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

fig, ax = plt.subplots(1, 1, figsize=(11, 8))
ax.set_xlim(0, 11)
ax.set_ylim(0, 8)
ax.axis('off')

# 颜色方案
c_front = '#4A90D9'
c_back = '#50C878'
c_ai = '#F5A623'
c_rust = '#C0392B'
c_db = '#8E44AD'
c_redis = '#7F8C8D'

def draw_box(x, y, w, h, color):
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1",
                         facecolor=color, edgecolor='#2C3E50', linewidth=1.5)
    ax.add_patch(box)

def draw_arrow(x1, y1, x2, y2, label='', color='#555555', style='-'):
    ls = '--' if style == '--' else '-'
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=1.8, linestyle=ls))
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx+0.15, my, label, ha='left', va='center',
                fontsize=7.5, color='#34495E', style='italic')

# ===== 前端层（分两行：标题+角色）=====
draw_box(0.5, 6.6, 10, 1.0, c_front)
ax.text(5.5, 7.35, '前端层 (Vue 3 + TypeScript + Rust-WASM)', ha='center', va='center',
        fontsize=10.5, color='white', fontweight='bold')
# 三个角色端用小框
for i, (role, cx) in enumerate([('教师端', 2.5), ('学生端', 5.5), ('家长端', 8.5)]):
    draw_box(cx-1.0, 6.75, 2.0, 0.35, '#3A7BC8')
    ax.text(cx, 6.92, role, ha='center', va='center', fontsize=8.5, color='white', fontweight='bold')

# ===== Node.js 后端层 =====
draw_box(0.5, 4.8, 10, 0.9, c_back)
ax.text(5.5, 5.45, 'Node.js 后端 (Express + TypeScript)', ha='center', va='center',
        fontsize=10.5, color='white', fontweight='bold')
ax.text(5.5, 5.05, '认证 / 作业 / 批改 / 学情分析 / 推荐 / 通知  (:3000)', ha='center', va='center',
        fontsize=8, color='white')

# 箭头：前端到后端
draw_arrow(5.5, 6.55, 5.5, 5.75, 'HTTP / WebSocket')

# ===== AI 服务 & Rust 服务 =====
draw_box(0.3, 2.5, 4.8, 1.7, c_ai)
ax.text(2.7, 3.85, 'Python AI 服务', ha='center', va='center', fontsize=10, color='white', fontweight='bold')
ax.text(2.7, 3.5, 'Flask + gRPC', ha='center', va='center', fontsize=8.5, color='white')
ax.text(2.7, 3.15, ':50051', ha='center', va='center', fontsize=8, color='#FFF3E0')
ax.text(2.7, 2.75, 'OCR 识别\nBERT 主观题评分\nNLP 问答 / 个性化推荐', ha='center', va='center',
        fontsize=7.5, color='white')

draw_box(5.9, 2.5, 4.8, 1.7, c_rust)
ax.text(8.3, 3.85, 'Rust 高性能服务', ha='center', va='center', fontsize=10, color='white', fontweight='bold')
ax.text(8.3, 3.5, 'Actix-web + Tonic', ha='center', va='center', fontsize=8.5, color='white')
ax.text(8.3, 3.15, ':8080 / :50052', ha='center', va='center', fontsize=8, color='#FDEDEC')
ax.text(8.3, 2.75, 'AES-256-GCM / FEN-SAFE 加密\nbcrypt 哈希\nLevenshtein 相似度', ha='center', va='center',
        fontsize=7.5, color='white')

# 箭头：后端到两个服务
draw_arrow(3.5, 4.75, 2.7, 4.25, 'gRPC', '#E67E22')
draw_arrow(7.5, 4.75, 8.3, 4.25, 'gRPC', '#C0392B')

# Failover 虚线箭头
ax.annotate('', xy=(5.8, 3.3), xytext=(5.2, 3.3),
            arrowprops=dict(arrowstyle='<->', color='#7F8C8D', lw=1.5, linestyle='--'))
ax.text(5.5, 3.45, 'failover', ha='center', va='bottom', fontsize=7, color='#7F8C8D', style='italic')

# ===== 数据存储层 =====
draw_box(0.5, 0.3, 3.0, 1.2, c_db)
ax.text(2.0, 1.15, 'MySQL 8.0', ha='center', va='center', fontsize=9, color='white', fontweight='bold')
ax.text(2.0, 0.75, '结构化业务数据\n(utf8mb4 + 连接池)', ha='center', va='center', fontsize=7.5, color='white')

draw_box(4.0, 0.3, 3.0, 1.2, c_db)
ax.text(5.5, 1.15, 'MongoDB 5.0', ha='center', va='center', fontsize=9, color='white', fontweight='bold')
ax.text(5.5, 0.75, '学习行为日志\n视频进度 (批量写入)', ha='center', va='center', fontsize=7.5, color='white')

draw_box(7.5, 0.3, 3.0, 1.2, c_redis)
ax.text(9.0, 1.15, 'Redis 6.0', ha='center', va='center', fontsize=9, color='white', fontweight='bold')
ax.text(9.0, 0.75, '缓存与限流\n(可降级为内存缓存)', ha='center', va='center', fontsize=7.5, color='white')

# 箭头：服务到数据库
draw_arrow(2.7, 2.45, 2.0, 1.55, '', '#8E44AD')
draw_arrow(8.3, 2.45, 5.5, 1.55, '', '#8E44AD')
draw_arrow(7.0, 4.75, 9.0, 1.55, '', '#7F8C8D')

# 图标题
ax.text(5.5, 7.85, '图4.1 系统架构图', ha='center', va='center',
        fontsize=12, fontweight='bold', color='#2C3E50')

plt.tight_layout()
plt.savefig('/workspace/docs/arch_diagram.png', dpi=200, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print("优化版架构图已保存: /workspace/docs/arch_diagram.png")
