import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common'
import { CreditService } from './credit.service'
import { UploadMediaCreditAndFundsDto } from './dto/upload-media-credit-and-funds'


@Controller('credit')
export class CreditController {
    constructor(
        private readonly creditService: CreditService
    ) { }

    @Patch('upload-media')
    async uploadMediaCreditAndFunds(@Body() umcafDto: UploadMediaCreditAndFundsDto) {
        try {
            return this.creditService.uploadMediaCreditAndFunds(umcafDto)
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to upload media: ${error.message}`)
        }
    }

    @Get(':userId')
    async getCredit(@Param('userId') userId: string) {
        try {
            return this.creditService.findByUserId(userId)
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get credit by user id: ${error.message}`)
        }
    }
}
