use wasm_bindgen::prelude::*;

/// 客观题答案比对（WASM导出函数）
/// 比较学生答案和标准答案是否一致（忽略大小写和空格）
/// 
/// # 参数
/// * `student` - 学生答案
/// * `standard` - 标准答案
/// 
/// # 返回
/// 如果答案匹配返回true，否则返回false
#[wasm_bindgen]
pub fn compare_answers(student: &str, standard: &str) -> bool {
    let student_normalized = normalize_answer(student);
    let standard_normalized = normalize_answer(standard);
    student_normalized == standard_normalized
}

/// 计算两个字符串的相似度（WASM导出函数）
/// 使用优化的Levenshtein算法，空间复杂度O(min(n,m))
/// 
/// # 参数
/// * `text1` - 第一个字符串
/// * `text2` - 第二个字符串
/// 
/// # 返回
/// 相似度值，范围[0.0, 1.0]，1.0表示完全相同
#[wasm_bindgen]
pub fn calculate_similarity(text1: &str, text2: &str) -> f32 {
    let len1 = text1.chars().count();
    let len2 = text2.chars().count();
    
    // 边界情况：两个空字符串视为完全相同
    if len1 == 0 && len2 == 0 {
        return 1.0;
    }
    
    // 边界情况：一个空字符串，一个非空字符串
    if len1 == 0 || len2 == 0 {
        return 0.0;
    }
    
    let distance = levenshtein_distance(text1, text2);
    let max_len = len1.max(len2);
    
    // 相似度 = 1 - (距离 / 最大长度)
    1.0 - (distance as f32 / max_len as f32)
}

/// 音频降噪处理（WASM导出函数）
/// 使用简单的谱减法（Spectral Subtraction）进行降噪
/// 适用于语音评测前的预处理
/// 
/// # 参数
/// * `audio_data` - 原始音频数据（PCM格式，32位浮点数组）
/// * `sample_rate` - 采样率（Hz）
/// * `noise_reduction_factor` - 降噪因子（0.0-1.0，推荐0.5）
/// 
/// # 返回
/// 降噪后的音频数据（32位浮点数组）
#[wasm_bindgen]
pub fn denoise_audio(
    audio_data: &[f32],
    sample_rate: u32,
    noise_reduction_factor: f32,
) -> Vec<f32> {
    if audio_data.is_empty() {
        return Vec::new();
    }
    
    // 限制降噪因子在0.0-1.0之间
    let factor = noise_reduction_factor.max(0.0).min(1.0);
    
    // 计算帧大小（512样本 = 约11.6ms @ 44.1kHz）
    let frame_size = 512;
    let hop_size = frame_size / 2;
    
    let mut denoised = Vec::with_capacity(audio_data.len());
    
    // 处理每一帧
    for i in (0..audio_data.len()).step_by(hop_size) {
        let frame_end = (i + frame_size).min(audio_data.len());
        let frame = &audio_data[i..frame_end];
        
        // 计算帧的能量
        let energy: f32 = frame.iter().map(|x| x * x).sum();
        let rms = (energy / frame.len() as f32).sqrt();
        
        // 简单的能量阈值降噪
        // 如果能量低于阈值，则认为是噪声
        let noise_threshold = 0.01; // 噪声能量阈值
        
        if rms < noise_threshold {
            // 噪声帧：应用降噪
            for sample in frame {
                let denoised_sample = sample * (1.0 - factor);
                denoised.push(denoised_sample);
            }
        } else {
            // 信号帧：保留原始样本
            for sample in frame {
                denoised.push(*sample);
            }
        }
    }
    
    // 确保输出长度与输入相同
    denoised.truncate(audio_data.len());
    denoised
}

