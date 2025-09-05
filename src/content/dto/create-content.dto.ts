// src/database/dto/create-content.dto.ts
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ContentAttribute, ContentStatus, ContentType, Metrics, PublicMetrics } from '../../schemas/content.schema'
import { SocialProvider } from '../../schemas/user.schema'
import { RawTweet } from './update-content.dto'

export class ProviderDataDto {
  @IsOptional()
  twitter?: {
    tweetThreadId?: string
    pollOptions?: string[]
    sensitiveContent?: boolean
  }

  @IsOptional()
  instagram?: {
    carousel?: boolean
    filters?: string[]
    location?: Record<string, any>
    taggedUsers?: string[]
  }

  @IsOptional()
  xiaohongshu?: {
    topics?: string[]
    goodsLinks?: string[]
    collectionId?: string
  }

  @IsOptional()
  facebook?: {
    privacy?: string
    feelingActivity?: Record<string, any>
    taggedPeople?: string[]
  }
}

export class MediaItemDto {
  @IsString()
  @IsNotEmpty()
  type: string

  @IsString()
  @IsNotEmpty()
  url: string

  @IsString()
  @IsNotEmpty()
  storageProvider: string

  @IsString()
  originalFilename: string

  @IsString()
  mimeType: string

  @IsOptional()
  size?: number

  @IsOptional()
  dimensions?: {
    width: number
    height: number
  }

  @IsOptional()
  duration?: number

  @IsOptional()
  thumbnailUrl?: string

  @IsOptional()
  alt?: string

  @IsOptional()
  metadata?: Record<string, any>

  @IsString()
  @IsNotEmpty()
  status: string
}


export class PublicMetricsDto implements PublicMetrics {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  retweet_count: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reply_count: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  like_count: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quote_count: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bookmark_count: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  impression_count: number
}

export class CreateContentDto {
  @IsOptional()
  @IsMongoId()
  userId?: string

  @IsOptional()
  @IsMongoId()
  contributorId?: string

  @IsNotEmpty()
  @IsEnum(SocialProvider)
  provider: SocialProvider

  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType: ContentType

  @IsNotEmpty()
  @IsArray()
  @IsEnum(ContentAttribute, { each: true })
  contentAttributes: ContentAttribute[]

  @IsNotEmpty()
  @IsString()
  originalContent: string

  @IsOptional()
  @IsString()
  aiGeneratedContent?: string

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => PublicMetricsDto)
  // publicMetrics?: PublicMetricsDto

  // @IsOptional()
  // @IsString()
  // rawId?: string

  // @IsOptional()
  // @Type((options) => {
  //   // 手动根据顶级 provider 选择类型
  //   const provider = options?.object?.provider
  //   if (provider === SocialProvider.X) return RawTweet
  //   return Object
  // })
  // raw?: RawTweet
}

