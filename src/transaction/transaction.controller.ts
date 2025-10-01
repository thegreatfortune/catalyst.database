import { BadRequestException, Controller, Get, InternalServerErrorException, NotFoundException, Query } from '@nestjs/common'
import { GetTransactionsDto } from './dto/get-transactions.dto'
import { TransactionService } from './transaction.service'

@Controller('transaction')
export class TransactionController {
    constructor(
        private readonly transactionService: TransactionService
    ) { }


    @Get()
    async getTransactionsByUserId(@Query() gctDto: GetTransactionsDto) {
        try {
            return this.transactionService.getTransactionsByUserId(gctDto)
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get transactions by user id: ${error.message}`)
        }
    }

}
