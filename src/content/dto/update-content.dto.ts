// src/database/dto/update-content.dto.ts
import { IsBoolean, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PublicMetricsDto } from './create-content.dto'
import type { ApiV2Includes, TweetV2, TweetV2SingleResult } from 'twitter-api-v2'
import { ContentType } from '../../schemas/content.schema'
import { SocialProvider } from 'src/schemas/user.schema'

export class RawTweet implements Required<Pick<TweetV2SingleResult, 'data' | 'includes'>> {
  @IsNotEmpty()
  data: TweetV2

  @IsNotEmpty()
  includes: ApiV2Includes
}


export class PublishContentDto {
  @IsMongoId()
  @IsNotEmpty()
  contentId: string

  @IsMongoId()
  @IsOptional()
  contributorId?: string

  @IsString()
  @IsNotEmpty()
  rawId: string

  @IsBoolean()
  @IsNotEmpty()
  isReply: boolean

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiryTime?: Date
}

export class UpdateRawDto {

  @IsNotEmpty()
  @IsEnum(SocialProvider)
  provider: SocialProvider

  @IsNotEmpty()
  @IsMongoId()
  contributorId: string

  @IsNotEmpty()
  @Type((options) => {
    // 手动根据顶级 provider 选择类型
    const provider = options?.object?.provider
    if (provider === SocialProvider.X) return RawTweet
    return Object
  })
  raw: RawTweet
}