/**
 * Rust高性能推送服务
 * 负责学生学习状态分析和推送文案生成
 */

use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StudentStatus {
    pub student_id: i32,
    pub check_in_count: i32,
    pub completed_tasks: i32,
    pub total_tasks: i32,
    pub learning_score: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PushContent {
    pub title: String,
    pub content: String,
    pub push_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyzeStatusRequest {
    pub student_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyzeStatusResponse {
    pub success: bool,
    pub data: Option<StudentStatus>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratePushContentRequest {
    pub student_id: i32,
    pub push_type: String,
    pub status: StudentStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratePushContentResponse {
    pub success: bool,
    pub data: Option<PushContent>,
    pub message: String,
}

pub struct PushServiceState {
    pub concurrent_tasks: Arc<AtomicUsize>,
    pub max_concurrent: usize,
}

impl PushServiceState {
    pub fn new(max_concurrent: usize) -> Self {
        PushServiceState {
            concurrent_tasks: Arc::new(AtomicUsize::new(0)),
            max_concurrent,
        }
    }

    pub fn can_execute_task(&self) -> bool {
        let current = self.concurrent_tasks.load(Ordering::SeqCst);
        current < self.max_concurrent
    }

    pub fn increment_tasks(&self) {
        self.concurrent_tasks.fetch_add(1, Ordering::SeqCst);
    }

    pub fn decrement_tasks(&self) {
        self.concurrent_tasks.fetch_sub(1, Ordering::SeqCst);
    }

    pub fn get_current_tasks(&self) -> usize {
        self.concurrent_tasks.load(Ordering::SeqCst)
    }
}

/**
 * 分析学生学习状态
 * 返回学生的打卡情况、任务完成情况、学习进度评分
 * 
 * 学习评分计算规则：
 * - 任务完成率 * 100 = 学习评分
 * - 评分范围：0-100分
 * 
 * 状态等级划分：
 * - excellent: 学习评分 >= 90
 * - good: 学习评分 >= 70 && < 90
 * - fair: 学习评分 >= 50 && < 70
 * - poor: 学习评分 < 50
 */
pub fn analyze_student_status(
    _student_id: i32,
    _check_in_count: i32,
    completed_tasks: i32,
    total_tasks: i32,
) -> (f32, String) {
    let learning_score = calculate_learning_score(completed_tasks, total_tasks);
    let status_level = determine_status_level(learning_score);
    
    (learning_score, status_level)
}

/**
 * 计算学习评分
 * 基于任务完成率计算
 */
pub fn calculate_learning_score(completed: i32, total: i32) -> f32 {
    if total == 0 {
        0.0
    } else {
        (completed as f32 / total as f32) * 100.0
    }
}

/**
 * 确定学习状态等级
 */
pub fn determine_status_level(score: f32) -> String {
    if score >= 90.0 {
        "excellent".to_string()
    } else if score >= 70.0 {
        "good".to_string()
    } else if score >= 50.0 {
        "fair".to_string()
    } else {
        "poor".to_string()
    }
}

/**
 * 生成推送文案
 * 基于学生学习状态生成个性化推送内容
 */
pub fn generate_push_content(
    _student_id: i32,
    push_type: &str,
    status: &StudentStatus,
) -> (String, String) {
    match push_type {
        "check_in_reminder" => generate_check_in_reminder(status),
        "task_reminder" => generate_task_reminder(status),
        "class_notification" => generate_class_notification(status),
        _ => (
            "📝 学习提醒".to_string(),
            "您有新的学习内容，快来查看吧！".to_string(),
        ),
    }
}

/**
 * 生成打卡提醒文案
 */
fn generate_check_in_reminder(status: &StudentStatus) -> (String, String) {
    let title = "📚 学习打卡提醒".to_string();
    let content = if status.check_in_count == 0 {
        "亲爱的同学，今天还没有打卡哦！快来完成今日学习打卡吧！".to_string()
    } else {
        format!(
            "太棒了！你已经连续打卡 {} 天了，继续保持哦！",
            status.check_in_count
        )
    };
    
    (title, content)
}

/**
 * 生成任务提醒文案
 */
fn generate_task_reminder(status: &StudentStatus) -> (String, String) {
    let title = "✅ 任务完成提醒".to_string();
    let remaining = status.total_tasks - status.completed_tasks;
    let content = if remaining > 0 {
        format!(
            "你还有 {} 个任务未完成，学习进度 {:.0}%，加油！",
            remaining,
            (status.completed_tasks as f32 / status.total_tasks as f32) * 100.0
        )
    } else {
        "恭喜！你已完成所有任务，继续加油！".to_string()
    };
    
    (title, content)
}

/**
 * 生成班级通知文案
 */
fn generate_class_notification(status: &StudentStatus) -> (String, String) {
    let title = "📢 班级通知".to_string();
    let content = format!(
        "班级有新的作业发布，你的学习评分为 {:.0} 分，快来查看新作业吧！",
        status.learning_score
    );
    
    (title, content)
}

/**
 * HTTP处理器：分析学生学习状态
 */
pub async fn analyze_student_status_handler(
    req: web::Json<AnalyzeStatusRequest>,
    state: web::Data<PushServiceState>,
) -> Result<HttpResponse> {
    // 检查并发数量限制
    if !state.can_execute_task() {
        return Ok(HttpResponse::TooManyRequests().json(AnalyzeStatusResponse {
            success: false,
            data: None,
            message: "并发任务已达上限，请稍后重试".to_string(),
        }));
    }

    state.increment_tasks();

    // 模拟学生学习状态分析
    // 实际应该从数据库查询学生的打卡记录、任务完成情况等
    let status = StudentStatus {
        student_id: req.student_id,
        check_in_count: 5,
        completed_tasks: 8,
        total_tasks: 10,
        learning_score: calculate_learning_score(8, 10),
    };

    state.decrement_tasks();

    Ok(HttpResponse::Ok().json(AnalyzeStatusResponse {
        success: true,
        data: Some(status),
        message: "学生学习状态分析成功".to_string(),
    }))
}

/**
 * HTTP处理器：生成推送文案
 */
pub async fn generate_push_content_handler(
    req: web::Json<GeneratePushContentRequest>,
    state: web::Data<PushServiceState>,
) -> Result<HttpResponse> {
    // 检查并发数量限制
    if !state.can_execute_task() {
        return Ok(HttpResponse::TooManyRequests().json(GeneratePushContentResponse {
            success: false,
            data: None,
            message: "并发任务已达上限，请稍后重试".to_string(),
        }));
    }

    state.increment_tasks();

    let (title, content) = generate_push_content(
        req.student_id,
        &req.push_type,
        &req.status,
    );

    let push_content = PushContent {
        title,
        content,
        push_type: req.push_type.clone(),
    };

    state.decrement_tasks();

    Ok(HttpResponse::Ok().json(GeneratePushContentResponse {
        success: true,
        data: Some(push_content),
        message: "推送文案生成成功".to_string(),
    }))
}

/**
 * 获取推送服务状态
 */
pub async fn get_push_service_status(
    state: web::Data<PushServiceState>,
) -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {
            "current_tasks": state.get_current_tasks(),
            "max_concurrent": state.max_concurrent,
            "cpu_usage": "15%",
            "memory_usage": "100MB"
        }
    })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_learning_score() {
        assert_eq!(calculate_learning_score(8, 10), 80.0);
        assert_eq!(calculate_learning_score(10, 10), 100.0);
        assert_eq!(calculate_learning_score(0, 10), 0.0);
        assert_eq!(calculate_learning_score(0, 0), 0.0);
    }

    #[test]
    fn test_determine_status_level() {
        assert_eq!(determine_status_level(95.0), "excellent");
        assert_eq!(determine_status_level(80.0), "good");
        assert_eq!(determine_status_level(60.0), "fair");
        assert_eq!(determine_status_level(30.0), "poor");
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

        let (title, content) = generate_check_in_reminder(&status);
        assert_eq!(title, "📚 学习打卡提醒");
        assert!(content.contains("5"));
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

        let (title, content) = generate_task_reminder(&status);
        assert_eq!(title, "✅ 任务完成提醒");
        assert!(content.contains("2")); // 2 remaining tasks
    }

    #[test]
    fn test_push_service_state() {
        let state = PushServiceState::new(100);
        assert!(state.can_execute_task());
        assert_eq!(state.get_current_tasks(), 0);

        state.increment_tasks();
        assert_eq!(state.get_current_tasks(), 1);

        state.decrement_tasks();
        assert_eq!(state.get_current_tasks(), 0);
    }

    #[test]
    fn test_analyze_student_status() {
        let (score, level) = analyze_student_status(1, 5, 8, 10);
        assert_eq!(score, 80.0);
        assert_eq!(level, "good");
    }

    #[test]
    fn test_generate_push_content_check_in() {
        let status = StudentStatus {
            student_id: 1,
            check_in_count: 3,
            completed_tasks: 8,
            total_tasks: 10,
            learning_score: 80.0,
        };

        let (title, content) = generate_push_content(1, "check_in_reminder", &status);
        assert!(title.contains("打卡"));
        assert!(content.contains("3"));
    }
}
