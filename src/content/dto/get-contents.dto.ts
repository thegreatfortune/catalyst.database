import { Type } from "class-transformer"
import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator"
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

    @IsNumber()
    @Type(() => Number)
    limit: number

    @IsNumber()
    @Type(() => Number)
    page: number

    @IsString()
    @IsEnum(['asc', 'desc'])
    sort: 'asc' | 'desc'

    @IsEnum(SortType)
    sortType: SortType
}
