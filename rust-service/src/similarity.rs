// Levenshtein相似度计算模块
// 优化至O(min(n,m))空间复杂度

/// 计算两个字符串之间的Levenshtein距离
/// 使用优化的算法，空间复杂度为O(min(n,m))
/// 
/// # 参数
/// * `s1` - 第一个字符串
/// * `s2` - 第二个字符串
/// 
/// # 返回
/// Levenshtein距离（编辑距离）
pub fn levenshtein_distance(s1: &str, s2: &str) -> usize {
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

/// 计算两个字符串之间的相似度（0.0-1.0）
/// 
/// # 参数
/// * `text1` - 第一个字符串
/// * `text2` - 第二个字符串
/// 
/// # 返回
/// 相似度值，范围[0.0, 1.0]
/// - 1.0 表示完全相同
/// - 0.0 表示完全不同
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

/// 标准化答案（用于客观题批改）
/// 去除空格、转小写
/// 
/// # 参数
/// * `answer` - 原始答案
/// 
/// # 返回
/// 标准化后的答案
pub fn normalize_answer(answer: &str) -> String {
    answer
        .chars()
        .filter(|c| !c.is_whitespace())
        .map(|c| c.to_lowercase().to_string())
        .collect::<String>()
}

/// 比较两个答案是否相似（用于客观题批改）
/// 
/// # 参数
/// * `student_answer` - 学生答案
/// * `standard_answer` - 标准答案
/// * `threshold` - 相似度阈值（默认0.85）
/// 
/// # 返回
/// 如果相似度超过阈值返回true
pub fn compare_answers(student_answer: &str, standard_answer: &str, threshold: f32) -> bool {
    let normalized_student = normalize_answer(student_answer);
    let normalized_standard = normalize_answer(standard_answer);
    
    // 完全匹配
    if normalized_student == normalized_standard {
        return true;
    }
    
    // 相似度匹配
    let similarity = calculate_similarity(&normalized_student, &normalized_standard);
    similarity >= threshold
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_levenshtein_distance_identical() {
        assert_eq!(levenshtein_distance("hello", "hello"), 0);
        assert_eq!(levenshtein_distance("", ""), 0);
    }

    #[test]
    fn test_levenshtein_distance_empty() {
        assert_eq!(levenshtein_distance("", "hello"), 5);
        assert_eq!(levenshtein_distance("hello", ""), 5);
    }

    #[test]
    fn test_levenshtein_distance_basic() {
        assert_eq!(levenshtein_distance("kitten", "sitting"), 3);
        assert_eq!(levenshtein_distance("saturday", "sunday"), 3);
        assert_eq!(levenshtein_distance("abc", "def"), 3);
    }

    #[test]
    fn test_levenshtein_distance_chinese() {
        assert_eq!(levenshtein_distance("你好", "你好"), 0);
        assert_eq!(levenshtein_distance("你好", "您好"), 1);
        assert_eq!(levenshtein_distance("中国", "美国"), 1);
    }

    #[test]
    fn test_calculate_similarity_identical() {
        assert_eq!(calculate_similarity("hello", "hello"), 1.0);
        assert_eq!(calculate_similarity("", ""), 1.0);
    }

    #[test]
    fn test_calculate_similarity_empty() {
        assert_eq!(calculate_similarity("", "hello"), 0.0);
        assert_eq!(calculate_similarity("hello", ""), 0.0);
    }

    #[test]
    fn test_calculate_similarity_basic() {
        // "kitten" vs "sitting": 距离3，最大长度7，相似度 = 1 - 3/7 ≈ 0.571
        let sim = calculate_similarity("kitten", "sitting");
        assert!((sim - 0.571).abs() < 0.01);
        
        // "abc" vs "abc": 完全相同
        assert_eq!(calculate_similarity("abc", "abc"), 1.0);
        
        // "abc" vs "def": 距离3，最大长度3，相似度 = 0
        assert_eq!(calculate_similarity("abc", "def"), 0.0);
    }

    #[test]
    fn test_normalize_answer() {
        assert_eq!(normalize_answer("Hello World"), "helloworld");
        assert_eq!(normalize_answer("A B C"), "abc");
        assert_eq!(normalize_answer("  spaces  "), "spaces");
        assert_eq!(normalize_answer("你好 世界"), "你好世界");
    }

    #[test]
    fn test_compare_answers_exact_match() {
        assert!(compare_answers("A", "A", 0.85));
        assert!(compare_answers("Hello", "hello", 0.85));
        assert!(compare_answers("A B C", "abc", 0.85));
    }

    #[test]
    fn test_compare_answers_similar() {
        // 相似但不完全相同
        assert!(compare_answers("hello", "helo", 0.85));
        assert!(compare_answers("你好", "您好", 0.85));
    }

    #[test]
    fn test_compare_answers_different() {
        assert!(!compare_answers("A", "B", 0.85));
        assert!(!compare_answers("hello", "world", 0.85));
    }
}

