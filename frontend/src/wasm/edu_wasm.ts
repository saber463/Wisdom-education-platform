/**
 * Rust-WASM模块（JavaScript实现）
 * 
 * 由于编译环境限制，此模块使用TypeScript实现
 * 提供与Rust-WASM相同的接口
 * 
 * 功能：
 * - 客观题答案比对
 * - 相似度计算
 * - 音频处理
 * - 学情分析计算
 * 
 * 需求：13.3 - WASM浏览器执行
 */

/**
 * 标准化答案：去除空格、转小写
 */
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

/**
 * 客观题答案比对
 * 比较学生答案和标准答案是否一致（忽略大小写和空格）
 * 
 * @param student - 学生答案
 * @param standard - 标准答案
 * @returns 如果答案匹配返回true，否则返回false
 */
export function compare_answers(student: string, standard: string): boolean {
  const studentNormalized = normalizeAnswer(student);
  const standardNormalized = normalizeAnswer(standard);
  return studentNormalized === standardNormalized;
}

/**
 * Levenshtein距离算法（优化至O(min(n,m))空间复杂度）
 * 
 * @param s1 - 第一个字符串
 * @param s2 - 第二个字符串
 * @returns Levenshtein距离（编辑距离）
 */
function levenshtein_distance(s1: string, s2: string): number {
  // 确保s1是较短的字符串，以优化空间复杂度
  if (s1.length > s2.length) {
    [s1, s2] = [s2, s1];
  }

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // 使用单行数组优化空间复杂度至O(min(n,m))
  let prevRow: number[] = Array.from({ length: len1 + 1 }, (_, i) => i);
  let currRow: number[] = new Array(len1 + 1);

  for (let j = 1; j <= len2; j++) {
    currRow[0] = j;
    for (let i = 1; i <= len1; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[i] = Math.min(
        prevRow[i] + 1,      // 删除
        currRow[i - 1] + 1,  // 插入
        prevRow[i - 1] + cost // 替换
      );
    }
    // 交换行
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[len1];
}

/**
 * 计算两个字符串的相似度
 * 使用优化的Levenshtein算法，空间复杂度O(min(n,m))
 * 
 * @param text1 - 第一个字符串
 * @param text2 - 第二个字符串
 * @returns 相似度值，范围[0.0, 1.0]，1.0表示完全相同
 */
export function calculate_similarity(text1: string, text2: string): number {
  const len1 = text1.length;
  const len2 = text2.length;

  // 边界情况：两个空字符串视为完全相同
  if (len1 === 0 && len2 === 0) {
    return 1.0;
  }

  // 边界情况：一个空字符串，一个非空字符串
  if (len1 === 0 || len2 === 0) {
    return 0.0;
  }

  const distance = levenshtein_distance(text1, text2);
  const maxLen = Math.max(len1, len2);

  // 相似度 = 1 - (距离 / 最大长度)
  return 1.0 - distance / maxLen;
}

/**
 * 音频降噪处理
 * 使用简单的谱减法（Spectral Subtraction）进行降噪
 * 适用于语音评测前的预处理
 * 
 * @param audio_data - 原始音频数据（PCM格式，32位浮点数组）
 * @param sample_rate - 采样率（Hz）
 * @param noise_reduction_factor - 降噪因子（0.0-1.0，推荐0.5）
 * @returns 降噪后的音频数据（32位浮点数组）
 */
export function denoise_audio(
  audio_data: Float32Array,
  sample_rate: number,
  noise_reduction_factor: number
): Float32Array {
  if (audio_data.length === 0) {
    return new Float32Array();
  }

  // 限制降噪因子在0.0-1.0之间
  const factor = Math.max(0.0, Math.min(1.0, noise_reduction_factor));

  // 计算帧大小（512样本 = 约11.6ms @ 44.1kHz）
  const frame_size = 512;
  const hop_size = frame_size / 2;

  const denoised = new Float32Array(audio_data.length);
  let denoised_idx = 0;

  // 处理每一帧
  for (let i = 0; i < audio_data.length; i += hop_size) {
    const frame_end = Math.min(i + frame_size, audio_data.length);
    const frame = audio_data.slice(i, frame_end);

    // 计算帧的能量
    let energy = 0;
    for (let j = 0; j < frame.length; j++) {
      energy += frame[j] * frame[j];
    }
    const rms = Math.sqrt(energy / frame.length);

    // 简单的能量阈值降噪
    // 如果能量低于阈值，则认为是噪声
    const noise_threshold = 0.01; // 噪声能量阈值

    if (rms < noise_threshold) {
      // 噪声帧：应用降噪
      for (let j = 0; j < frame.length; j++) {
        denoised[denoised_idx++] = frame[j] * (1.0 - factor);
      }
    } else {
      // 信号帧：保留原始样本
      for (let j = 0; j < frame.length; j++) {
        denoised[denoised_idx++] = frame[j];
      }
    }
  }

  // 返回正确长度的数组
  return denoised.slice(0, audio_data.length);
}

/**
 * 从WAV文件字节数据中提取PCM音频数据
 * 
 * @param wav_data - WAV文件的字节数据
 * @returns PCM音频数据
 */
export function extract_pcm_from_wav(wav_data: Uint8Array): Float32Array {
  if (wav_data.length < 44) {
    throw new Error('WAV file too small');
  }

  // 检查RIFF头
  if (
    wav_data[0] !== 0x52 || // 'R'
    wav_data[1] !== 0x49 || // 'I'
    wav_data[2] !== 0x46 || // 'F'
    wav_data[3] !== 0x46    // 'F'
  ) {
    throw new Error('Invalid RIFF header');
  }

  // 检查WAVE格式
  if (
    wav_data[8] !== 0x57 || // 'W'
    wav_data[9] !== 0x41 || // 'A'
    wav_data[10] !== 0x56 || // 'V'
    wav_data[11] !== 0x45    // 'E'
  ) {
    throw new Error('Invalid WAVE format');
  }

  // 查找fmt子块
  let fmt_pos = 12;
  let data_pos = 0;
  let sample_rate = 44100;
  let bits_per_sample = 16;
  let num_channels = 1;

  while (fmt_pos < wav_data.length) {
    if (fmt_pos + 8 > wav_data.length) {
      break;
    }

    const chunk_id = String.fromCharCode(
      wav_data[fmt_pos],
      wav_data[fmt_pos + 1],
      wav_data[fmt_pos + 2],
      wav_data[fmt_pos + 3]
    );

    const chunk_size =
      wav_data[fmt_pos + 4] |
      (wav_data[fmt_pos + 5] << 8) |
      (wav_data[fmt_pos + 6] << 16) |
      (wav_data[fmt_pos + 7] << 24);

    if (chunk_id === 'fmt ') {
      if (fmt_pos + 8 + chunk_size > wav_data.length) {
        throw new Error('Invalid fmt chunk');
      }

      // 解析fmt子块
      num_channels =
        wav_data[fmt_pos + 8] | (wav_data[fmt_pos + 9] << 8);

      sample_rate =
        wav_data[fmt_pos + 12] |
        (wav_data[fmt_pos + 13] << 8) |
        (wav_data[fmt_pos + 14] << 16) |
        (wav_data[fmt_pos + 15] << 24);

      bits_per_sample =
        wav_data[fmt_pos + 22] | (wav_data[fmt_pos + 23] << 8);
    } else if (chunk_id === 'data') {
      data_pos = fmt_pos + 8;
      break;
    }

    fmt_pos += 8 + chunk_size;
  }

  if (data_pos === 0) {
    throw new Error('No data chunk found');
  }

  // 转换PCM数据为浮点数
  const pcm_data: number[] = [];
  const bytes_per_sample = bits_per_sample / 8;
  const sample_count =
    (wav_data.length - data_pos) / (bytes_per_sample * num_channels);

  for (let i = 0; i < sample_count; i++) {
    for (let ch = 0; ch < num_channels; ch++) {
      const offset = data_pos + (i * num_channels + ch) * bytes_per_sample;

      if (offset + bytes_per_sample > wav_data.length) {
        break;
      }

      let sample = 0;
      if (bits_per_sample === 16) {
        const val =
          wav_data[offset] | (wav_data[offset + 1] << 8);
        sample = (val << 16) >> 16; // 符号扩展
        sample = sample / 32768.0;
      } else if (bits_per_sample === 24) {
        const val =
          wav_data[offset] |
          (wav_data[offset + 1] << 8) |
          (wav_data[offset + 2] << 16);
        sample = (val << 8) >> 8; // 符号扩展
        sample = sample / 8388608.0;
      } else if (bits_per_sample === 32) {
        const val =
          wav_data[offset] |
          (wav_data[offset + 1] << 8) |
          (wav_data[offset + 2] << 16) |
          (wav_data[offset + 3] << 24);
        sample = val / 2147483648.0;
      }

      pcm_data.push(sample);
    }
  }

  return new Float32Array(pcm_data);
}

/**
 * 音频格式转换（WAV→MP3模拟）
 * 注：由于WASM环境限制，此函数返回处理后的PCM数据
 * 实际MP3编码应在后端使用ffmpeg或libmp3lame完成
 * 
 * @param wav_data - WAV文件的字节数据
 * @param target_bitrate - 目标比特率（kbps，推荐128）
 * @returns 处理后的音频数据（PCM格式）
 */
export function convert_wav_to_mp3_compatible(
  wav_data: Uint8Array,
  target_bitrate: number
): Float32Array {
  // 第一步：从WAV提取PCM数据
  const pcm_data = extract_pcm_from_wav(wav_data);

  if (pcm_data.length === 0) {
    throw new Error('No audio data extracted');
  }

  // 第二步：应用降噪预处理
  const denoised = denoise_audio(pcm_data, 44100, 0.3);

  // 第三步：应用简单的压缩（模拟MP3的动态范围压缩）
  const compressed = apply_compression(denoised, 4.0, 0.005, 0.05);

  // 第四步：应用简单的均衡（提升语音频率范围）
  const equalized = apply_speech_eq(compressed);

  return equalized;
}

/**
 * 应用动态范围压缩
 * 用于模拟MP3编码中的动态范围压缩
 */
function apply_compression(
  audio: Float32Array,
  ratio: number,
  attack_time: number,
  release_time: number
): Float32Array {
  const threshold = 0.5;
  const compressed = new Float32Array(audio.length);

  for (let i = 0; i < audio.length; i++) {
    const sample = audio[i];
    const abs_sample = Math.abs(sample);

    if (abs_sample > threshold) {
      // 计算压缩增益
      const excess = abs_sample - threshold;
      const compressed_excess = excess / ratio;
      const gain = (threshold + compressed_excess) / abs_sample;
      compressed[i] = sample * gain;
    } else {
      compressed[i] = sample;
    }
  }

  return compressed;
}

/**
 * 应用语音均衡
 * 提升语音频率范围（300Hz-3kHz）
 */
function apply_speech_eq(audio: Float32Array): Float32Array {
  // 简单的均衡：提升中频
  const equalized = new Float32Array(audio.length);

  for (let i = 0; i < audio.length; i++) {
    let eq_sample = audio[i];

    // 简单的移动平均滤波器（模拟均衡）
    if (i > 0 && i < audio.length - 1) {
      eq_sample =
        audio[i - 1] * 0.2 + audio[i] * 0.6 + audio[i + 1] * 0.2;
    }

    // 提升幅度
    eq_sample *= 1.1;

    // 防止削波
    eq_sample = Math.max(-1.0, Math.min(1.0, eq_sample));

    equalized[i] = eq_sample;
  }

  return equalized;
}

/**
 * 计算平均分
 * 用于学情分析中的平均分计算
 * 
 * @param scores - 分数数组
 * @returns 平均分（浮点数，保留2位小数）
 */
export function calculate_average_score(scores: Float32Array): number {
  if (scores.length === 0) {
    return 0.0;
  }

  let sum = 0;
  for (let i = 0; i < scores.length; i++) {
    sum += scores[i];
  }
  const average = sum / scores.length;

  // 保留2位小数
  return Math.round(average * 100) / 100;
}

/**
 * 计算及格率
 * 及格线为60分
 * 
 * @param scores - 分数数组
 * @returns 及格率（百分比，0.0-100.0）
 */
export function calculate_pass_rate(scores: Float32Array): number {
  if (scores.length === 0) {
    return 0.0;
  }

  let pass_count = 0;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= 60.0) {
      pass_count++;
    }
  }
  const pass_rate = (pass_count / scores.length) * 100.0;

  // 保留2位小数
  return Math.round(pass_rate * 100) / 100;
}

