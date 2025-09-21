import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { CreditTransactionType } from '../../schemas/credit.schema'
import { SortType } from 'src/content/dto/get-contents.dto'

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

export class GetCreditTransactionsDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string

    @IsOptional()
    @IsString()
    @IsEnum(CreditTransactionType)
    transactionType?: CreditTransactionType

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
