import { ref, computed } from 'vue';
import { LearningPathLogger } from '@/utils/learningPathLogger';

export function useLearningPathForm() {
  const isFormTouched = ref(false);
  const customErrorMsg = ref('');

  const isFormValid = computed(() => {
    const goal = ref('');
    const days = ref(30);

    const basicValid =
      goal.value.trim() !== '' &&
      Number.isInteger(days.value) &&
      days.value >= 1 &&
      days.value <= 180;
    const thirtyDaysValid = !goal.value.includes('30天') || days.value >= 30;
    const computerLevelOneValid = !goal.value.includes('20天通过计算机一级');

    const isValid = basicValid && thirtyDaysValid && computerLevelOneValid;

    if (!isValid) {
      let validationError = '';
      if (!basicValid) {
        validationError = !goal.value.trim()
          ? '学习目标不能为空'
          : !Number.isInteger(days.value)
            ? '天数必须为整数'
            : '天数必须在1-180之间';
      } else if (!thirtyDaysValid) {
        validationError = '30天目标时天数不能小于30天';
      } else if (!computerLevelOneValid) {
        validationError = '不支持20天通过计算机一级的目标';
      }

      LearningPathLogger.logValidationFailed({
        goal: goal.value,
        days: days.value,
        validationError,
      });
    }

    return isValid;
  });

  const updateCustomErrorMsg = (goal, days) => {
    if (goal.includes('30天') && days < 30) {
      customErrorMsg.value = '30天目标时天数不能小于30天';
    } else if (goal.includes('20天通过计算机一级')) {
      customErrorMsg.value = '不支持20天通过计算机一级的目标';
    } else {
      customErrorMsg.value = '';
    }
  };

  const daysInputClass = computed(() => {
    const goal = ref('');
    const hasError =
      !isFormValid.value &&
      (goal.value.includes('30天') || goal.value.includes('20天通过计算机一级'));
    return {
      error: hasError,
    };
  });

  return {
    isFormTouched,
    customErrorMsg,
    isFormValid,
    daysInputClass,
    updateCustomErrorMsg,
  };
}
