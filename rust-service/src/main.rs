use actix_web::{web, App, HttpResponse, HttpServer};
use actix_cors::Cors;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use std::env;
use edu_rust_service::grpc_server::start_grpc_server_with_fallback;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 初始化日志
    env_logger::init();
    
    // 加载环境变量
    dotenv::dotenv().ok();
    
    let http_port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let grpc_port: u16 = env::var("GRPC_PORT")
        .unwrap_or_else(|_| "50052".to_string())
        .parse()
        .unwrap_or(50052);
    
    let bind_address = format!("127.0.0.1:{}", http_port);
    
    println!("========================================");
    println!("  Rust高性能服务启动中");
    println!("========================================");
    
    // 启动gRPC服务器（在后台线程）
    let grpc_handle = tokio::spawn(async move {
        match start_grpc_server_with_fallback(grpc_port, vec![50053, 50054]).await {
            Ok(port) => {
                println!("✓ gRPC服务器已启动，端口: {}", port);
            }
            Err(e) => {
                eprintln!("✗ gRPC服务器启动失败: {}", e);
            }
        }
    });
    
    println!("✓ HTTP服务器已启动，端口: {}", http_port);
    println!("========================================");
    println!("  服务就绪，等待请求...");
    println!("========================================");
    
    // 启动HTTP服务器
    let http_server = HttpServer::new(|| {
        let cors = Cors::permissive();
        
        App::new()
            .wrap(cors)
            .route("/health", web::get().to(health_check))
            .route("/api/encrypt", web::post().to(encrypt_handler))
            .route("/api/decrypt", web::post().to(decrypt_handler))
            .route("/api/hash", web::post().to(hash_handler))
            .route("/api/similarity", web::post().to(similarity_handler))
    })
    .bind(&bind_address)?
    .run();
    
    // 等待两个服务器
    tokio::select! {
        _ = grpc_handle => {},
        result = http_server => {
            return result;
        }
    }
    
    Ok(())
}

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "message": "Rust高性能服务运行中",
        "services": {
            "http": "running",
            "grpc": "running"
        }
    }))
}

use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct EncryptRequest {
    data: String,
    key: String,
}

#[derive(Serialize)]
struct EncryptResponse {
    encrypted_data: String,
}

async fn encrypt_handler(req: web::Json<EncryptRequest>) -> HttpResponse {
    use edu_rust_service::crypto::encrypt_data;
    
    match encrypt_data(req.data.as_bytes(), &req.key) {
        Ok(encrypted) => {
            let encoded = BASE64.encode(&encrypted);
            HttpResponse::Ok().json(EncryptResponse {
                encrypted_data: encoded,
            })
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("加密失败: {}", e)
        })),
    }
}

#[derive(Deserialize)]
struct DecryptRequest {
    encrypted_data: String,
    key: String,
}

#[derive(Serialize)]
struct DecryptResponse {
    data: String,
}

async fn decrypt_handler(req: web::Json<DecryptRequest>) -> HttpResponse {
    use edu_rust_service::crypto::decrypt_data;
    
    match BASE64.decode(&req.encrypted_data) {
        Ok(encrypted_bytes) => {
            match decrypt_data(&encrypted_bytes, &req.key) {
                Ok(decrypted) => {
                    match String::from_utf8(decrypted) {
                        Ok(text) => HttpResponse::Ok().json(DecryptResponse { data: text }),
                        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({
                            "error": "解密后的数据不是有效的UTF-8文本"
                        })),
                    }
                }
                Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("解密失败: {}", e)
                })),
            }
        }
        Err(_) => HttpResponse::BadRequest().json(serde_json::json!({
            "error": "无效的Base64编码"
        })),
    }
}

#[derive(Deserialize)]
struct HashRequest {
    password: String,
}

#[derive(Serialize)]
struct HashResponse {
    hash: String,
}

async fn hash_handler(req: web::Json<HashRequest>) -> HttpResponse {
    use edu_rust_service::crypto::hash_password;
    
    match hash_password(&req.password) {
        Ok(hash) => HttpResponse::Ok().json(HashResponse { hash }),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("哈希失败: {}", e)
        })),
    }
}

#[derive(Deserialize)]
struct SimilarityRequest {
    text1: String,
    text2: String,
}

#[derive(Serialize)]
struct SimilarityResponse {
    similarity: f32,
}

async fn similarity_handler(req: web::Json<SimilarityRequest>) -> HttpResponse {
    use edu_rust_service::similarity::calculate_similarity;
    
    let similarity = calculate_similarity(&req.text1, &req.text2);
    HttpResponse::Ok().json(SimilarityResponse { similarity })
}