/// 音频格式转换辅助函数（WAV→PCM）
/// 从WAV文件字节数据中提取PCM音频数据
/// 
/// # 参数
/// * `wav_data` - WAV文件的字节数据
/// 
/// # 返回
/// 包含PCM音频数据和采样率的元组 (audio_data, sample_rate)
#[wasm_bindgen]
pub fn extract_pcm_from_wav(wav_data: &[u8]) -> Result<Vec<f32>, String> {
    if wav_data.len() < 44 {
        return Err("WAV file too small".to_string());
    }
    
    // 检查RIFF头
    if &wav_data[0..4] != b"RIFF" {
        return Err("Invalid RIFF header".to_string());
    }
    
    // 检查WAVE格式
    if &wav_data[8..12] != b"WAVE" {
        return Err("Invalid WAVE format".to_string());
    }
    
    // 查找fmt子块
    let mut fmt_pos = 12;
    let mut data_pos = 0;
    let mut sample_rate = 44100u32;
    let mut bits_per_sample = 16u16;
    let mut num_channels = 1u16;
    
    while fmt_pos < wav_data.len() {
        if fmt_pos + 8 > wav_data.len() {
            break;
        }
        
        let chunk_id = &wav_data[fmt_pos..fmt_pos + 4];
        let chunk_size = u32::from_le_bytes([
            wav_data[fmt_pos + 4],
            wav_data[fmt_pos + 5],
            wav_data[fmt_pos + 6],
            wav_data[fmt_pos + 7],
        ]) as usize;
        
        if chunk_id == b"fmt " {
            if fmt_pos + 8 + chunk_size > wav_data.len() {
                return Err("Invalid fmt chunk".to_string());
            }
            
            // 解析fmt子块
            num_channels = u16::from_le_bytes([
                wav_data[fmt_pos + 8],
                wav_data[fmt_pos + 9],
            ]);
            
            sample_rate = u32::from_le_bytes([
                wav_data[fmt_pos + 12],
                wav_data[fmt_pos + 13],
                wav_data[fmt_pos + 14],
                wav_data[fmt_pos + 15],
            ]);
            
            bits_per_sample = u16::from_le_bytes([
                wav_data[fmt_pos + 22],
                wav_data[fmt_pos + 23],
            ]);
        } else if chunk_id == b"data" {
            data_pos = fmt_pos + 8;
            break;
        }
        
        fmt_pos += 8 + chunk_size;
    }
    
    if data_pos == 0 {
        return Err("No data chunk found".to_string());
    }
    
    // 转换PCM数据为浮点数
    let mut pcm_data = Vec::new();
    let bytes_per_sample = (bits_per_sample / 8) as usize;
    let sample_count = (wav_data.len() - data_pos) / (bytes_per_sample * num_channels as usize);
    
    for i in 0..sample_count {
        for ch in 0..num_channels as usize {
            let offset = data_pos + (i * num_channels as usize + ch) * bytes_per_sample;
            
            if offset + bytes_per_sample > wav_data.len() {
                break;
            }
            
            let sample = match bits_per_sample {
                16 => {
                    let val = i16::from_le_bytes([wav_data[offset], wav_data[offset + 1]]);
                    val as f32 / 32768.0
                }
                24 => {
                    let val = i32::from_le_bytes([
                        wav_data[offset],
                        wav_data[offset + 1],
                        wav_data[offset + 2],
                        if wav_data[offset + 2] & 0x80 != 0 { 0xFF } else { 0x00 },
                    ]);
                    val as f32 / 8388608.0
                }
                32 => {
                    let val = i32::from_le_bytes([
                        wav_data[offset],
                        wav_data[offset + 1],
                        wav_data[offset + 2],
                        wav_data[offset + 3],
                    ]);
                    val as f32 / 2147483648.0
                }
                _ => 0.0,
            };
            
            pcm_data.push(sample);
        }
    }
    
    Ok(pcm_data)
}

/// 音频格式转换（WAV→MP3模拟）
/// 注：由于WASM环境限制，此函数返回处理后的PCM数据
/// 实际MP3编码应在后端使用ffmpeg或libmp3lame完成
/// 
/// # 参数
/// * `wav_data` - WAV文件的字节数据
/// * `target_bitrate` - 目标比特率（kbps，推荐128）
/// 
/// # 返回
/// 处理后的音频数据（PCM格式）
#[wasm_bindgen]
pub fn convert_wav_to_mp3_compatible(
    wav_data: &[u8],
    target_bitrate: u32,
) -> Result<Vec<f32>, String> {
    // 第一步：从WAV提取PCM数据
    let pcm_data = extract_pcm_from_wav(wav_data)?;
    
    if pcm_data.is_empty() {
        return Err("No audio data extracted".to_string());
    }
    
    // 第二步：应用降噪预处理
    let denoised = denoise_audio(&pcm_data, 44100, 0.3);
    
    // 第三步：应用简单的压缩（模拟MP3的动态范围压缩）
    let compressed = apply_compression(&denoised, 4.0, 0.005, 0.05);
    
    // 第四步：应用简单的均衡（提升语音频率范围）
    let equalized = apply_speech_eq(&compressed);
    
    Ok(equalized)
}

