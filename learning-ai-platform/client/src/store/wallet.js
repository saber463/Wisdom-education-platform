import { defineStore } from 'pinia';
import config from '@/config';
import { safeLocalStorage } from './user';

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    coupons: [], // 优惠券列表
    balance: 0, // 余额
    points: 0, // 积分
  }),

  getters: {
    // 可用优惠券
    validCoupons: state => {
      const now = Date.now();
      return state.coupons.filter(coupon => !coupon.isUsed && new Date(coupon.expiryDate) > now);
    },

    // 已过期优惠券
    expiredCoupons: state => {
      const now = Date.now();
      return state.coupons.filter(coupon => !coupon.isUsed && new Date(coupon.expiryDate) <= now);
    },

    // 即将到期优惠券（7天内）
    expiringCoupons: state => {
      const now = Date.now();
      const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000;
      return state.coupons.filter(
        coupon =>
          !coupon.isUsed &&
          new Date(coupon.expiryDate) > now &&
          new Date(coupon.expiryDate) <= sevenDaysLater
      );
    },

    // 可用优惠券数量
    validCouponsCount: state => {
      return state.coupons.filter(
        coupon => !coupon.isUsed && new Date(coupon.expiryDate) > Date.now()
      ).length;
    },

    // 即将到期优惠券数量
    expiringCouponsCount: state => {
      const now = Date.now();
      const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000;
      return state.coupons.filter(
        coupon =>
          !coupon.isUsed &&
          new Date(coupon.expiryDate) > now &&
          new Date(coupon.expiryDate) <= sevenDaysLater
      ).length;
    },
  },

  actions: {
    // 使用优惠券
    useCoupon(couponId) {
      const coupon = this.coupons.find(c => c.id === couponId);
      if (coupon && !coupon.isUsed && new Date(coupon.expiryDate) > Date.now()) {
        coupon.isUsed = true;
        coupon.usedAt = new Date().toISOString();
        this.saveToStorage();
        return true;
      }
      return false;
    },

    // 保存到本地存储
    saveToStorage() {
      safeLocalStorage.set(`${config.storagePrefix}wallet`, {
        coupons: this.coupons,
        balance: this.balance,
        points: this.points,
      });
    },

    // 从本地存储加载
    loadFromStorage() {
      const walletData = safeLocalStorage.get(`${config.storagePrefix}wallet`);
      if (walletData) {
        this.coupons = walletData.coupons || [];
        this.balance = walletData.balance || 0;
        this.points = walletData.points || 0;
      }
    },
  },
});
