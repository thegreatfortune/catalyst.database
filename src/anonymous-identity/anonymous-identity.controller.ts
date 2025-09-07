import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Post } from '@nestjs/common'
import { AnonymousIdentityService } from './anonymous-identity.service'
import { UpdateAnonymousIdentityDto } from './dto/update-anonymous-identity.dto'

@Controller('user/anonymous-identity')
export class AnonymousIdentityController {
    constructor(
        private readonly anonymousIdentityService: AnonymousIdentityService
    ) { }

    @Post()
    async updateAnonymousIdentities(@Body() uaiDto: UpdateAnonymousIdentityDto) {
        try {
            return this.anonymousIdentityService.update(uaiDto)
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to update anonymous identities for user ${uaiDto.userId}!`)
        }
    }

    @Get(':userId')
    async getAnonymousIdentities(@Param('userId') userId: string) {
        try {
            return this.anonymousIdentityService.findByUserId(userId)
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get anonymous identities for user ${userId}!`)
        }
    }
}