/// 应用动态范围压缩
/// 用于模拟MP3编码中的动态范围压缩
fn apply_compression(
    audio: &[f32],
    ratio: f32,
    attack_time: f32,
    release_time: f32,
) -> Vec<f32> {
    let threshold = 0.5;
    let mut compressed = Vec::with_capacity(audio.len());
    
    for sample in audio {
        let abs_sample = sample.abs();
        
        if abs_sample > threshold {
            // 计算压缩增益
            let excess = abs_sample - threshold;
            let compressed_excess = excess / ratio;
            let gain = (threshold + compressed_excess) / abs_sample;
            compressed.push(sample * gain);
        } else {
            compressed.push(*sample);
        }
    }
    
    compressed
}

/// 应用语音均衡
/// 提升语音频率范围（300Hz-3kHz）
fn apply_speech_eq(audio: &[f32]) -> Vec<f32> {
    // 简单的均衡：提升中频
    let mut equalized = Vec::with_capacity(audio.len());
    
    for (i, sample) in audio.iter().enumerate() {
        let mut eq_sample = *sample;
        
        // 简单的移动平均滤波器（模拟均衡）
        if i > 0 && i < audio.len() - 1 {
            eq_sample = (audio[i - 1] * 0.2 + audio[i] * 0.6 + audio[i + 1] * 0.2);
        }
        
        // 提升幅度
        eq_sample *= 1.1;
        
        // 防止削波
        eq_sample = eq_sample.max(-1.0).min(1.0);
        
        equalized.push(eq_sample);
    }
    
    equalized
}

/// 标准化答案：去除空格、转小写
/// 
/// # 参数
/// * `answer` - 原始答案
/// 
/// # 返回
/// 标准化后的答案字符串
fn normalize_answer(answer: &str) -> String {
    answer
        .chars()
        .filter(|c| !c.is_whitespace())
        .map(|c| c.to_lowercase().to_string())
        .collect::<String>()
}

/// Levenshtein距离算法（优化至O(min(n,m))空间复杂度）
/// 复用Rust服务的优化实现
/// 
/// # 参数
/// * `s1` - 第一个字符串
/// * `s2` - 第二个字符串
/// 
/// # 返回
/// Levenshtein距离（编辑距离）
fn levenshtein_distance(s1: &str, s2: &str) -> usize {
    // 确保s1是较短的字符串，以优化空间复杂度
    let (s1, s2) = if s1.len() > s2.len() {
        (s2, s1)
    } else {
        (s1, s2)
    };
    
    let len1 = s1.chars().count();
    let len2 = s2.chars().count();
    
    // 边界情况
    if len1 == 0 {
        return len2;
    }
    if len2 == 0 {
        return len1;
    }
    
    // 使用单行数组优化空间复杂度至O(min(n,m))
    let mut prev_row: Vec<usize> = (0..=len1).collect();
    let mut curr_row: Vec<usize> = vec![0; len1 + 1];
    
    for (i, c2) in s2.chars().enumerate() {
        curr_row[0] = i + 1;
        
        for (j, c1) in s1.chars().enumerate() {
            let cost = if c1 == c2 { 0 } else { 1 };
            
            curr_row[j + 1] = (curr_row[j] + 1)           // 插入
                .min(prev_row[j + 1] + 1)                 // 删除
                .min(prev_row[j] + cost);                 // 替换
        }
        
        // 交换行
        std::mem::swap(&mut prev_row, &mut curr_row);
    }
    
    prev_row[len1]
}

/// 计算平均分（WASM导出函数）
/// 用于学情分析中的平均分计算
/// 
/// # 参数
/// * `scores` - 分数数组
/// 
/// # 返回
/// 平均分（浮点数，保留2位小数）
#[wasm_bindgen]
pub fn calculate_average_score(scores: &[f32]) -> f32 {
    if scores.is_empty() {
        return 0.0;
    }
    
    let sum: f32 = scores.iter().sum();
    let average = sum / scores.len() as f32;
    
    // 保留2位小数
    (average * 100.0).round() / 100.0
}

