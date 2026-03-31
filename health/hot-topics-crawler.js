#!/usr/bin/env node
/**
 * 技术热点自动采集脚本
 * 运行方式：node health/hot-topics-crawler.js
 * 每8小时自动刷新，无需登录，无需交互，频率合规
 *
 * 数据来源（均无需登录，官方公开 API）：
 *   1. GitHub 星榜 API     - 最稳定，JSON，60次/小时免登录
 *   2. Hacker News API     - Firebase 官方接口，无频率限制，无反爬
 *   3. arXiv CS.AI RSS     - 官方 RSS，XML，无限制
 *
 * 输出：
 *   - 控制台彩色格式化输出
 *   - health/hot-topics.json（可供社区模块读取）
 */

'use strict';

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const OUTPUT_FILE  = path.join(__dirname, 'hot-topics.json');
const INTERVAL_MS  = 8 * 60 * 60 * 1000; // 8小时
const HN_TOP_N     = 8;   // 取 HN 前 N 条
const ARXIV_MAX    = 5;   // 取 arXiv 前 N 篇

// ─── ANSI 颜色 ────────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  magenta: '\x1b[35m',
  gray:    '\x1b[90m',
  red:     '\x1b[31m',
};
const ts = () => new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function fetchJSON(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'EduAI-HotTopics-Crawler/1.0 (educational research)',
        'Accept': 'application/json',
      },
      timeout,
    }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJSON(res.headers.location, timeout).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`JSON parse failed: ${data.slice(0, 100)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

function fetchText(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'EduAI-HotTopics-Crawler/1.0',
        'Accept': 'application/rss+xml, text/xml',
      },
      timeout,
    }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location, timeout).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// 技术关键词过滤（确保内容为计算机/AI/开源相关）
const TECH_KEYWORDS = [
  'ai', 'ml', 'llm', 'gpt', 'model', 'neural', 'deep learning', 'machine learning',
  'open source', 'github', 'rust', 'python', 'javascript', 'typescript', 'go', 'java',
  'database', 'api', 'cloud', 'linux', 'kernel', 'compiler', 'algorithm', 'data',
  'security', 'crypto', 'distributed', 'benchmark', 'inference', 'agent', 'rag',
  'vector', 'embedding', 'transformer', 'diffusion', 'programming', 'software',
  'developer', 'engineering', 'framework', 'library', 'tooling', 'performance',
];

function isTechRelated(text) {
  const lower = (text || '').toLowerCase();
  return TECH_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── 1. GitHub 星榜（AI/ML 仓库） ────────────────────────────────────────────

async function fetchGitHub() {
  console.log(`${C.gray}${ts()}${C.reset} ${C.cyan}[GitHub]${C.reset} 获取星榜仓库...`);
  try {
    // Query 1: top-starred repos overall (most stable)
    const data = await fetchJSON(
      'https://api.github.com/search/repositories?q=stars:>1&sort=stars&order=desc&per_page=3'
    );
    const repos = (data.items || []).slice(0, 3).map(r => ({
      name:        r.full_name,
      description: r.description || '暂无简介',
      stars:       r.stargazers_count,
      language:    r.language || 'Unknown',
      url:         r.html_url,
      topics:      (r.topics || []).slice(0, 5),
    }));

    // Query 2: trending AI repos (separate request, stays within rate limit)
    await new Promise(r => setTimeout(r, 2000)); // 2s delay between requests
    const aiData = await fetchJSON(
      'https://api.github.com/search/repositories?q=topic:machine-learning+stars:>5000&sort=stars&order=desc&per_page=3'
    );
    const aiRepos = (aiData.items || []).slice(0, 3).map(r => ({
      name:        r.full_name,
      description: r.description || '暂无简介',
      stars:       r.stargazers_count,
      language:    r.language || 'Unknown',
      url:         r.html_url,
      topics:      (r.topics || []).slice(0, 5),
    }));

    console.log(`${C.gray}${ts()}${C.reset} ${C.green}[GitHub]${C.reset} 获取成功 ${repos.length + aiRepos.length} 个仓库`);
    return { topRepos: repos, aiRepos };
  } catch (e) {
    console.log(`${C.gray}${ts()}${C.reset} ${C.red}[GitHub]${C.reset} 获取失败: ${e.message}`);
    return { topRepos: [], aiRepos: [] };
  }
}

// ─── 2. Hacker News 技术热点 ─────────────────────────────────────────────────

async function fetchHackerNews() {
  console.log(`${C.gray}${ts()}${C.reset} ${C.cyan}[HN]${C.reset} 获取技术热点...`);
  try {
    const ids = await fetchJSON('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topIds = (ids || []).slice(0, 40); // 取前40个筛选

    const items = [];
    for (const id of topIds) {
      if (items.length >= HN_TOP_N) break;
      try {
        const item = await fetchJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (item && item.title && item.type === 'story' && isTechRelated(item.title)) {
          items.push({
            title:  item.title,
            url:    item.url || `https://news.ycombinator.com/item?id=${item.id}`,
            score:  item.score || 0,
            comments: item.descendants || 0,
            time:   new Date(item.time * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          });
        }
        await new Promise(r => setTimeout(r, 150)); // 150ms 间隔，礼貌爬取
      } catch { /* skip failed items */ }
    }
    console.log(`${C.gray}${ts()}${C.reset} ${C.green}[HN]${C.reset} 获取 ${items.length} 条技术热点`);
    return items;
  } catch (e) {
    console.log(`${C.gray}${ts()}${C.reset} ${C.red}[HN]${C.reset} 获取失败: ${e.message}`);
    return [];
  }
}