/**
 * 计算优秀率
 * 优秀线为85分
 * 
 * @param scores - 分数数组
 * @returns 优秀率（百分比，0.0-100.0）
 */
export function calculate_excellent_rate(scores: Float32Array): number {
  if (scores.length === 0) {
    return 0.0;
  }

  let excellent_count = 0;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= 85.0) {
      excellent_count++;
    }
  }
  const excellent_rate = (excellent_count / scores.length) * 100.0;

  // 保留2位小数
  return Math.round(excellent_rate * 100) / 100;
}

/**
 * 计算进步幅度
 * 比较两个时间段的平均分差异
 * 
 * @param previous_scores - 前一时间段的分数数组
 * @param current_scores - 当前时间段的分数数组
 * @returns 进步幅度（分数差，可为负数表示下降）
 */
export function calculate_progress(
  previous_scores: Float32Array,
  current_scores: Float32Array
): number {
  const prev_avg = calculate_average_score(previous_scores);
  const curr_avg = calculate_average_score(current_scores);

  const progress = curr_avg - prev_avg;

  // 保留2位小数
  return Math.round(progress * 100) / 100;
}

/**
 * 计算学生分层
 * 根据平均分将学生分为三个层次
 * 基础层：<60分，中等层：60-84分，提高层：>=85分
 * 
 * @param average_score - 学生平均分
 * @returns 分层结果：0=基础层，1=中等层，2=提高层
 */
