<template>
  <div class="wallet-page">
    <div class="container">
      <div class="page-header">
        <h1>我的钱包</h1>
        <p>管理您的账户余额和交易记录</p>
      </div>

      <div v-if="loading" class="loading-container">
        <Loading />
      </div>

      <div v-else>
        <div class="wallet-overview">
          <div class="balance-card">
            <div class="balance-header">
              <i class="fa fa-wallet balance-icon" />
              <span class="balance-label">账户余额</span>
            </div>
            <div class="balance-amount">
              <span class="currency">¥</span>
              <span class="amount">{{ balance.toFixed(2) }}</span>
            </div>
            <button class="recharge-btn" @click="showRechargeModal = true">
              <i class="fa fa-plus-circle" />
              立即充值
            </button>
          </div>

          <div class="membership-card">
            <div class="membership-header">
              <i class="fa fa-crown membership-icon" />
              <span class="membership-label">当前会员</span>
            </div>
            <div class="membership-level" :class="membershipLevelClass">
              {{ membershipLevelName }}
            </div>
            <div v-if="membershipExpireDate" class="membership-expire">
              有效期至：{{ formatDate(membershipExpireDate) }}
            </div>
            <div v-if="daysRemaining > 0" class="membership-remaining">
              剩余 {{ daysRemaining }} 天
            </div>
            <button class="upgrade-btn" @click="goToMembership">
              <i class="fa fa-arrow-right" />
              升级会员
            </button>
          </div>
        </div>

        <div class="transactions-section">
          <div class="section-header">
            <h2>交易记录</h2>
            <div class="filter-buttons">
              <button
                v-for="filter in filters"
                :key="filter.value"
                class="filter-btn"
                :class="{ 'filter-btn-active': activeFilter === filter.value }"
                @click="activeFilter = filter.value"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>

          <div v-if="filteredTransactions.length === 0" class="empty-state">
            <i class="fa fa-receipt empty-icon" />
            <p>暂无交易记录</p>
          </div>

          <div v-else class="transactions-list">
            <div
              v-for="transaction in paginatedTransactions"
              :key="transaction._id || transaction.createdAt"
              class="transaction-item"
            >
              <div class="transaction-icon" :class="transaction.type">
                <i :class="getTransactionIcon(transaction.type)" />
              </div>
              <div class="transaction-info">
                <div class="transaction-description">{{ transaction.description }}</div>
                <div class="transaction-time">{{ formatTime(transaction.createdAt) }}</div>
              </div>
              <div class="transaction-amount" :class="getAmountClass(transaction.amount)">
                {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount.toFixed(2) }}
              </div>
            </div>
          </div>

          <div v-if="totalPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <i class="fa fa-chevron-left" />
            </button>
            <span class="pagination-info">{{ currentPage }} / {{ totalPages }}</span>
            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <i class="fa fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <RechargeModal
      v-if="showRechargeModal"
      @close="showRechargeModal = false"
      @recharge="handleRecharge"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Loading from '@/components/common/Loading.vue';
import RechargeModal from '@/components/business/RechargeModal.vue';

const router = useRouter();

const loading = ref(true);
const balance = ref(0);
const transactions = ref([]);
const membershipLevel = ref('free');
const membershipExpireDate = ref(null);
const daysRemaining = ref(0);
const showRechargeModal = ref(false);
const activeFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = 10;

const filters = [
  { label: '全部', value: 'all' },
  { label: '充值', value: 'recharge' },
  { label: '消费', value: 'purchase' },
  { label: '退款', value: 'refund' },
  { label: '奖励', value: 'reward' },
];

const membershipLevelName = computed(() => {
  const levelMap = {
    free: '免费用户',
    silver: '白银会员',
    gold: '黄金会员',
  };
  return levelMap[membershipLevel.value] || '免费用户';
});

const membershipLevelClass = computed(() => {
  return `level-${membershipLevel.value}`;
});

const filteredTransactions = computed(() => {
  if (activeFilter.value === 'all') {
    return transactions.value;
  }
  return transactions.value.filter(t => t.type === activeFilter.value);
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredTransactions.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage);
});

const getTransactionIcon = type => {
  const iconMap = {
    recharge: 'fa fa-plus-circle',
    purchase: 'fa fa-shopping-cart',
    refund: 'fa fa-undo',
    reward: 'fa fa-gift',
  };
  return iconMap[type] || 'fa fa-exchange-alt';
};

const getAmountClass = amount => {
  return amount > 0 ? 'amount-positive' : 'amount-negative';
};

const formatDate = date => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatTime = date => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

