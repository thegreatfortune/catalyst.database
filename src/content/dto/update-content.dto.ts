// src/database/dto/update-content.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PublicMetricsDto } from './create-content.dto'

export class PublishContentDto {
  @IsString()
  @IsNotEmpty()
  contentId: string

  @IsString()
  @IsNotEmpty()
  providerContentId: string

  @IsOptional()
  @ValidateNested()
  @Type(() => PublicMetricsDto)
  publicMetrics?: PublicMetricsDto
}

export class MetricsDto {
  @IsNumber()
  @Type(() => Number)
  changedAnonComments: number
}

export class UpdateMetricsDto {
  @IsString()
  @IsNotEmpty()
  contentId: string

  @IsOptional()
  @ValidateNested()
  @Type(() => PublicMetricsDto)
  publicMetrics?: PublicMetricsDto

  @IsOptional()
  @ValidateNested()
  @Type(() => MetricsDto)
  metrics?: MetricsDto
}

