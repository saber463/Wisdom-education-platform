import dayjs from 'dayjs';

// 格式化时间为“YYYY-MM-DD HH:mm”
export const formatDateTime = time => dayjs(time).format('YYYY-MM-DD HH:mm');

// 生成指定天数后的日期
export const getFutureDate = days => dayjs().add(days, 'day').format('YYYY-MM-DD');
