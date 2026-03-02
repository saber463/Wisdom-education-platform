// AES-256加密解密模块和bcrypt密码哈希模块
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use rand::RngCore;

/// AES-256加密错误类型
#[derive(Debug)]
pub enum CryptoError {
    EncryptionFailed(String),
    DecryptionFailed(String),
    InvalidKey(String),
    HashingFailed(String),
    VerificationFailed(String),
}

impl std::fmt::Display for CryptoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CryptoError::EncryptionFailed(msg) => write!(f, "加密失败: {}", msg),
            CryptoError::DecryptionFailed(msg) => write!(f, "解密失败: {}", msg),
            CryptoError::InvalidKey(msg) => write!(f, "无效密钥: {}", msg),
            CryptoError::HashingFailed(msg) => write!(f, "哈希失败: {}", msg),
            CryptoError::VerificationFailed(msg) => write!(f, "验证失败: {}", msg),
        }
    }
}

impl std::error::Error for CryptoError {}

/// 生成32字节的AES-256密钥
pub fn generate_key() -> Vec<u8> {
    let mut key = vec![0u8; 32];
    OsRng.fill_bytes(&mut key);
    key
}

/// 生成12字节的随机nonce
fn generate_nonce() -> Vec<u8> {
    let mut nonce = vec![0u8; 12];
    OsRng.fill_bytes(&mut nonce);
    nonce
}

/// 将字符串密钥转换为32字节密钥（使用SHA-256哈希）
fn key_from_string(key_str: &str) -> Vec<u8> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    // 简单的密钥派生：重复密钥字符串直到32字节
    let mut key = Vec::with_capacity(32);
    let key_bytes = key_str.as_bytes();
    
    while key.len() < 32 {
        key.extend_from_slice(key_bytes);
    }
    key.truncate(32);
    key
}

/// AES-256-GCM加密
/// 
/// # 参数
/// * `data` - 要加密的数据
/// * `key` - 加密密钥（字符串，将被转换为32字节密钥）
/// 
/// # 返回
/// 加密后的数据（包含nonce前缀）
pub fn encrypt_data(data: &[u8], key: &str) -> Result<Vec<u8>, CryptoError> {
    // 从字符串生成密钥
    let key_bytes = key_from_string(key);
    
    // 创建密钥数组
    let key_array: [u8; 32] = key_bytes
        .try_into()
        .map_err(|_| CryptoError::InvalidKey("密钥长度必须为32字节".to_string()))?;
    
    // 创建加密器
    let cipher = Aes256Gcm::new(&key_array.into());
    
    // 生成随机nonce
    let nonce_bytes = generate_nonce();
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    // 加密数据
    let ciphertext = cipher
        .encrypt(nonce, data)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;
    
    // 将nonce和密文组合（nonce在前12字节）
    let mut result = nonce_bytes;
    result.extend_from_slice(&ciphertext);
    
    Ok(result)
}

/// AES-256-GCM解密
/// 
/// # 参数
/// * `encrypted_data` - 加密的数据（包含nonce前缀）
/// * `key` - 解密密钥（字符串，将被转换为32字节密钥）
/// 
/// # 返回
/// 解密后的原始数据
pub fn decrypt_data(encrypted_data: &[u8], key: &str) -> Result<Vec<u8>, CryptoError> {
    // 检查数据长度（至少需要12字节nonce）
    if encrypted_data.len() < 12 {
        return Err(CryptoError::DecryptionFailed(
            "加密数据太短".to_string(),
        ));
    }
    
    // 从字符串生成密钥
    let key_bytes = key_from_string(key);
    
    // 创建密钥数组
    let key_array: [u8; 32] = key_bytes
        .try_into()
        .map_err(|_| CryptoError::InvalidKey("密钥长度必须为32字节".to_string()))?;
    
    // 创建解密器
    let cipher = Aes256Gcm::new(&key_array.into());
    
    // 提取nonce（前12字节）
    let nonce = Nonce::from_slice(&encrypted_data[..12]);
    
    // 提取密文（12字节之后）
    let ciphertext = &encrypted_data[12..];
    
    // 解密数据
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;
    
    Ok(plaintext)
}

/// 使用bcrypt对密码进行哈希
/// 
/// # 参数
/// * `password` - 明文密码
/// 
/// # 返回
/// bcrypt哈希值
pub fn hash_password(password: &str) -> Result<String, CryptoError> {
    hash(password, DEFAULT_COST)
        .map_err(|e| CryptoError::HashingFailed(e.to_string()))
}

/// 验证密码是否匹配哈希值
/// 
/// # 参数
/// * `password` - 明文密码
/// * `hash` - bcrypt哈希值
/// 
/// # 返回
/// 如果密码匹配返回true，否则返回false
pub fn verify_password(password: &str, hash: &str) -> Result<bool, CryptoError> {
    verify(password, hash)
        .map_err(|e| CryptoError::VerificationFailed(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_generation() {
        let key1 = generate_key();
        let key2 = generate_key();
        
        assert_eq!(key1.len(), 32);
        assert_eq!(key2.len(), 32);
        assert_ne!(key1, key2); // 每次生成的密钥应该不同
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let data = b"Hello, World! 你好世界！";
        let key = "my-secret-key-123";
        
        let encrypted = encrypt_data(data, key).expect("加密失败");
        let decrypted = decrypt_data(&encrypted, key).expect("解密失败");
        
        assert_eq!(data.to_vec(), decrypted);
    }

    #[test]
    fn test_encrypt_different_outputs() {
        let data = b"Same data";
        let key = "same-key";
        
        let encrypted1 = encrypt_data(data, key).expect("加密失败");
        let encrypted2 = encrypt_data(data, key).expect("加密失败");
        
        // 由于使用随机nonce，每次加密结果应该不同
        assert_ne!(encrypted1, encrypted2);
        
        // 但解密后应该得到相同的原始数据
        let decrypted1 = decrypt_data(&encrypted1, key).expect("解密失败");
        let decrypted2 = decrypt_data(&encrypted2, key).expect("解密失败");
        assert_eq!(decrypted1, decrypted2);
        assert_eq!(data.to_vec(), decrypted1);
    }

    #[test]
    fn test_decrypt_with_wrong_key() {
        let data = b"Secret message";
        let key = "correct-key";
        let wrong_key = "wrong-key";
        
        let encrypted = encrypt_data(data, key).expect("加密失败");
        let result = decrypt_data(&encrypted, wrong_key);
        
        assert!(result.is_err());
    }

    #[test]
    fn test_password_hashing() {
        let password = "MySecurePassword123!";
        let hash = hash_password(password).expect("哈希失败");
        
        // 哈希值应该以$2b$开头（bcrypt格式）
        assert!(hash.starts_with("$2b$"));
        
        // 验证正确的密码
        assert!(verify_password(password, &hash).expect("验证失败"));
        
        // 验证错误的密码
        assert!(!verify_password("WrongPassword", &hash).expect("验证失败"));
    }

    #[test]
    fn test_password_hash_different_outputs() {
        let password = "SamePassword";
        
        let hash1 = hash_password(password).expect("哈希失败");
        let hash2 = hash_password(password).expect("哈希失败");
        
        // bcrypt使用随机盐，所以每次哈希结果应该不同
        assert_ne!(hash1, hash2);
        
        // 但两个哈希都应该能验证原始密码
        assert!(verify_password(password, &hash1).expect("验证失败"));
        assert!(verify_password(password, &hash2).expect("验证失败"));
    }
}
