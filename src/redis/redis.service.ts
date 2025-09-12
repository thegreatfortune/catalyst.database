import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { Redis } from '@upstash/redis'

@Injectable()
export class RedisService {
  private redis: Redis
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    // 在构造函数中初始化 Redis 客户端
    this.initRedisClient()
  }


  /**
   * 初始化 Redis 客户端
   */
  private async initRedisClient() {
    try {
      const url = this.configService.upstashRedisRestUrl
      const token = this.configService.upstashRedisRestToken

      if (!url || !token) {
        this.logger.error('Redis 配置不完整，无法初始化连接')
        return
      }

      this.redis = new Redis({ url, token })

      await this.redis.ping()
      this.logger.log('Redis 客户端已初始化')
    } catch (error) {
      this.logger.error('初始化 Redis 客户端失败', error)
    }
  }




  async get(key: string) {
    try {
      return await this.redis.get(key)
    } catch (error) {
      this.logger.error(`获取键 ${key} 的值失败`, error)
      return null
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.set(key, value, { ex: ttl })
      } else {
        await this.redis.set(key, value)
      }
    } catch (error) {
      this.logger.error(`设置键 ${key} 的值失败`, error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      this.logger.error(`删除键 ${key} 失败`, error)
    }
  }

  /**
   * 批量设置多个键值对
   * @param items 键值对数组 [{key, value, ttl}]
   */
  async mset(items: Array<{ key: string, value: any, ttl?: number }>): Promise<void> {
    try {
      // 由于 Upstash Redis 不直接支持带 TTL 的 MSET，我们需要使用 pipeline
      const pipeline = this.redis.pipeline()

      for (const item of items) {
        if (item.ttl) {
          pipeline.set(item.key, item.value, { ex: item.ttl })
        } else {
          pipeline.set(item.key, item.value)
        }
      }

      await pipeline.exec()
      this.logger.debug(`批量设置 ${items.length} 个键值对成功`)
    } catch (error) {
      this.logger.error(`批量设置键值对失败`, error)
    }
  }

  /**
   * 获取所有匹配模式的键
   * @param pattern 匹配模式
   * @returns 键数组
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern)
    } catch (error) {
      this.logger.error(`Failed to get keys matching pattern ${pattern}`, error)
      return []
    }
  }
}
