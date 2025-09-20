import { FundsTransaction } from "../../schemas/funds.schema"

export interface GetFundsTransactionsResponseDto {
    /**
     * 当前页的数据
     */
    items: FundsTransaction[]

    /**
     * 总记录数
     */
    total: number

    /**
     * 当前页码
     */
    page: number

    /**
     * 每页记录数
     */
    limit: number

    /**
     * 总页数
     */
    totalPages: number

    /**
     * 是否有下一页
     */
    hasNextPage: boolean

    /**
     * 是否有上一页
     */
    hasPreviousPage: boolean
}

export interface GetTransactionByTxHashResponseDto {
    transaction: FundsTransaction | null
}
