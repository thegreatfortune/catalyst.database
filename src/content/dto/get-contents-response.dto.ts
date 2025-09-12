import { SocialProvider } from "src/schemas/user.schema"
import { Content, ContentStatus, ContentType, Metrics, PublicMetrics } from "../../schemas/content.schema"

export interface GetContentsResponseDto {
    /**
     * 当前页的数据
     */
    items: Content[] | MyContentItem[]

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


export interface MyContentItem {
    id: string
    provider: SocialProvider
    originalContent: string
    aiGeneratedContent?: string
    contentType: ContentType
    metrics: Metrics
    publicMetrics: PublicMetrics
    rawId?: string
    createdAt: string
    updatedAt: string
    lastEditedTime: string
    publishedTime?: string
    status: ContentStatus
    contributorUsername?: string
    creditChange: number
}