const fetchWalletData = async () => {
  try {
    const token = localStorage.getItem('learning-ai-token');
    const response = await fetch('http://localhost:4001/api/wallet/balance', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取钱包数据失败');
    }

    const data = await response.json();
    if (data.success) {
      balance.value = data.data.balance;
    }
  } catch (error) {
    console.error('获取钱包数据失败:', error);
  }
};

const fetchTransactions = async () => {
  try {
    const token = localStorage.getItem('learning-ai-token');
    const response = await fetch('http://localhost:4001/api/wallet/transactions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取交易记录失败');
    }

    const data = await response.json();
    if (data.success) {
      transactions.value = data.data.transactions || [];
    }
  } catch (error) {
    console.error('获取交易记录失败:', error);
  }
};

const fetchMembershipInfo = async () => {
  try {
    const token = localStorage.getItem('learning-ai-token');
    const response = await fetch('http://localhost:4001/api/wallet/membership', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取会员信息失败');
    }

    const data = await response.json();
    if (data.success) {
      membershipLevel.value = data.data.level;
      membershipExpireDate.value = data.data.expireDate;
      daysRemaining.value = data.data.daysRemaining;
    }
  } catch (error) {
    console.error('获取会员信息失败:', error);
  }
};

const handleRecharge = async rechargeData => {
  try {
    const amount = typeof rechargeData === 'number' ? rechargeData : rechargeData.amount;
    
    if (rechargeData.balance !== undefined) {
      balance.value = rechargeData.balance;
    }
    
    if (rechargeData.transaction) {
      transactions.value.unshift(rechargeData.transaction);
    }
    
    showRechargeModal.value = false;
  } catch (error) {
    console.error('充值失败:', error);
    alert('充值失败，请稍后重试');
  }
};

const goToMembership = () => {
  router.push('/membership');
};

onMounted(async () => {
  await Promise.all([fetchWalletData(), fetchTransactions(), fetchMembershipInfo()]);
  loading.value = false;
});
</script>

<style scoped>
.wallet-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
}

.wallet-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(0, 242, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(114, 9, 183, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(247, 37, 133, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  z-index: 1;
}

.page-header {
  text-align: center;
  color: white;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple), var(--tech-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(0, 242, 255, 0.3);
  letter-spacing: -0.5px;
}

.page-header p {
  font-size: 1.25rem;
  opacity: 0.85;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.wallet-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.balance-card,
.membership-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.balance-card:hover,
.membership-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.balance-header,
.membership-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.balance-icon,
.membership-icon {
  font-size: 1.5rem;
  color: var(--tech-blue);
}

.membership-icon {
  color: var(--tech-gold);
}

.balance-label,
.membership-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
}

.currency {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.amount {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.recharge-btn,
.upgrade-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.recharge-btn:hover,
.upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 242, 255, 0.3);
}

.upgrade-btn {
  background: linear-gradient(135deg, var(--tech-gold), #ff9500);
}

.membership-level {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.level-free {
  color: rgba(255, 255, 255, 0.6);
}

.level-silver {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.level-gold {
  background: linear-gradient(135deg, var(--tech-gold), #ff9500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.membership-expire,
.membership-remaining {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.transactions-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: rgba(0, 242, 255, 0.3);
  background: rgba(0, 242, 255, 0.05);
  color: white;
}

.filter-btn-active {
  border-color: var(--tech-blue);
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.1), rgba(189, 0, 255, 0.1));
  color: white;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.transaction-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(5px);
}

.transaction-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.transaction-icon.recharge {
  background: rgba(0, 242, 255, 0.1);
  color: var(--tech-blue);
}

.transaction-icon.purchase {
  background: rgba(247, 37, 133, 0.1);
  color: var(--tech-pink);
}

.transaction-icon.refund {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.transaction-icon.reward {
  background: rgba(114, 9, 183, 0.1);
  color: var(--tech-purple);
}

.transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-description {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.transaction-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.transaction-amount {
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.amount-positive {
  color: var(--tech-blue);
}

.amount-negative {
  color: var(--tech-pink);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(0, 242, 255, 0.1);
  border-color: var(--tech-blue);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

@media (max-width: 768px) {
  .wallet-page {
    padding: 1.5rem 0;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2.25rem;
  }

  .page-header p {
    font-size: 1.1rem;
  }

  .wallet-overview {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-buttons {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 1.75rem;
  }

  .page-header p {
    font-size: 1rem;
  }

  .balance-card,
  .membership-card {
    padding: 1.5rem;
  }

  .amount {
    font-size: 2.25rem;
  }
}
</style>
