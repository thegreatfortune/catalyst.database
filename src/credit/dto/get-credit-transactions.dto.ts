import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { TransactionType } from '../../schemas/credit.schema'
import { SortType } from 'src/content/dto/get-contents.dto'

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

export class GetCreditTransactionsDto {
    @IsOptional()
    @IsString()
    @IsEnum(TransactionType)
    transactionType?: TransactionType

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page: number

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit: number

    @IsNotEmpty()
    @IsEnum(SortOrder)
    sortOrder: SortOrder

    @IsNotEmpty()
    @IsEnum(SortType)
    sortType: SortType
}