// ─── 3. arXiv CS.AI 最新论文 ─────────────────────────────────────────────────

async function fetchArxiv() {
  console.log(`${C.gray}${ts()}${C.reset} ${C.cyan}[arXiv]${C.reset} 获取 AI 前沿论文...`);
  try {
    const xml = await fetchText(
      `https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=${ARXIV_MAX}`
    );

    const entries = [];
    const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
    for (const m of entryMatches) {
      const block = m[1];
      const title   = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim().replace(/\s+/g, ' ') || '';
      const summary = (block.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.trim().replace(/\s+/g, ' ').slice(0, 200) || '';
      const link    = (block.match(/<id>([\s\S]*?)<\/id>/) || [])[1]?.trim() || '';
      const authors = [...block.matchAll(/<name>([\s\S]*?)<\/name>/g)].map(a => a[1].trim()).slice(0, 3).join(', ');
      if (title) entries.push({ title, summary: summary + '...', authors, url: link });
    }
    console.log(`${C.gray}${ts()}${C.reset} ${C.green}[arXiv]${C.reset} 获取 ${entries.length} 篇论文`);
    return entries;
  } catch (e) {
    console.log(`${C.gray}${ts()}${C.reset} ${C.red}[arXiv]${C.reset} 获取失败: ${e.message}`);
    return [];
  }
}

// ─── 输出格式化 ───────────────────────────────────────────────────────────────

function printReport(data) {
  const { github, hn, arxiv, updatedAt } = data;
  const line = '═'.repeat(60);

  console.log(`\n${C.bold}${C.cyan}${line}${C.reset}`);
  console.log(`${C.bold}  技术热点聚合报告  ${updatedAt}${C.reset}`);
  console.log(`${C.bold}${C.cyan}${line}${C.reset}\n`);

  // GitHub 推荐
  console.log(`${C.bold}${C.magenta}🔥 GitHub 推荐项目${C.reset}`);
  console.log(`${C.gray}${'─'.repeat(60)}${C.reset}`);

  if (github.topRepos.length) {
    console.log(`${C.yellow}▶ 星标总榜 Top 3${C.reset}`);
    github.topRepos.forEach((r, i) => {
      console.log(`  ${i + 1}. ${C.bold}${r.name}${C.reset}  ⭐ ${r.stars.toLocaleString()}`);
      console.log(`     ${C.gray}${r.description.slice(0, 80)}${C.reset}`);
      console.log(`     ${C.gray}语言: ${r.language}  链接: ${r.url}${C.reset}`);
    });
  }

  if (github.aiRepos.length) {
    console.log(`\n${C.yellow}▶ AI/ML 热门仓库 Top 3${C.reset}`);
    github.aiRepos.forEach((r, i) => {
      console.log(`  ${i + 1}. ${C.bold}${r.name}${C.reset}  ⭐ ${r.stars.toLocaleString()}`);
      console.log(`     ${C.gray}${r.description.slice(0, 80)}${C.reset}`);
    });
  }

  // HN 技术热点
  console.log(`\n${C.bold}${C.cyan}💡 Hacker News 技术热点${C.reset}`);
  console.log(`${C.gray}${'─'.repeat(60)}${C.reset}`);
  if (hn.length) {
    hn.forEach((item, i) => {
      console.log(`  ${i + 1}. ${C.bold}${item.title}${C.reset}`);
      console.log(`     ${C.gray}分数: ${item.score}  评论: ${item.comments}  ${item.time}${C.reset}`);
    });
  } else {
    console.log(`  ${C.gray}(暂无数据)${C.reset}`);
  }

  // arXiv
  console.log(`\n${C.bold}${C.green}📄 arXiv CS.AI 最新论文${C.reset}`);
  console.log(`${C.gray}${'─'.repeat(60)}${C.reset}`);
  if (arxiv.length) {
    arxiv.forEach((p, i) => {
      console.log(`  ${i + 1}. ${C.bold}${p.title}${C.reset}`);
      console.log(`     ${C.gray}作者: ${p.authors}${C.reset}`);
      console.log(`     ${C.gray}摘要: ${p.summary.slice(0, 100)}...${C.reset}`);
    });
  } else {
    console.log(`  ${C.gray}(暂无数据)${C.reset}`);
  }

  console.log(`\n${C.gray}下次更新: 8小时后  输出文件: health/hot-topics.json${C.reset}`);
  console.log(`${C.gray}${'═'.repeat(60)}${C.reset}\n`);
}

// ─── 主循环 ───────────────────────────────────────────────────────────────────

async function run() {
  console.log(`${C.bold}${C.cyan}[热点采集]${C.reset} 启动... (每8小时自动刷新，Ctrl+C 停止)`);

  const github = await fetchGitHub();
  await new Promise(r => setTimeout(r, 3000)); // 两次大请求之间间隔
  const hn     = await fetchHackerNews();
  await new Promise(r => setTimeout(r, 2000));
  const arxiv  = await fetchArxiv();

  const data = {
    updatedAt: ts(),
    github,
    hn,
    arxiv,
  };

  // 写入 JSON 文件（供社区模块或 API 读取）
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`${C.green}[输出]${C.reset} 已写入 ${OUTPUT_FILE}`);
  } catch (e) {
    console.log(`${C.red}[输出]${C.reset} 写入失败: ${e.message}`);
  }

  printReport(data);
}

// 首次立即执行，之后每8小时执行一次
run().catch(e => console.error('[采集出错]', e.message));
setInterval(() => {
  run().catch(e => console.error('[采集出错]', e.message));
}, INTERVAL_MS);