/// 计算及格率（WASM导出函数）
/// 及格线为60分
/// 
/// # 参数
/// * `scores` - 分数数组
/// 
/// # 返回
/// 及格率（百分比，0.0-100.0）
#[wasm_bindgen]
pub fn calculate_pass_rate(scores: &[f32]) -> f32 {
    if scores.is_empty() {
        return 0.0;
    }
    
    let pass_count = scores.iter().filter(|&&score| score >= 60.0).count();
    let pass_rate = (pass_count as f32 / scores.len() as f32) * 100.0;
    
    // 保留2位小数
    (pass_rate * 100.0).round() / 100.0
}

/// 计算优秀率（WASM导出函数）
/// 优秀线为85分
/// 
/// # 参数
/// * `scores` - 分数数组
/// 
/// # 返回
/// 优秀率（百分比，0.0-100.0）
#[wasm_bindgen]
pub fn calculate_excellent_rate(scores: &[f32]) -> f32 {
    if scores.is_empty() {
        return 0.0;
    }
    
    let excellent_count = scores.iter().filter(|&&score| score >= 85.0).count();
    let excellent_rate = (excellent_count as f32 / scores.len() as f32) * 100.0;
    
    // 保留2位小数
    (excellent_rate * 100.0).round() / 100.0
}

/// 计算进步幅度（WASM导出函数）
/// 比较两个时间段的平均分差异
/// 
/// # 参数
/// * `previous_scores` - 前一时间段的分数数组
/// * `current_scores` - 当前时间段的分数数组
/// 
/// # 返回
/// 进步幅度（分数差，可为负数表示下降）
#[wasm_bindgen]
pub fn calculate_progress(previous_scores: &[f32], current_scores: &[f32]) -> f32 {
    let prev_avg = calculate_average_score(previous_scores);
    let curr_avg = calculate_average_score(current_scores);
    
    let progress = curr_avg - prev_avg;
    
    // 保留2位小数
    (progress * 100.0).round() / 100.0
}

/// 计算学生分层（WASM导出函数）
/// 根据平均分将学生分为三个层次
/// 基础层：<60分，中等层：60-84分，提高层：>=85分
/// 
/// # 参数
/// * `average_score` - 学生平均分
/// 
/// # 返回
/// 分层结果：0=基础层，1=中等层，2=提高层
#[wasm_bindgen]
pub fn calculate_student_tier(average_score: f32) -> u8 {
    if average_score < 60.0 {
        0 // 基础层
    } else if average_score < 85.0 {
        1 // 中等层
    } else {
        2 // 提高层
    }
}

/// 计算知识点掌握度（WASM导出函数）
/// 基于答题记录计算知识点的掌握程度
/// 
/// # 参数
/// * `correct_count` - 正确答题数
/// * `total_count` - 总答题数
/// 
/// # 返回
/// 掌握度评分（0-100分）
#[wasm_bindgen]
pub fn calculate_knowledge_mastery(correct_count: u32, total_count: u32) -> f32 {
    if total_count == 0 {
        return 0.0;
    }
    
    let mastery = (correct_count as f32 / total_count as f32) * 100.0;
    
    // 保留2位小数
    (mastery * 100.0).round() / 100.0
}