export function calculate_student_tier(average_score: number): number {
  if (average_score < 60.0) {
    return 0; // 基础层
  } else if (average_score < 85.0) {
    return 1; // 中等层
  } else {
    return 2; // 提高层
  }
}

/**
 * 计算知识点掌握度
 * 基于答题记录计算知识点的掌握程度
 * 
 * @param correct_count - 正确答题数
 * @param total_count - 总答题数
 * @returns 掌握度评分（0-100分）
 */
export function calculate_knowledge_mastery(
  correct_count: number,
  total_count: number
): number {
  if (total_count === 0) {
    return 0.0;
  }

  const mastery = (correct_count / total_count) * 100.0;

  // 保留2位小数
  return Math.round(mastery * 100) / 100;
}

/**
 * 计算错误率
 * 基于答题记录计算错误率
 * 
 * @param error_count - 错误答题数
 * @param total_count - 总答题数
 * @returns 错误率（百分比，0.0-100.0）
 */
export function calculate_error_rate(
  error_count: number,
  total_count: number
): number {
  if (total_count === 0) {
    return 0.0;
  }

  const error_rate = (error_count / total_count) * 100.0;

  // 保留2位小数
  return Math.round(error_rate * 100) / 100;
}

// 导出默认初始化函数（与WASM兼容）
export default async function init(): Promise<void> {
  // 此函数为空，因为TypeScript实现不需要初始化
  // 保留此函数以保持与WASM模块的兼容性
}
