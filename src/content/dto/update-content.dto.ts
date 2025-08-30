// src/database/dto/update-content.dto.ts
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ContentAttribute, ContentStatus, ContentType, Metrics } from '../../schemas/content.schema'
import { SocialProvider } from '../../schemas/user.schema'
import { Type } from 'class-transformer'

export class PublishContentDto {
  @IsString()
  @IsNotEmpty()
  contentId: string

  @IsString()
  @IsNotEmpty()
  providerContentId: string
}

export class UpdateMetricsDto {
  @IsString()
  @IsNotEmpty()
  contentId: string

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Metrics)
  metrics: Metrics
}