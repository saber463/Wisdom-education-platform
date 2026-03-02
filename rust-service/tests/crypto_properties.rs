// Feature: smart-education-platform, Property 33: 加密解密往返一致性
// 验证需求：9.2

use edu_rust_service::crypto::{encrypt_data, decrypt_data, hash_password, verify_password};
use proptest::prelude::*;

proptest! {
    #![proptest_config(ProptestConfig::with_cases(100))]
    
    /// 属性33：加密解密往返一致性
    /// 对于任何数据，使用AES-256加密后再解密，应得到与原始数据相同的结果
    #[test]
    fn prop_encrypt_decrypt_roundtrip(
        data in prop::collection::vec(any::<u8>(), 0..1000),
        key in "[a-zA-Z0-9]{8,32}"
    ) {
        // 加密数据
        let encrypted = encrypt_data(&data, &key)
            .expect("加密应该成功");
        
        // 解密数据
        let decrypted = decrypt_data(&encrypted, &key)
            .expect("解密应该成功");
        
        // 验证往返一致性
        prop_assert_eq!(data, decrypted, "加密解密往返后数据应该保持一致");
    }
    
    /// 属性：使用错误的密钥解密应该失败
    #[test]
    fn prop_decrypt_with_wrong_key_fails(
        data in prop::collection::vec(any::<u8>(), 1..100),
        correct_key in "[a-zA-Z0-9]{8,32}",
        wrong_key in "[a-zA-Z0-9]{8,32}"
    ) {
        // 确保两个密钥不同
        prop_assume!(correct_key != wrong_key);
        
        // 使用正确密钥加密
        let encrypted = encrypt_data(&data, &correct_key)
            .expect("加密应该成功");
        
        // 使用错误密钥解密应该失败
        let result = decrypt_data(&encrypted, &wrong_key);
        prop_assert!(result.is_err(), "使用错误密钥解密应该失败");
    }
    
    /// 属性：空数据的加密解密往返
    #[test]
    fn prop_empty_data_roundtrip(
        key in "[a-zA-Z0-9]{8,32}"
    ) {
        let data: Vec<u8> = vec![];
        
        let encrypted = encrypt_data(&data, &key)
            .expect("加密空数据应该成功");
        
        let decrypted = decrypt_data(&encrypted, &key)
            .expect("解密空数据应该成功");
        
        prop_assert_eq!(data, decrypted, "空数据加密解密往返应该保持一致");
    }
}

#[cfg(test)]
mod password_properties {
    use super::*;
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]
        
        /// 属性34：密码哈希存储安全性
        /// 对于任何用户密码，数据库中存储的应是bcrypt哈希值，而非明文
        #[test]
        fn prop_password_hash_not_plaintext(
            password in "[a-zA-Z0-9!@#$%^&*()]{8,64}"
        ) {
            let hash = hash_password(&password)
                .expect("密码哈希应该成功");
            
            // 哈希值不应该等于明文密码（clone 避免 move 后借用）
            prop_assert_ne!(hash.clone(), password.clone(), "哈希值不应该等于明文密码");
            
            // 哈希值应该以$2b$开头（bcrypt格式）
            prop_assert!(hash.starts_with("$2b$"), "哈希值应该是bcrypt格式");
            
            // 验证正确的密码应该成功
            let is_valid = verify_password(&password, &hash)
                .expect("密码验证应该成功");
            prop_assert!(is_valid, "正确的密码应该验证通过");
        }
        
        /// 属性：错误的密码验证应该失败
        #[test]
        fn prop_wrong_password_verification_fails(
            correct_password in "[a-zA-Z0-9!@#$%^&*()]{8,64}",
            wrong_password in "[a-zA-Z0-9!@#$%^&*()]{8,64}"
        ) {
            // 确保两个密码不同
            prop_assume!(correct_password != wrong_password);
            
            let hash = hash_password(&correct_password)
                .expect("密码哈希应该成功");
            
            // 验证错误的密码应该失败
            let is_valid = verify_password(&wrong_password, &hash)
                .expect("密码验证应该成功");
            prop_assert!(!is_valid, "错误的密码应该验证失败");
        }
        
        /// 属性：相同密码的多次哈希应该产生不同结果（盐的随机性）
        #[test]
        fn prop_same_password_different_hashes(
            password in "[a-zA-Z0-9!@#$%^&*()]{8,64}"
        ) {
            let hash1 = hash_password(&password)
                .expect("第一次哈希应该成功");
            let hash2 = hash_password(&password)
                .expect("第二次哈希应该成功");
            
            // 两次哈希结果应该不同（因为使用了随机盐）；clone 避免 move 后借用
            prop_assert_ne!(hash1.clone(), hash2.clone(), "相同密码的多次哈希应该产生不同结果");
            
            // 但两个哈希都应该能验证原始密码
            prop_assert!(verify_password(&password, &hash1).unwrap());
            prop_assert!(verify_password(&password, &hash2).unwrap());
        }
    }
}