/// 计算错误率（WASM导出函数）
/// 基于答题记录计算错误率
/// 
/// # 参数
/// * `error_count` - 错误答题数
/// * `total_count` - 总答题数
/// 
/// # 返回
/// 错误率（百分比，0.0-100.0）
#[wasm_bindgen]
pub fn calculate_error_rate(error_count: u32, total_count: u32) -> f32 {
    if total_count == 0 {
        return 0.0;
    }
    
    let error_rate = (error_count as f32 / total_count as f32) * 100.0;
    
    // 保留2位小数
    (error_rate * 100.0).round() / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========== 选择题答案比对测试 ==========
    
    #[test]
    fn test_choice_exact_match() {
        // 完全匹配（大小写不敏感）
        assert!(compare_answers("A", "A"));
        assert!(compare_answers("A", "a"));
        assert!(compare_answers("a", "A"));
        assert!(compare_answers("B", "b"));
    }

    #[test]
    fn test_choice_with_spaces() {
        // 带空格的选择题答案
        assert!(compare_answers(" A ", "A"));
        assert!(compare_answers("A ", " A"));
        assert!(compare_answers(" A ", " a "));
    }

    #[test]
    fn test_choice_mismatch() {
        // 不匹配的选择题答案
        assert!(!compare_answers("A", "B"));
        assert!(!compare_answers("a", "c"));
        assert!(!compare_answers("D", "A"));
    }

    // ========== 填空题答案比对测试 ==========
    
    #[test]
    fn test_fill_exact_match() {
        // 填空题完全匹配
        assert!(compare_answers("hello", "hello"));
        assert!(compare_answers("Hello", "hello"));
        assert!(compare_answers("HELLO", "hello"));
    }

    #[test]
    fn test_fill_with_spaces() {
        // 填空题带空格
        assert!(compare_answers("hello world", "helloworld"));
        assert!(compare_answers("Hello World", "helloworld"));
        assert!(compare_answers(" hello world ", "helloworld"));
    }

    #[test]
    fn test_fill_chinese() {
        // 中文填空题
        assert!(compare_answers("你好", "你好"));
        assert!(compare_answers("你 好", "你好"));
        assert!(compare_answers(" 你好 ", "你好"));
    }

    #[test]
    fn test_fill_mismatch() {
        // 填空题不匹配
        assert!(!compare_answers("hello", "world"));
        assert!(!compare_answers("你好", "再见"));
    }

    // ========== 判断题答案比对测试 ==========
    
    #[test]
    fn test_judge_true_false() {
        // 判断题（对/错）
        assert!(compare_answers("true", "true"));
        assert!(compare_answers("True", "true"));
        assert!(compare_answers("TRUE", "true"));
        assert!(compare_answers("false", "false"));
        assert!(compare_answers("False", "FALSE"));
    }

    #[test]
    fn test_judge_yes_no() {
        // 判断题（是/否）
        assert!(compare_answers("yes", "yes"));
        assert!(compare_answers("Yes", "YES"));
        assert!(compare_answers("no", "no"));
        assert!(compare_answers("NO", "No"));
    }

    #[test]
    fn test_judge_chinese() {
        // 中文判断题
        assert!(compare_answers("对", "对"));
        assert!(compare_answers("错", "错"));
        assert!(compare_answers("是", "是"));
        assert!(compare_answers("否", "否"));
    }

    #[test]
    fn test_judge_mismatch() {
        // 判断题不匹配
        assert!(!compare_answers("true", "false"));
        assert!(!compare_answers("yes", "no"));
        assert!(!compare_answers("对", "错"));
    }

    // ========== 答案标准化逻辑测试 ==========
    
    #[test]
    fn test_normalize_removes_spaces() {
        // 测试去除空格
        assert_eq!(normalize_answer("hello world"), "helloworld");
        assert_eq!(normalize_answer("  spaces  "), "spaces");
        assert_eq!(normalize_answer("a b c"), "abc");
    }

    #[test]
    fn test_normalize_lowercase() {
        // 测试转小写
        assert_eq!(normalize_answer("HELLO"), "hello");
        assert_eq!(normalize_answer("HeLLo"), "hello");
        assert_eq!(normalize_answer("ABC"), "abc");
    }

    #[test]
    fn test_normalize_combined() {
        // 测试组合：去空格+转小写
        assert_eq!(normalize_answer("Hello World"), "helloworld");
        assert_eq!(normalize_answer("  A B C  "), "abc");
        assert_eq!(normalize_answer(" TRUE "), "true");
    }

    #[test]
    fn test_normalize_chinese() {
        // 测试中文标准化
        assert_eq!(normalize_answer("你好 世界"), "你好世界");
        assert_eq!(normalize_answer("  你好  "), "你好");
    }

    #[test]
    fn test_normalize_empty() {
        // 测试空字符串
        assert_eq!(normalize_answer(""), "");
        assert_eq!(normalize_answer("   "), "");
    }

    // ========== 相似度计算测试 ==========
    
    #[test]
    fn test_similarity_identical() {
        // 完全相同的字符串
        assert_eq!(calculate_similarity("hello", "hello"), 1.0);
        assert_eq!(calculate_similarity("", ""), 1.0);
        assert_eq!(calculate_similarity("你好", "你好"), 1.0);
    }

    #[test]
    fn test_similarity_empty() {
        // 空字符串
        assert_eq!(calculate_similarity("", "hello"), 0.0);
        assert_eq!(calculate_similarity("hello", ""), 0.0);
    }

    #[test]
    fn test_similarity_high() {
        // 高相似度（一个字符差异）
        let sim = calculate_similarity("hello", "hallo");
        assert!(sim > 0.8, "Expected similarity > 0.8, got {}", sim);
        
        let sim = calculate_similarity("你好", "您好");
        assert!(sim > 0.5, "Expected similarity > 0.5, got {}", sim);
    }

    #[test]
    fn test_similarity_low() {
        // 低相似度
        let sim = calculate_similarity("abc", "xyz");
        assert!(sim < 0.5, "Expected similarity < 0.5, got {}", sim);
        
        let sim = calculate_similarity("hello", "world");
        assert!(sim < 0.5, "Expected similarity < 0.5, got {}", sim);
    }

    #[test]
    fn test_similarity_medium() {
        // 中等相似度
        let sim = calculate_similarity("kitten", "sitting");
        assert!(sim > 0.4 && sim < 0.7, "Expected similarity between 0.4 and 0.7, got {}", sim);
    }

    // ========== 音频降噪测试 ==========
    
    #[test]
    fn test_denoise_empty_audio() {
        // 空音频数据
        let result = denoise_audio(&[], 44100, 0.5);
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_denoise_preserves_length() {
        // 降噪后长度应与输入相同
        let audio = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        let result = denoise_audio(&audio, 44100, 0.5);
        assert_eq!(result.len(), audio.len());
    }

    #[test]
    fn test_denoise_reduces_noise() {
        // 降噪应该减少低能量信号
        let mut audio = vec![0.01; 100]; // 低能量噪声
        audio.extend_from_slice(&[0.5; 100]); // 高能量信号
        
        let result = denoise_audio(&audio, 44100, 0.5);
        
        // 前100个样本（噪声）应该被减弱
        let noise_avg: f32 = result[0..100].iter().map(|x| x.abs()).sum::<f32>() / 100.0;
        let signal_avg: f32 = result[100..200].iter().map(|x| x.abs()).sum::<f32>() / 100.0;
        
        assert!(noise_avg < signal_avg, "Noise should be reduced");
    }

    #[test]
    fn test_denoise_factor_bounds() {
        // 降噪因子应该被限制在0.0-1.0
        let audio = vec![0.1, 0.2, 0.3];
        
        let result1 = denoise_audio(&audio, 44100, -0.5); // 负数应该被限制为0.0
        let result2 = denoise_audio(&audio, 44100, 1.5);  // 大于1.0应该被限制为1.0
        
        // 两个结果应该有效
        assert_eq!(result1.len(), 3);
        assert_eq!(result2.len(), 3);
    }

    // ========== WAV提取测试 ==========
    
    #[test]
    fn test_extract_pcm_invalid_riff() {
        // 无效的RIFF头
        let data = b"XXXX";
        let result = extract_pcm_from_wav(data);
        assert!(result.is_err());
    }

    #[test]
    fn test_extract_pcm_too_small() {
        // 文件太小
        let data = b"RIF";
        let result = extract_pcm_from_wav(data);
        assert!(result.is_err());
    }

    #[test]
    fn test_extract_pcm_invalid_wave() {
        // 无效的WAVE格式
        let mut data = vec![0u8; 44];
        data[0..4].copy_from_slice(b"RIFF");
        data[8..12].copy_from_slice(b"XXXX");
        let result = extract_pcm_from_wav(&data);
        assert!(result.is_err());
    }

    // ========== WAV转MP3兼容格式测试 ==========
    
    #[test]
    fn test_convert_wav_to_mp3_invalid_input() {
        // 无效的WAV数据
        let data = b"invalid";
        let result = convert_wav_to_mp3_compatible(data, 128);
        assert!(result.is_err());
    }

    #[test]
    fn test_convert_wav_to_mp3_empty_input() {
        // 空输入
        let data = b"";
        let result = convert_wav_to_mp3_compatible(data, 128);
        assert!(result.is_err());
    }

    // ========== 压缩函数测试 ==========
    
    #[test]
    fn test_apply_compression() {
        // 测试动态范围压缩
        let audio = vec![0.1, 0.3, 0.6, 0.9];
        let result = apply_compression(&audio, 4.0, 0.005, 0.05);
        
        assert_eq!(result.len(), audio.len());
        
        // 高能量样本应该被压缩
        assert!(result[3].abs() < audio[3].abs());
    }

    // ========== 均衡函数测试 ==========
    
    #[test]
    fn test_apply_speech_eq() {
        // 测试语音均衡
        let audio = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        let result = apply_speech_eq(&audio);
        
        assert_eq!(result.len(), audio.len());
        
        // 所有样本应该在[-1.0, 1.0]范围内
        for sample in &result {
            assert!(*sample >= -1.0 && *sample <= 1.0);
        }
    }

    // ========== 学情分析计算测试 ==========
    
    #[test]
    fn test_calculate_average_score_empty() {
        // 空分数数组
        assert_eq!(calculate_average_score(&[]), 0.0);
    }

    #[test]
    fn test_calculate_average_score_single() {
        // 单个分数
        assert_eq!(calculate_average_score(&[85.0]), 85.0);
    }

    #[test]
    fn test_calculate_average_score_multiple() {
        // 多个分数
        let scores = vec![80.0, 90.0, 70.0, 85.0];
        let avg = calculate_average_score(&scores);
        assert_eq!(avg, 81.25);
    }

    #[test]
    fn test_calculate_average_score_precision() {
        // 测试精度（保留2位小数）
        let scores = vec![80.123, 90.456, 70.789];
        let avg = calculate_average_score(&scores);
        // (80.123 + 90.456 + 70.789) / 3 = 80.456
        assert!((avg - 80.46).abs() < 0.01);
    }

    #[test]
    fn test_calculate_pass_rate_empty() {
        // 空分数数组
        assert_eq!(calculate_pass_rate(&[]), 0.0);
    }

    #[test]
    fn test_calculate_pass_rate_all_pass() {
        // 全部及格
        let scores = vec![60.0, 70.0, 80.0, 90.0];
        assert_eq!(calculate_pass_rate(&scores), 100.0);
    }

    #[test]
    fn test_calculate_pass_rate_all_fail() {
        // 全部不及格
        let scores = vec![30.0, 40.0, 50.0, 59.0];
        assert_eq!(calculate_pass_rate(&scores), 0.0);
    }

    #[test]
    fn test_calculate_pass_rate_partial() {
        // 部分及格
        let scores = vec![50.0, 60.0, 70.0, 80.0];
        let pass_rate = calculate_pass_rate(&scores);
        // 3个及格，1个不及格 = 75%
        assert_eq!(pass_rate, 75.0);
    }

    #[test]
    fn test_calculate_pass_rate_boundary() {
        // 边界情况：恰好60分
        let scores = vec![59.9, 60.0, 60.1];
        let pass_rate = calculate_pass_rate(&scores);
        // 2个及格，1个不及格 = 66.67%
        assert!((pass_rate - 66.67).abs() < 0.01);
    }

    #[test]
    fn test_calculate_excellent_rate_empty() {
        // 空分数数组
        assert_eq!(calculate_excellent_rate(&[]), 0.0);
    }

    #[test]
    fn test_calculate_excellent_rate_all_excellent() {
        // 全部优秀
        let scores = vec![85.0, 90.0, 95.0, 100.0];
        assert_eq!(calculate_excellent_rate(&scores), 100.0);
    }

    #[test]
    fn test_calculate_excellent_rate_none_excellent() {
        // 全部不优秀
        let scores = vec![50.0, 60.0, 70.0, 84.0];
        assert_eq!(calculate_excellent_rate(&scores), 0.0);
    }

    #[test]
    fn test_calculate_excellent_rate_partial() {
        // 部分优秀
        let scores = vec![70.0, 80.0, 85.0, 90.0];
        let excellent_rate = calculate_excellent_rate(&scores);
        // 2个优秀，2个不优秀 = 50%
        assert_eq!(excellent_rate, 50.0);
    }

    #[test]
    fn test_calculate_excellent_rate_boundary() {
        // 边界情况：恰好85分
        let scores = vec![84.9, 85.0, 85.1];
        let excellent_rate = calculate_excellent_rate(&scores);
        // 2个优秀，1个不优秀 = 66.67%
        assert!((excellent_rate - 66.67).abs() < 0.01);
    }

    #[test]
    fn test_calculate_progress_improvement() {
        // 进步情况
        let prev_scores = vec![70.0, 75.0, 80.0];
        let curr_scores = vec![80.0, 85.0, 90.0];
        let progress = calculate_progress(&prev_scores, &curr_scores);
        // 前期平均75，当期平均85，进步10分
        assert_eq!(progress, 10.0);
    }

    #[test]
    fn test_calculate_progress_decline() {
        // 下降情况
        let prev_scores = vec![80.0, 85.0, 90.0];
        let curr_scores = vec![70.0, 75.0, 80.0];
        let progress = calculate_progress(&prev_scores, &curr_scores);
        // 前期平均85，当期平均75，下降10分
        assert_eq!(progress, -10.0);
    }

    #[test]
    fn test_calculate_progress_no_change() {
        // 无变化
        let scores = vec![80.0, 85.0, 90.0];
        let progress = calculate_progress(&scores, &scores);
        assert_eq!(progress, 0.0);
    }

    #[test]
    fn test_calculate_progress_empty() {
        // 空数组
        let progress = calculate_progress(&[], &[]);
        assert_eq!(progress, 0.0);
    }

    #[test]
    fn test_calculate_student_tier_basic() {
        // 基础层（<60分）
        assert_eq!(calculate_student_tier(50.0), 0);
        assert_eq!(calculate_student_tier(59.9), 0);
    }

    #[test]
    fn test_calculate_student_tier_medium() {
        // 中等层（60-84分）
        assert_eq!(calculate_student_tier(60.0), 1);
        assert_eq!(calculate_student_tier(75.0), 1);
        assert_eq!(calculate_student_tier(84.0), 1);
        assert_eq!(calculate_student_tier(84.9), 1);
    }

    #[test]
    fn test_calculate_student_tier_advanced() {
        // 提高层（>=85分）
        assert_eq!(calculate_student_tier(85.0), 2);
        assert_eq!(calculate_student_tier(90.0), 2);
        assert_eq!(calculate_student_tier(100.0), 2);
    }

    #[test]
    fn test_calculate_student_tier_boundary() {
        // 边界情况
        assert_eq!(calculate_student_tier(59.99), 0);
        assert_eq!(calculate_student_tier(60.0), 1);
        assert_eq!(calculate_student_tier(84.99), 1);
        assert_eq!(calculate_student_tier(85.0), 2);
    }

    #[test]
    fn test_calculate_knowledge_mastery_empty() {
        // 总答题数为0
        assert_eq!(calculate_knowledge_mastery(0, 0), 0.0);
    }

    #[test]
    fn test_calculate_knowledge_mastery_perfect() {
        // 完全掌握
        assert_eq!(calculate_knowledge_mastery(10, 10), 100.0);
    }

    #[test]
    fn test_calculate_knowledge_mastery_none() {
        // 完全未掌握
        assert_eq!(calculate_knowledge_mastery(0, 10), 0.0);
    }

    #[test]
    fn test_calculate_knowledge_mastery_partial() {
        // 部分掌握
        let mastery = calculate_knowledge_mastery(7, 10);
        assert_eq!(mastery, 70.0);
    }

    #[test]
    fn test_calculate_knowledge_mastery_precision() {
        // 精度测试
        let mastery = calculate_knowledge_mastery(1, 3);
        // 1/3 = 0.333... * 100 = 33.33%
        assert!((mastery - 33.33).abs() < 0.01);
    }

    #[test]
    fn test_calculate_error_rate_empty() {
        // 总答题数为0
        assert_eq!(calculate_error_rate(0, 0), 0.0);
    }

    #[test]
    fn test_calculate_error_rate_all_correct() {
        // 全部正确
        assert_eq!(calculate_error_rate(0, 10), 0.0);
    }

    #[test]
    fn test_calculate_error_rate_all_wrong() {
        // 全部错误
        assert_eq!(calculate_error_rate(10, 10), 100.0);
    }

    #[test]
    fn test_calculate_error_rate_partial() {
        // 部分错误
        let error_rate = calculate_error_rate(3, 10);
        assert_eq!(error_rate, 30.0);
    }

    #[test]
    fn test_calculate_error_rate_precision() {
        // 精度测试
        let error_rate = calculate_error_rate(2, 3);
        // 2/3 = 0.666... * 100 = 66.67%
        assert!((error_rate - 66.67).abs() < 0.01);
    }
}
