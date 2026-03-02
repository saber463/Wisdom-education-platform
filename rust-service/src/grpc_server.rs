// gRPC服务端实现
use tonic::{transport::Server, Request, Response, Status};

// 引入生成的protobuf代码
pub mod rust_service {
    tonic::include_proto!("rust_service");
}

use rust_service::rust_service_server::{RustService, RustServiceServer};
use rust_service::{
    EncryptRequest, EncryptResponse, DecryptRequest, DecryptResponse,
    HashRequest, HashResponse, SimilarityRequest, SimilarityResponse,
    AnalyzeStudentStatusRequest, AnalyzeStudentStatusResponse,
    GeneratePushContentRequest, GeneratePushContentResponse,
};

use crate::crypto::{encrypt_data, decrypt_data, hash_password};
use crate::similarity::calculate_similarity;
use crate::push_service::{
    analyze_student_status, generate_push_content, determine_status_level,
    StudentStatus,
};

/// Rust高性能服务实现
pub struct RustServiceImpl;

#[tonic::async_trait]
impl RustService for RustServiceImpl {
    /// 数据加密
    async fn encrypt_data(
        &self,
        request: Request<EncryptRequest>,
    ) -> Result<Response<EncryptResponse>, Status> {
        let req = request.into_inner();
        
        log::info!("收到加密请求，数据长度: {} 字节", req.data.len());
        
        match encrypt_data(&req.data, &req.key) {
            Ok(encrypted) => {
                log::info!("加密成功，密文长度: {} 字节", encrypted.len());
                Ok(Response::new(EncryptResponse {
                    encrypted_data: encrypted,
                }))
            }
            Err(e) => {
                log::error!("加密失败: {}", e);
                Err(Status::internal(format!("加密失败: {}", e)))
            }
        }
    }

    /// 数据解密
    async fn decrypt_data(
        &self,
        request: Request<DecryptRequest>,
    ) -> Result<Response<DecryptResponse>, Status> {
        let req = request.into_inner();
        
        log::info!("收到解密请求，密文长度: {} 字节", req.encrypted_data.len());
        
        match decrypt_data(&req.encrypted_data, &req.key) {
            Ok(decrypted) => {
                log::info!("解密成功，明文长度: {} 字节", decrypted.len());
                Ok(Response::new(DecryptResponse {
                    data: decrypted,
                }))
            }
            Err(e) => {
                log::error!("解密失败: {}", e);
                Err(Status::internal(format!("解密失败: {}", e)))
            }
        }
    }

    /// 密码哈希
    async fn hash_password(
        &self,
        request: Request<HashRequest>,
    ) -> Result<Response<HashResponse>, Status> {
        let req = request.into_inner();
        
        log::info!("收到密码哈希请求");
        
        match hash_password(&req.password) {
            Ok(hash) => {
                log::info!("密码哈希成功");
                Ok(Response::new(HashResponse { hash }))
            }
            Err(e) => {
                log::error!("密码哈希失败: {}", e);
                Err(Status::internal(format!("密码哈希失败: {}", e)))
            }
        }
    }

    /// 相似度计算
    async fn calculate_similarity(
        &self,
        request: Request<SimilarityRequest>,
    ) -> Result<Response<SimilarityResponse>, Status> {
        let req = request.into_inner();
        
        log::info!(
            "收到相似度计算请求，文本1长度: {}, 文本2长度: {}",
            req.text1.len(),
            req.text2.len()
        );
        
        let similarity = calculate_similarity(&req.text1, &req.text2);
        
        log::info!("相似度计算完成: {:.4}", similarity);
        
        Ok(Response::new(SimilarityResponse { similarity }))
    }

