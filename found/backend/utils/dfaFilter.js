// 基于DFA算法的敏感词检测器
class DFASensitiveFilter {
  constructor(sensitiveWords = []) {
    this.sensitiveMap = {};
    this.init(sensitiveWords);
  }

  // 初始化敏感词库，构建DFA状态机
  init(sensitiveWords) {
    if (!Array.isArray(sensitiveWords)) {
      return;
    }

    // 过滤并准备有效的敏感词列表
    const validSensitiveWords = sensitiveWords
      .filter(word => typeof word === 'string' && word.trim() !== '')
      .map(word => word.trim())
      .filter((word, index, self) => self.indexOf(word) === index)
      .sort((a, b) => b.length - a.length);

    for (const word of validSensitiveWords) {
      let currentMap = this.sensitiveMap;
      const length = word.length;

      for (let i = 0; i < length; i++) {
        const char = word[i];
        const lowerChar = char.toLowerCase();

        // 检查当前字符是否存在于当前映射中
        if (!currentMap[char]) {
          currentMap[char] = { isEnd: false };
        }

        // 同时添加小写版本，用于不区分大小写的匹配
        if (char !== lowerChar && !currentMap[lowerChar]) {
          currentMap[lowerChar] = { isEnd: false };
        }

        // 如果是最后一个字符，标记为结束
        if (i === length - 1) {
          currentMap[char].isEnd = true;
          if (char !== lowerChar) {
            currentMap[lowerChar].isEnd = true;
          }
        }

        // 移动到下一个映射
        currentMap = currentMap[char];
      }
    }
  }

  // 添加敏感词
  addWords(words) {
    if (Array.isArray(words)) {
      this.init(words);
    }
  }

  // 检测文本是否包含敏感词
  containsSensitiveWord(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const length = text.length;
    for (let i = 0; i < length; i++) {
      if (this.checkFromIndex(text, i)) {
        return true;
      }
    }
    return false;
  }

  // 从指定索引开始检查是否包含敏感词
  checkFromIndex(text, index) {
    let currentMap = this.sensitiveMap;
    let match = false;

    for (let i = index; i < text.length; i++) {
      const char = text[i];

      // 如果当前字符不在映射中，中断检查
      if (!currentMap[char]) {
        break;
      }

      // 移动到下一个映射
      currentMap = currentMap[char];

      // 如果当前字符是敏感词的结束字符，标记为匹配
      if (currentMap.isEnd) {
        match = true;
        break;
      }
    }

    return match;
  }

  // 过滤敏感词，替换为指定字符
  filter(text, replacement = '***') {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let result = text;
    const length = text.length;

    for (let i = 0; i < length; i++) {
      const matchLength = this.getMatchLength(text, i);
      if (matchLength > 0) {
        result = result.substring(0, i) + replacement + result.substring(i + matchLength);
        i += replacement.length - 1;
      }
    }

    return result;
  }

  // 获取从指定索引开始匹配的敏感词长度
  getMatchLength(text, index) {
    let currentMap = this.sensitiveMap;
    let matchLength = 0;

    for (let i = index; i < text.length; i++) {
      const char = text[i];

      // 如果当前字符不在映射中，中断检查
      if (!currentMap[char]) {
        break;
      }

      // 移动到下一个映射
      currentMap = currentMap[char];
      matchLength++;

      // 如果当前字符是敏感词的结束字符，返回匹配长度
      if (currentMap.isEnd) {
        return matchLength;
      }
    }

    return 0;
  }
}

export default DFASensitiveFilter;
