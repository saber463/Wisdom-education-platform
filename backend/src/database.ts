/**
 * 数据库连接导出
 */

import { getPool } from './config/database.js';

export { getPool };
export const db = getPool();
