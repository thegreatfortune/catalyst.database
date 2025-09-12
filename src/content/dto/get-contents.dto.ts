import { Type } from "class-transformer"
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"
import { SocialProvider } from "../../schemas/user.schema"

export enum SortType {
    createdAt = 'createdAt',
    retweetsCount = 'retweetsCount',
    replyCount = 'replyCount',
    likeCount = 'likeCount',
    quoteCount = 'quoteCount',
    bookmarkCount = 'bookmarkCount',
    impressionCount = 'impressionCount',
    anonComments = 'anonComments',
}

export class GetContentsDto {

    @IsNotEmpty()
    @IsEnum(SocialProvider)
    provider: SocialProvider

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    limit: number

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    page: number

    @IsNotEmpty()
    @IsEnum(['asc', 'desc'])
    sort: 'asc' | 'desc'

    @IsNotEmpty()
    @IsEnum(SortType)
    sortType: SortType
}

export class GetMyContentsDto extends GetContentsDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string
}