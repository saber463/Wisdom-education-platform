# 学习平台调试日志 - 2024年5月18日

## 问题1：前端请求URL包含"undefined"导致的代理错误

**错误表现：**
```
12:58:12 [vite] http proxy error: /api/v1/favorites/check/Tweet/undefined
AggregateError [ECONNREFUSED]: 
    at internalConnectMultiple (node:net:1134:18)
    at afterConnectMultiple (node:net:1715:7)
```

**问题原因：**
在`client/src/components/business/TweetCard.vue`文件中，`checkFavorite`函数在调用API时没有验证`tweet.value._id`是否存在，导致生成了包含"undefined"的URL。

**解决方案：**
在`checkFavorite`函数中添加ID存在性验证：
```javascript
async function checkFavorite() {
  if (!tweet.value?._id) {
    console.error('Tweet ID is undefined');
    return;
  }
  try {
    const res = await favoriteApi.check(tweet.value._id, 'Tweet');
    isFavorited.value = res.isFavorited;
  } catch (err) {
    console.error('检查收藏状态失败:', err);
  }
}
```

## 问题2：学习路径生成请求返回500错误

**错误表现：**
当用户输入"一个月拿下ACCA"时，学习路径生成请求返回500错误。

**问题原因：**
在`server/routes/ai.js`文件中，学习路径生成API直接使用`parseInt(days)`转换天数参数，但没有验证`days`是否为有效数字。当用户输入包含"一个月"这样的文本时，`parseInt`返回`NaN`，导致后续计算出错。

**解决方案：**
1. 添加输入验证和错误处理
2. 将"一个月"等非数字天数转换为30天
3. 统一使用经过验证的`daysNum`变量进行计算

```javascript
// 处理天数参数，将"一个月"转换为30天
let daysNum = parseInt(days);
if (isNaN(daysNum)) {
  if (days && (days.includes('月') || days.includes('一个月'))) {
    daysNum = 30;
  } else {
    return res.status(400).json({ error: '请提供有效的学习天数' });
  }
}
```

## 修复总结

1. **前端修复：**
   - 文件：`client/src/components/business/TweetCard.vue`
   - 问题：URL包含undefined
   - 修复：添加ID存在性验证

2. **后端修复：**
   - 文件：`server/routes/ai.js`
   - 问题：未处理非数字天数参数
   - 修复：添加输入验证，支持"一个月"等自然语言天数

## 测试结果

- ✅ TweetCard组件的收藏功能不再报错
- ✅ 学习路径生成API可以正确处理"一个月拿下ACCA"等请求
- ✅ 前端错误消息显示正常
- ✅ 后端服务运行稳定

## 后续建议

1. 增加更多自然语言天数的支持（如"一周"、"两周"等）
2. 完善前端表单验证，提前提示用户输入规范
3. 增加后端日志记录，便于排查问题