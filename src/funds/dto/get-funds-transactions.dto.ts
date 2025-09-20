import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { SortType } from 'src/content/dto/get-contents.dto'
import { FundsTransactionType } from 'src/schemas/funds.schema'

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

export class GetFundsTransactionsDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string

    @IsOptional()
    @IsString()
    @IsEnum(FundsTransactionType)
    transactionType?: FundsTransactionType

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page: number

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit: number

    @IsNotEmpty()
    @IsEnum(SortOrder)
    sortOrder: SortOrder
}
