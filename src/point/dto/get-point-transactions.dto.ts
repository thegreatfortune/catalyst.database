import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { TransactionType } from '../../schemas/point.schema'

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

export class GetPointTransactionsDto {
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    userId: string

    @IsOptional()
    @IsString()
    @IsEnum(TransactionType)
    transactionType?: TransactionType

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number = 10

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC

    @IsOptional()
    sortBy?: string = 'createdAt'
}
