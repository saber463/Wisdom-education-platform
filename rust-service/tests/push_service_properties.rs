// Feature: smart-education-platform, Property 90: 学习状态分析准确性
// 验证需求：21.4

use edu_rust_service::push_service::{
    analyze_student_status, calculate_learning_score, determine_status_level,
    generate_push_content, StudentStatus,
};
use proptest::prelude::*;

/// 属性90：学习状态分析准确性
/// 对于任何学生学习数据，系统应准确计算学习评分和状态等级
#[cfg(test)]
mod push_service_property_tests {
    use super::*;

    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]

        /// 属性90.1：学习评分计算准确性
        /// 对于任何完成任务数和总任务数，学习评分应等于 (完成数 / 总数) * 100
        #[test]
        fn prop_learning_score_calculation(
            completed in 0i32..=100,
            total in 1i32..=100
        ) {
            let score = calculate_learning_score(completed, total);
            
            // 验证评分范围在0-100之间
            prop_assert!(score >= 0.0 && score <= 100.0, 
                "学习评分应在0-100之间，实际: {}", score);
            
            // 验证评分计算准确性
            let expected = (completed as f32 / total as f32) * 100.0;
            prop_assert!((score - expected).abs() < 0.01,
                "学习评分计算不准确，期望: {}, 实际: {}", expected, score);
            
            // 验证边界情况
            if completed == 0 {
                prop_assert_eq!(score, 0.0, "完成数为0时，评分应为0");
            }
            if completed == total {
                prop_assert_eq!(score, 100.0, "完成数等于总数时，评分应为100");
            }
        }

        /// 属性90.2：状态等级划分准确性
        /// 对于任何学习评分，状态等级应正确划分
        #[test]
        fn prop_status_level_classification(score in 0.0f32..=100.0) {
            let level = determine_status_level(score);
            
            // 验证状态等级值有效
            prop_assert!(
                level == "excellent" || level == "good" || level == "fair" || level == "poor",
                "状态等级应为 excellent/good/fair/poor 之一，实际: {}", level
            );
            
            // 验证等级划分规则
            if score >= 90.0 {
                prop_assert_eq!(level, "excellent", "评分 >= 90 应为 excellent");
            } else if score >= 70.0 {
                prop_assert_eq!(level, "good", "评分 >= 70 && < 90 应为 good");
            } else if score >= 50.0 {
                prop_assert_eq!(level, "fair", "评分 >= 50 && < 70 应为 fair");
            } else {
                prop_assert_eq!(level, "poor", "评分 < 50 应为 poor");
            }
        }

        /// 属性90.3：学生状态分析完整性
        /// 对于任何学生学习数据，分析结果应包含评分和状态等级
        #[test]
        fn prop_student_status_analysis_completeness(
            student_id in 1i32..=10000,
            check_in_count in 0i32..=30,
            completed_tasks in 0i32..=100,
            total_tasks in 1i32..=100
        ) {
            let (score, level) = analyze_student_status(
                student_id,
                check_in_count,
                completed_tasks,
                total_tasks,
            );
            
            // 验证评分有效
            prop_assert!(score >= 0.0 && score <= 100.0,
                "学习评分应在0-100之间，实际: {}", score);
            
            // 验证状态等级有效
            prop_assert!(
                level == "excellent" || level == "good" || level == "fair" || level == "poor",
                "状态等级应有效，实际: {}", level
            );
            
            // 验证评分与等级一致（clone 避免 move 后用于 format）
            let expected_level = determine_status_level(score);
            prop_assert_eq!(level.clone(), expected_level.clone(),
                "状态等级应与评分对应，评分: {}, 等级: {}, 期望: {}", 
                score, level, expected_level);
        }

        /// 属性90.4：推送文案生成准确性
        /// 对于任何学生学习状态，生成的推送文案应包含标题和内容
        #[test]
        fn prop_push_content_generation(
            student_id in 1i32..=10000,
            check_in_count in 0i32..=30,
            completed_tasks in 0i32..=100,
            total_tasks in 1i32..=100,
            push_type in "(check_in_reminder|task_reminder|class_notification)"
        ) {
            let status = StudentStatus {
                student_id,
                check_in_count,
                completed_tasks,
                total_tasks,
                learning_score: calculate_learning_score(completed_tasks, total_tasks),
            };
            
            let (title, content) = generate_push_content(student_id, &push_type, &status);
            
            // 验证标题非空
            prop_assert!(!title.is_empty(), "推送标题不应为空");
            
            // 验证内容非空
            prop_assert!(!content.is_empty(), "推送内容不应为空");
            
            // 验证标题长度合理（≤50字符）
            prop_assert!(title.len() <= 50,
                "推送标题长度应 <= 50，实际: {}", title.len());
            
            // 验证内容长度合理（≤500字符）
            prop_assert!(content.len() <= 500,
                "推送内容长度应 <= 500，实际: {}", content.len());
            
            // 验证推送类型相关的内容
            match push_type.as_str() {
                "check_in_reminder" => {
                    prop_assert!(title.contains("打卡") || title.contains("学习"),
                        "打卡提醒标题应包含相关关键词");
                }
                "task_reminder" => {
                    prop_assert!(title.contains("任务") || title.contains("完成"),
                        "任务提醒标题应包含相关关键词");
                }
                "class_notification" => {
                    prop_assert!(title.contains("班级") || title.contains("通知"),
                        "班级通知标题应包含相关关键词");
                }
                _ => {}
            }
        }

        /// 属性90.5：打卡提醒文案准确性
        /// 对于任何打卡次数，生成的打卡提醒应准确反映学生状态
        #[test]
        fn prop_check_in_reminder_accuracy(
            check_in_count in 0i32..=30
        ) {
            let status = StudentStatus {
                student_id: 1,
                check_in_count,
                completed_tasks: 5,
                total_tasks: 10,
                learning_score: 50.0,
            };
            
            let (title, content) = generate_push_content(1, "check_in_reminder", &status);
            
            // 验证标题包含打卡相关内容
            prop_assert!(title.contains("打卡"), "打卡提醒标题应包含'打卡'");
            
            // 验证内容根据打卡次数变化
            if check_in_count == 0 {
                prop_assert!(content.contains("还没有打卡") || content.contains("今天"),
                    "未打卡时应提醒用户打卡");
            } else {
                prop_assert!(content.contains(&check_in_count.to_string()) || content.contains("连续"),
                    "已打卡时应显示打卡次数或连续天数");
            }
        }

        /// 属性90.6：任务提醒文案准确性
        /// 对于任何任务完成情况，生成的任务提醒应准确反映进度
        #[test]
        fn prop_task_reminder_accuracy(
            completed_tasks in 0i32..=100,
            total_tasks in 1i32..=100
        ) {
            let status = StudentStatus {
                student_id: 1,
                check_in_count: 5,
                completed_tasks,
                total_tasks,
                learning_score: calculate_learning_score(completed_tasks, total_tasks),
            };
            
            let (title, content) = generate_push_content(1, "task_reminder", &status);
            
            // 验证标题包含任务相关内容
            prop_assert!(title.contains("任务") || title.contains("完成"),
                "任务提醒标题应包含任务相关内容");
            
            // 验证内容根据完成情况变化
            let remaining = total_tasks - completed_tasks;
            if remaining > 0 {
                prop_assert!(content.contains(&remaining.to_string()) || content.contains("未完成"),
                    "未完成所有任务时应显示剩余任务数");
            } else {
                prop_assert!(content.contains("完成") || content.contains("恭喜"),
                    "完成所有任务时应显示完成提示");
            }
        }

        /// 属性90.7：班级通知文案准确性
        /// 对于任何学生学习评分，生成的班级通知应包含评分信息
        #[test]
        fn prop_class_notification_accuracy(
            learning_score in 0.0f32..=100.0
        ) {
            let status = StudentStatus {
                student_id: 1,
                check_in_count: 5,
                completed_tasks: 50,
                total_tasks: 100,
                learning_score,
            };
            
            let (title, content) = generate_push_content(1, "class_notification", &status);
            
            // 验证标题包含班级通知相关内容
            prop_assert!(title.contains("班级") || title.contains("通知"),
                "班级通知标题应包含班级通知相关内容");
            
            // 验证内容包含学习评分
            let score_str = format!("{:.0}", learning_score);
            prop_assert!(content.contains(&score_str) || content.contains("评分"),
                "班级通知应包含学习评分信息");
        }

        /// 属性90.8：边界情况处理
        /// 对于边界情况（0任务、100%完成等），系统应正确处理
        #[test]
        fn prop_boundary_cases_handling(
            completed_tasks in prop_oneof![Just(0i32), Just(1), Just(50), Just(99), Just(100)],
            total_tasks in prop_oneof![Just(1i32), Just(50), Just(100)]
        ) {
            prop_assume!(completed_tasks <= total_tasks);
            
            let (score, level) = analyze_student_status(1, 0, completed_tasks, total_tasks);
            
            // 验证边界情况下的评分（clone level 避免多次使用 move）
            if completed_tasks == 0 {
                prop_assert_eq!(score, 0.0, "完成数为0时评分应为0");
                prop_assert_eq!(level.as_str(), "poor", "完成数为0时等级应为poor");
            }
            
            if completed_tasks == total_tasks {
                prop_assert_eq!(score, 100.0, "完成数等于总数时评分应为100");
                prop_assert_eq!(level.as_str(), "excellent", "完成数等于总数时等级应为excellent");
            }
        }

        /// 属性90.9：数据一致性
        /// 对于同一学生的多次分析，结果应一致
        #[test]
        fn prop_data_consistency(
            student_id in 1i32..=10000,
            check_in_count in 0i32..=30,
            completed_tasks in 0i32..=100,
            total_tasks in 1i32..=100
        ) {
            let (score1, level1) = analyze_student_status(
                student_id, check_in_count, completed_tasks, total_tasks
            );
            
            let (score2, level2) = analyze_student_status(
                student_id, check_in_count, completed_tasks, total_tasks
            );
            
            // 验证多次分析结果一致
            prop_assert_eq!(score1, score2, "同一学生的多次分析评分应一致");
            prop_assert_eq!(level1, level2, "同一学生的多次分析等级应一致");
        }

        /// 属性90.10：推送文案多样性
        /// 对于不同的推送类型，生成的文案应不同
        #[test]
        fn prop_push_content_diversity(
            student_id in 1i32..=10000,
            check_in_count in 0i32..=30,
            completed_tasks in 0i32..=100,
            total_tasks in 1i32..=100
        ) {
            let status = StudentStatus {
                student_id,
                check_in_count,
                completed_tasks,
                total_tasks,
                learning_score: calculate_learning_score(completed_tasks, total_tasks),
            };
            
            let (title1, content1) = generate_push_content(student_id, "check_in_reminder", &status);
            let (title2, content2) = generate_push_content(student_id, "task_reminder", &status);
            let (title3, content3) = generate_push_content(student_id, "class_notification", &status);
            
            // 验证不同推送类型的文案不同（clone 避免 move 后复用）
            prop_assert_ne!(title1, title2.clone(), "不同推送类型的标题应不同");
            prop_assert_ne!(title2, title3, "不同推送类型的标题应不同");
            prop_assert_ne!(content1, content2.clone(), "不同推送类型的内容应不同");
            prop_assert_ne!(content2, content3, "不同推送类型的内容应不同");
        }
    }
}

