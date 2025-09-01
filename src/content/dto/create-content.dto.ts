// src/database/dto/create-content.dto.ts
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ContentAttribute, ContentStatus, ContentType } from '../../schemas/content.schema'
import { SocialProvider } from '../../schemas/user.schema'

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

export class PublicMetricsDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  likes: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shares: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  comments: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  views: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  saves: number
}

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  miningUserId: string

  @IsBoolean()
  @IsOptional()
  isNative?: boolean

  @IsEnum(ContentType)
  @IsNotEmpty()
  contentType: ContentType

  @IsArray()
  @ValidateNested({ each: true })
  contentAttributes: ContentAttribute[]

  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider


  @IsString()
  @IsOptional()
  providerContentId?: string

  @IsString()
  @IsNotEmpty()
  originalContent: string

  @IsString()
  @IsOptional()
  generatedContent?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => PublicMetricsDto)
  publicMetrics?: PublicMetricsDto
}

