import { SocialProvider } from "src/schemas/user.schema"
import { Content, ContentStatus, ContentType, Metrics, PublicMetrics } from "../../schemas/content.schema"
import { TweetV2, ApiV2Includes, TweetV2SingleResult, UserV2 } from "twitter-api-v2"
import { XVerifiedType } from "../../schemas/social.schema"
export interface GetContentsResponseDto {
    /**
     * 当前页的数据
     */
    items: ContentItem[] | MyContentItem[]

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

export interface BaseItem {
    id: string
    provider: SocialProvider
    originalContent: string
    aiGeneratedContent?: string
    contentType: ContentType
    metrics: Metrics
    publicMetrics: PublicMetrics
    rawId?: string
    replyToTweetId?: string
    replyToRawUsername?: string

    createdAt: string
    updatedAt: string

    lastEditedTime: string
    publishedTime?: string
    status: ContentStatus
}

export interface ContentItem extends BaseItem {
    userId?: string
    // contributorId?: string
    raw?: {
        data: TweetV2
        includes: ApiV2Includes
    }
    contributor?: {
        // id: string
        username: string
        name: string
        profile_image_url?: string
        verified?: boolean
        verified_type?: XVerifiedType
    }
}


export interface MyContentItem extends BaseItem {
    contributorUsername?: string
    creditChange: number
}