
// 资金精度常量，用于金额转换
export const FUNDS_DECIMALS = 6  // 6位小数精度
export const FUNDS_MULTIPLIER = 1000000  // 10^6

/**
 * 资金金额转换工具类
 * 用于在实际金额（浮点数）和存储金额（整数）之间进行转换
 */
export class FundsConverter {
    /**
     * 将实际金额转换为存储金额（乘以10^6）
     * @param amount 实际金额（浮点数）
     * @returns 存储金额（整数）
     */
    static toStorageAmount(amount: number): number {
        return Math.round(amount * FUNDS_MULTIPLIER)
    }

    /**
     * 将存储金额转换为实际金额（除以10^6）
     * @param storageAmount 存储金额（整数）
     * @param decimals 显示的小数位数，默认为6
     * @returns 实际金额（浮点数），格式化为指定小数位
     */
    static toDisplayAmount(storageAmount: number, decimals: number = 6): string {
        return (storageAmount / FUNDS_MULTIPLIER).toFixed(decimals)
    }

    /**
     * 将存储金额转换为实际金额（除以10^6），返回数字类型
     * @param storageAmount 存储金额（整数）
     * @returns 实际金额（浮点数）
     */
    static toRealAmount(storageAmount: number): number {
        return storageAmount / FUNDS_MULTIPLIER
    }

    /**
     * 将字符串金额转换为存储金额
     * @param amountStr 金额字符串
     * @returns 存储金额（整数）
     */
    static fromString(amountStr: string): number {
        const amount = parseFloat(amountStr)
        if (isNaN(amount)) {
            throw new Error(`无效的金额字符串: ${amountStr}`)
        }
        return this.toStorageAmount(amount)
    }
}
