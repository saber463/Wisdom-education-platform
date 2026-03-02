<template>
  <div class="recharge-modal-overlay" @click.self="handleClose">
    <div class="recharge-modal">
      <div class="modal-header">
        <h3>账户充值</h3>
        <button class="close-btn" @click="handleClose">
          <i class="fa fa-times" />
        </button>
      </div>

      <div class="modal-body">
        <div class="amount-options">
          <button
            v-for="option in amountOptions"
            :key="option.value"
            class="amount-option"
            :class="{ 'amount-option-selected': selectedAmount === option.value }"
            @click="selectedAmount = option.value"
          >
            <div class="option-amount">¥{{ option.value }}</div>
            <div v-if="option.bonus" class="option-bonus">+¥{{ option.bonus }}</div>
            <div v-if="option.tag" class="option-tag">{{ option.tag }}</div>
          </button>
        </div>

        <div class="custom-amount">
          <label>自定义金额</label>
          <div class="input-wrapper">
            <span class="currency-symbol">¥</span>
            <input
              v-model="customAmount"
              type="number"
              min="1"
              max="10000"
              placeholder="请输入充值金额"
              @focus="selectedAmount = null"
            />
          </div>
        </div>

        <div class="payment-methods">
          <label>支付方式</label>
          <div class="payment-options">
            <button
              v-for="method in paymentMethods"
              :key="method.id"
              class="payment-option"
              :class="{ 'payment-option-selected': selectedPayment === method.id }"
              @click="selectedPayment = method.id"
            >
              <i :class="method.icon" />
              <span>{{ method.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="total-amount">
          <span>充值金额：</span>
          <span class="amount">¥{{ finalAmount }}</span>
        </div>
        <button class="confirm-btn" :disabled="!canConfirm || processing" @click="handleConfirm">
          {{ processing ? '处理中...' : '确认充值' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import api from '@/utils/api';

const emit = defineEmits(['close', 'recharge']);

const selectedAmount = ref(null);
const customAmount = ref('');
const selectedPayment = ref('alipay');
const processing = ref(false);

const amountOptions = [
  { value: 10, tag: '新手推荐' },
  { value: 30, bonus: 3, tag: '热门' },
  { value: 50, bonus: 8 },
  { value: 100, bonus: 20, tag: '超值' },
  { value: 200, bonus: 50 },
  { value: 500, bonus: 150, tag: '最划算' },
];

const paymentMethods = [
  { id: 'alipay', name: '支付宝', icon: 'fa fa-alipay' },
  { id: 'wechat', name: '微信支付', icon: 'fa fa-weixin' },
];

const finalAmount = computed(() => {
  if (selectedAmount.value) {
    const option = amountOptions.find(o => o.value === selectedAmount.value);
    return option ? option.value + (option.bonus || 0) : selectedAmount.value;
  }
  return customAmount.value || 0;
});

const canConfirm = computed(() => {
  const amount = selectedAmount.value || parseFloat(customAmount.value);
  return amount && amount >= 1 && amount <= 10000;
});

const handleClose = () => {
  emit('close');
};

const handleConfirm = async () => {
  if (!canConfirm.value) return;

  processing.value = true;

  try {
    const amount = selectedAmount.value || parseFloat(customAmount.value);
    
    const response = await api.post('/wallet/recharge', {
      amount: amount,
      description: `账户充值 - ${paymentMethods.find(m => m.id === selectedPayment.value)?.name}`,
    });

    if (response.success) {
      emit('recharge', {
        amount: amount,
        balance: response.data.balance,
        transaction: response.data.transaction,
      });
    } else {
      throw new Error(response.message || '充值失败');
    }
  } catch (error) {
    console.error('充值失败:', error);
    alert(error.response?.data?.message || error.message || '充值失败，请稍后重试');
  } finally {
    processing.value = false;
  }
};
</script>

<style scoped>
.recharge-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.recharge-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(247, 37, 133, 0.1);
  border-color: var(--tech-pink);
  color: var(--tech-pink);
}

.modal-body {
  padding: 1.5rem;
}

.amount-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.amount-option {
  position: relative;
  padding: 1rem 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.amount-option:hover {
  border-color: rgba(0, 242, 255, 0.3);
  background: rgba(0, 242, 255, 0.05);
  transform: translateY(-2px);
}

.amount-option-selected {
  border-color: var(--tech-blue);
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.1), rgba(189, 0, 255, 0.1));
  box-shadow: 0 4px 16px rgba(0, 242, 255, 0.2);
}

.option-amount {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
}

.option-bonus {
  color: var(--tech-gold);
  font-size: 0.875rem;
  font-weight: 600;
}

.option-tag {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 2px 8px;
  background: linear-gradient(135deg, var(--tech-pink), var(--tech-purple));
  border-radius: 10px;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
}

.custom-amount {
  margin-bottom: 1.5rem;
}

.custom-amount label {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.25rem;
  font-weight: 600;
}

.input-wrapper input {
  width: 100%;
  padding: 1rem 1rem 1rem 2.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--tech-blue);
  background: rgba(0, 242, 255, 0.05);
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.payment-methods {
  margin-bottom: 1.5rem;
}

.payment-methods label {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.payment-option {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.payment-option:hover {
  border-color: rgba(0, 242, 255, 0.3);
  background: rgba(0, 242, 255, 0.05);
}

.payment-option-selected {
  border-color: var(--tech-blue);
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.1), rgba(189, 0, 255, 0.1));
}

.payment-option i {
  font-size: 1.5rem;
}

.payment-option span {
  color: white;
  font-weight: 600;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.total-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
}

.total-amount .amount {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.confirm-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 242, 255, 0.3);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .recharge-modal {
    width: 95%;
  }

  .amount-options {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-header h3 {
    font-size: 1.25rem;
  }
}
</style>
