// src/database/dto/create-content.dto.ts
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PlatformDataDto {
  @IsOptional()
  twitter?: {
    tweetThreadId?: string;
    pollOptions?: string[];
    sensitiveContent?: boolean;
  };

  @IsOptional()
  instagram?: {
    carousel?: boolean;
    filters?: string[];
    location?: Record<string, any>;
    taggedUsers?: string[];
  };

  @IsOptional()
  xiaohongshu?: {
    topics?: string[];
    goodsLinks?: string[];
    collectionId?: string;
  };

  @IsOptional()
  facebook?: {
    privacy?: string;
    feelingActivity?: Record<string, any>;
    taggedPeople?: string[];
  };
}

export class MediaItemDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  storageProvider: string;

  @IsString()
  originalFilename: string;

  @IsString()
  mimeType: string;

  @IsOptional()
  size?: number;

  @IsOptional()
  dimensions?: {
    width: number;
    height: number;
  };

  @IsOptional()
  duration?: number;

  @IsOptional()
  thumbnailUrl?: string;

  @IsOptional()
  alt?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  status: string;
}

export class CreateContentDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['tweet', 'comment', 'reply', 'post', 'story'])
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsOptional()
  originalQuery?: string;

  @IsString()
  @IsNotEmpty()
  generatedContent: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsMongoId()
  @IsOptional()
  rootId?: string;

  @IsOptional()
  level?: number;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsString()
  @IsOptional()
  externalUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PlatformDataDto)
  platformData?: PlatformDataDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media?: MediaItemDto[];

  @IsOptional()
  analysis?: {
    sentiment?: string;
    topics?: string[];
    keywords?: string[];
    contentQuality?: {
      score: number;
      feedback: string;
    };
    moderationResults?: {
      flags: string[];
      safetyScore: number;
    };
  };

  @IsEnum(['draft', 'published', 'scheduled', 'failed'])
  @IsOptional()
  status?: string = 'draft';

  @IsOptional()
  scheduledTime?: Date;
}
