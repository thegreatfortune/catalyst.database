import { Controller, Get, InternalServerErrorException, NotFoundException, Param, Query } from '@nestjs/common'
import { PointService } from './point.service'
import { GetPointTransactionsDto } from './dto/get-point-transactions.dto'
import { PointTransaction } from '../schemas/point.schema'
import { GetPointTransactionsResponseDto } from './dto/get-point-transactions-response.dto'

@Controller('user/points-transaction')
export class PointController {

    constructor(
        private readonly pointService: PointService
    ) { }

    @Get()
    async getPointTransactions(@Query() gptDto: GetPointTransactionsDto): Promise<GetPointTransactionsResponseDto> {
        try {
            return this.pointService.getPointTransactions(gptDto)
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get points transactions by user id: ${error.message}`)
        }

    }

    @Get(':id')
    async getPointTransactionsById(@Param('id') id: string): Promise<PointTransaction> {
        return this.pointService.getPointTransaction(id)
    }
}