/// 单元测试
#[cfg(test)]
mod push_service_unit_tests {
    use super::*;

    #[test]
    fn test_learning_score_zero_tasks() {
        let score = calculate_learning_score(0, 0);
        assert_eq!(score, 0.0, "总任务数为0时评分应为0");
    }

    #[test]
    fn test_learning_score_full_completion() {
        let score = calculate_learning_score(10, 10);
        assert_eq!(score, 100.0, "完成所有任务时评分应为100");
    }

    #[test]
    fn test_learning_score_half_completion() {
        let score = calculate_learning_score(5, 10);
        assert_eq!(score, 50.0, "完成一半任务时评分应为50");
    }

    #[test]
    fn test_status_level_excellent() {
        let level = determine_status_level(95.0);
        assert_eq!(level, "excellent", "评分95应为excellent");
    }

    #[test]
    fn test_status_level_good() {
        let level = determine_status_level(80.0);
        assert_eq!(level, "good", "评分80应为good");
    }

    #[test]
    fn test_status_level_fair() {
        let level = determine_status_level(60.0);
        assert_eq!(level, "fair", "评分60应为fair");
    }

    #[test]
    fn test_status_level_poor() {
        let level = determine_status_level(30.0);
        assert_eq!(level, "poor", "评分30应为poor");
    }

