/**
 * 简单的基于内存的速率限制工具
 * 用于防止 Edge Functions 被滥用和 DDoS 攻击
 * 
 * 特点：
 * - 无需外部依赖（Redis）
 * - 边缘函数重启时自动重置
 * - 对正常用户透明
 */

interface RateLimitConfig {
  windowMs: number;      // 时间窗口（毫秒）
  maxRequests: number;   // 时间窗口内最大请求数
  identifier: string;    // 唯一标识符（通常是用户ID或IP）
}

interface RateLimitResult {
  allowed: boolean;      // 是否允许请求
  remaining: number;     // 剩余请求次数
  resetAt: number;       // 计数器重置时间（时间戳）
  retryAfter?: number;   // 建议重试等待秒数
}

interface RateLimitRecord {
  count: number;         // 当前计数
  resetAt: number;       // 重置时间戳
}

// 内存存储：边缘函数实例内共享，重启时清空
const requestCounts = new Map<string, RateLimitRecord>();

/**
 * 检查速率限制
 * 
 * @param config 速率限制配置
 * @returns 速率限制结果
 * 
 * @example
 * ```typescript
 * const result = checkRateLimit({
 *   windowMs: 15 * 60 * 1000,  // 15分钟
 *   maxRequests: 5,             // 最多5次
 *   identifier: `send-code:${userId}`
 * });
 * 
 * if (!result.allowed) {
 *   return new Response(
 *     JSON.stringify({ error: `请求过于频繁，请在 ${result.retryAfter} 秒后重试` }),
 *     { status: 429, headers: { 'Retry-After': result.retryAfter.toString() } }
 *   );
 * }
 * ```
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const key = config.identifier;
  const record = requestCounts.get(key);

  // 定期清理过期记录（避免内存泄漏）
  if (requestCounts.size > 10000) {
    cleanupExpiredRecords(now);
  }

  // 如果记录不存在或已过期，创建新记录
  if (!record || now > record.resetAt) {
    const resetAt = now + config.windowMs;
    requestCounts.set(key, { count: 1, resetAt });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt
    };
  }

  // 检查是否超过限制
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter
    };
  }

  // 增加计数
  record.count++;
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt
  };
}

/**
 * 清理过期的速率限制记录
 * 防止内存无限增长
 */
function cleanupExpiredRecords(now: number): void {
  const expiredKeys: string[] = [];
  
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => requestCounts.delete(key));
  
  if (expiredKeys.length > 0) {
    console.log(`[Rate Limit] Cleaned up ${expiredKeys.length} expired records`);
  }
}

/**
 * 创建标准的 429 错误响应
 * 
 * @param message 错误消息
 * @param retryAfter 重试等待秒数
 * @param corsHeaders CORS 头
 */
export function createRateLimitResponse(
  message: string,
  retryAfter: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      retryAfter,
      resetAt: new Date(Date.now() + retryAfter * 1000).toISOString()
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  );
}
