import { BadRequestException, Controller, Get, InternalServerErrorException, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { CreditService } from './credit.service'
import { GetCreditTransactionsDto } from './dto/get-credit-transactions.dto'
import { CreditTransaction } from '../schemas/credit.schema'
import { GetCreditTransactionsResponseDto } from './dto/get-credit-transactions-response.dto'
import { GetCreditDto } from './dto/get-credit.dto'

@Controller('credit')
export class CreditController {

    constructor(
        private readonly creditService: CreditService
    ) { }


    @Get()
    async getCredit(@Query() gcDto: GetCreditDto) {
        const { userId } = gcDto
        try {
            return this.creditService.findByUserId(userId)
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get credit by user id: ${error.message}`)
        }
    }

    @Get('/:userId/transactions')
    async getCreditTransactionsById(@Param('userId') userId: string, @Query() gctDto: GetCreditTransactionsDto) {
        try {
            return this.creditService.findCreditTransactions(gctDto, userId)
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get credit transactions by user id: ${error.message}`)
        }
    }
}
