/**
 * 新用户注册时自动发放优惠券
 * @param {ObjectId} userId - 用户ID
 * @returns {Array} 优惠券ID数组
 * @deprecated 优惠券功能已移除
 */
exports.generateNewUserCoupons = async userId => {
  try {
    // 优惠券功能已移除
    console.log(`✅ 为用户[${userId}]跳过优惠券发放（优惠券功能已移除）`);
    return [];
  } catch (error) {
    console.error('❌ 优惠券处理失败:', error.message);
    return [];
  }
};
