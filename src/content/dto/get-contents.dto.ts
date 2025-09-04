import { Type } from "class-transformer"
import { IsEnum, IsNumber, IsString } from "class-validator"

export enum SortType {
    createdAt,
    retweetsCount,
    replyCount,
    likeCount,
    quoteCount,
    bookmarkCount,
    impressionCount,
    anonComments,
}

export class GetContentsDto {
    @IsNumber()
    @Type(() => Number)
    limit: number

    @IsNumber()
    @Type(() => Number)
    page: number

    @IsString()
    sort: 'asc' | 'desc'

    @IsEnum(SortType)
    sortType: SortType
}