    #[test]
    fn test_analyze_student_status() {
        let (score, level) = analyze_student_status(1, 5, 8, 10);
        assert_eq!(score, 80.0, "评分应为80");
        assert_eq!(level, "good", "等级应为good");
    }

    #[test]
    fn test_generate_check_in_reminder() {
        let status = StudentStatus {
            student_id: 1,
            check_in_count: 5,
            completed_tasks: 8,
            total_tasks: 10,
            learning_score: 80.0,
        };

        let (title, content) = generate_push_content(1, "check_in_reminder", &status);
        assert!(title.contains("打卡"), "打卡提醒标题应包含'打卡'");
        assert!(!content.is_empty(), "打卡提醒内容不应为空");
    }

    #[test]
    fn test_generate_task_reminder() {
        let status = StudentStatus {
            student_id: 1,
            check_in_count: 5,
            completed_tasks: 8,
            total_tasks: 10,
            learning_score: 80.0,
        };

        let (title, content) = generate_push_content(1, "task_reminder", &status);
        assert!(title.contains("任务") || title.contains("完成"), "任务提醒标题应包含任务相关内容");
        assert!(!content.is_empty(), "任务提醒内容不应为空");
    }

    #[test]
    fn test_generate_class_notification() {
        let status = StudentStatus {
            student_id: 1,
            check_in_count: 5,
            completed_tasks: 8,
            total_tasks: 10,
            learning_score: 80.0,
        };

        let (title, content) = generate_push_content(1, "class_notification", &status);
        assert!(title.contains("班级") || title.contains("通知"), "班级通知标题应包含班级通知相关内容");
        assert!(!content.is_empty(), "班级通知内容不应为空");
    }

    #[test]
    fn test_push_content_non_empty() {
        let status = StudentStatus {
            student_id: 1,
            check_in_count: 0,
            completed_tasks: 0,
            total_tasks: 10,
            learning_score: 0.0,
        };

        let (title, content) = generate_push_content(1, "check_in_reminder", &status);
        assert!(!title.is_empty(), "推送标题不应为空");
        assert!(!content.is_empty(), "推送内容不应为空");
    }

    #[test]
    fn test_push_content_length_limits() {
        let status = StudentStatus {
            student_id: 1,
            check_in_count: 30,
            completed_tasks: 100,
            total_tasks: 100,
            learning_score: 100.0,
        };

        let (title, content) = generate_push_content(1, "task_reminder", &status);
        assert!(title.len() <= 50, "推送标题长度应 <= 50");
        assert!(content.len() <= 500, "推送内容长度应 <= 500");
    }
}

// 说明文档：
// 运行这些测试：cd rust-service && cargo test --test push_service_properties
// 属性测试覆盖：学习评分、状态等级、推送文案等；单元测试覆盖评分计算、等级划分、文案生成与长度限制。
