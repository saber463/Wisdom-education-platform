import { ref, computed } from 'vue';
import { LearningPathLogger } from '@/utils/learningPathLogger';

export function useLearningPathForm() {
  const isFormTouched = ref(false);
  const customErrorMsg = ref('');

  // 表单数据 - 由父组件通过 updateFormState 更新
  const formState = ref({
    goal: '',
    days: 30,
  });

  const updateFormState = (goal, days) => {
    formState.value = { goal, days };
  };

  const isFormValid = computed(() => {
    const goal = formState.value.goal;
    const days = formState.value.days;

    const basicValid =
      goal.trim() !== '' &&
      Number.isInteger(days) &&
      days >= 1 &&
      days <= 180;
    const thirtyDaysValid = !goal.includes('30天') || days >= 30;
    const computerLevelOneValid = !goal.includes('20天通过计算机一级');

    const isValid = basicValid && thirtyDaysValid && computerLevelOneValid;

    if (!isValid && isFormTouched.value) {
      let validationError = '';
      if (!basicValid) {
        validationError = !goal.trim()
          ? '学习目标不能为空'
          : !Number.isInteger(days)
            ? '天数必须为整数'
            : '天数必须在1-180之间';
      } else if (!thirtyDaysValid) {
        validationError = '30天目标时天数不能小于30天';
      } else if (!computerLevelOneValid) {
        validationError = '不支持20天通过计算机一级的目标';
      }

      LearningPathLogger.logValidationFailed({
        goal,
        days,
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
    const goal = formState.value.goal;
    const hasError =
      !isFormValid.value &&
      (goal.includes('30天') || goal.includes('20天通过计算机一级'));
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
    updateFormState,
    formState,
  };
}
