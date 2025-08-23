import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

/**
 * 过滤敏感数据的拦截器
 * 主要用于过滤用户数据中的敏感字段，如 refreshTokens 和社交账号的 token 信息
 */
@Injectable()
export class SensitiveDataInterceptor implements NestInterceptor {
    /**
     * 拦截并处理响应数据
     * @param context 执行上下文
     * @param next 调用处理器
     * @returns 处理后的响应数据
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                // console.log('data', data)
                const filteredData = this.filterSensitiveData(data)
                // console.log('filteredData', filteredData)
                return filteredData
            }),
        )
    }

    /**
     * 过滤敏感数据
     * @param data 响应数据
     * @returns 过滤后的数据
     */
    private filterSensitiveData(data: any): any {
        // 如果数据为空，直接返回
        if (!data) {
            return data
        }

        // 如果是数组，递归处理每个元素
        if (Array.isArray(data)) {
            return data.map(item => this.filterSensitiveData(item))
        }

        // 如果是用户对象，过滤敏感字段
        if (this.isUserObject(data)) {
            return this.filterUserData(data)
        }

        // 如果是普通对象，递归处理每个属性
        if (typeof data === 'object' && data !== null) {
            const result = { ...data }
            for (const key in result) {
                if (Object.prototype.hasOwnProperty.call(result, key)) {
                    result[key] = this.filterSensitiveData(result[key])
                }
            }
            return result
        }

        // 其他类型直接返回
        return data
    }

    /**
     * 判断对象是否为用户对象
     * @param obj 待判断的对象
     * @returns 是否为用户对象
     */
    private isUserObject(obj: any): boolean {
        // 检查对象是否具有用户对象的特征属性
        return (
            obj &&
            typeof obj === 'object' &&
            'walletAddress' in obj &&
            'chainId' in obj &&
            (('_id' in obj) || ('id' in obj)) &&
            ('isActive' in obj)
        )
    }

    /**
     * 过滤用户数据中的敏感字段
     * @param user 用户对象
     * @returns 过滤后的用户对象
     */
    private filterUserData(user: any): any {
        // console.log('过滤前的用户对象字段:', Object.keys(user))

        // 检查是否为 Mongoose 文档对象
        if (user.toObject && typeof user.toObject === 'function') {
            // 转换为普通 JavaScript 对象
            const plainUser = user.toObject()

            // 创建新对象，排除敏感字段
            const { refreshTokens, socialAccountTokenStates, ...filteredUser } = plainUser

            // console.log('过滤后的用户对象字段:', Object.keys(filteredUser))
            return filteredUser
        } else {
            // 已经是普通对象，使用解构赋值排除敏感字段
            const { refreshTokens, socialAccountTokenStates, ...filteredUser } = user

            // console.log('过滤后的用户对象字段:', Object.keys(filteredUser))
            return filteredUser
        }
    }
}