    /// 分析学生学习状态
    /// 
    /// 根据学生的打卡情况、任务完成情况计算学习评分和状态等级
    /// 
    /// 学习评分 = (完成任务数 / 总任务数) * 100
    /// 状态等级：
    /// - excellent: 评分 >= 90
    /// - good: 评分 >= 70 && < 90
    /// - fair: 评分 >= 50 && < 70
    /// - poor: 评分 < 50
    async fn analyze_student_status(
        &self,
        request: Request<AnalyzeStudentStatusRequest>,
    ) -> Result<Response<AnalyzeStudentStatusResponse>, Status> {
        let req = request.into_inner();
        
        log::info!(
            "分析学生学习状态: student_id={}, completed_tasks={}, total_tasks={}",
            req.student_id, req.completed_tasks, req.total_tasks
        );
        
        let (learning_score, status_level) = analyze_student_status(
            req.student_id,
            req.check_in_count,
            req.completed_tasks,
            req.total_tasks,
        );
        
        log::info!(
            "学生学习状态分析完成: score={:.2}, level={}",
            learning_score, status_level
        );
        
        Ok(Response::new(AnalyzeStudentStatusResponse {
            success: true,
            learning_score,
            status_level,
            message: "学生学习状态分析成功".to_string(),
        }))
    }

    /// 生成推送文案
    /// 
    /// 根据学生学习状态生成个性化推送内容
    /// 支持的推送类型：
    /// - check_in_reminder: 打卡提醒
    /// - task_reminder: 任务提醒
    /// - class_notification: 班级通知
    async fn generate_push_content(
        &self,
        request: Request<GeneratePushContentRequest>,
    ) -> Result<Response<GeneratePushContentResponse>, Status> {
        let req = request.into_inner();
        
        log::info!(
            "生成推送文案: student_id={}, push_type={}",
            req.student_id, req.push_type
        );
        
        let status = StudentStatus {
            student_id: req.student_id,
            check_in_count: req.check_in_count,
            completed_tasks: req.completed_tasks,
            total_tasks: req.total_tasks,
            learning_score: req.learning_score,
        };
        
        let (title, content) = generate_push_content(
            req.student_id,
            &req.push_type,
            &status,
        );
        
        log::info!("推送文案生成完成: title={}", title);
        
        Ok(Response::new(GeneratePushContentResponse {
            success: true,
            title,
            content,
            message: "推送文案生成成功".to_string(),
        }))
    }
}

/// 启动gRPC服务器
/// 
/// # 参数
/// * `port` - 监听端口
/// 
/// # 返回
/// 如果启动成功返回Ok，否则返回错误
pub async fn start_grpc_server(port: u16) -> Result<(), Box<dyn std::error::Error>> {
    let addr = format!("127.0.0.1:{}", port).parse()?;
    let service = RustServiceImpl;

    log::info!("gRPC服务器启动中，监听地址: {}", addr);

    Server::builder()
        .add_service(RustServiceServer::new(service))
        .serve(addr)
        .await?;

    Ok(())
}

/// 尝试在多个端口上启动gRPC服务器
/// 如果默认端口被占用，自动切换到备用端口
/// 
/// # 参数
/// * `default_port` - 默认端口
/// * `alternative_ports` - 备用端口列表
/// 
/// # 返回
/// 成功启动的端口号
pub async fn start_grpc_server_with_fallback(
    default_port: u16,
    alternative_ports: Vec<u16>,
) -> Result<u16, Box<dyn std::error::Error>> {
    // 尝试默认端口
    match tokio::net::TcpListener::bind(format!("127.0.0.1:{}", default_port)).await {
        Ok(_) => {
            log::info!("端口 {} 可用，启动gRPC服务器", default_port);
            tokio::spawn(async move {
                if let Err(e) = start_grpc_server(default_port).await {
                    log::error!("gRPC服务器启动失败: {}", e);
                }
            });
            return Ok(default_port);
        }
        Err(_) => {
            log::warn!("端口 {} 被占用，尝试备用端口", default_port);
        }
    }

    // 尝试备用端口
    for port in alternative_ports {
        match tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port)).await {
            Ok(_) => {
                log::info!("端口 {} 可用，启动gRPC服务器", port);
                tokio::spawn(async move {
                    if let Err(e) = start_grpc_server(port).await {
                        log::error!("gRPC服务器启动失败: {}", e);
                    }
                });
                return Ok(port);
            }
            Err(_) => {
                log::warn!("端口 {} 被占用，继续尝试", port);
            }
        }
    }

    Err("所有端口均被占用".into())
}
