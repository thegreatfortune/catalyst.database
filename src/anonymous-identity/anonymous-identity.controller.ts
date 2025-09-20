import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Patch, Post } from '@nestjs/common'
import { AnonymousIdentityService } from './anonymous-identity.service'
import { UpdateAnonymousIdentityDto } from './dto/update-anonymous-identity.dto'
import { AddAnonymousIdentityDto } from './dto/add-anonymous-identity.dto'
import { AnonymousIdentity } from '../schemas/anonymout-identity.schema'


@Controller('user/anonymous-identity')
export class AnonymousIdentityController {
    constructor(
        private readonly anonymousIdentityService: AnonymousIdentityService
    ) { }

    @Post()
    async addAnonymousIdentities(@Body() aaiDto: AddAnonymousIdentityDto): Promise<AnonymousIdentity> {
        try {
            return this.anonymousIdentityService.add(aaiDto)
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to add anonymous identities for user ${aaiDto.userId}!`)
        }
    }

    @Patch()
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

    @Get(':userId/:anonId')
    async getAnonymousIdentity(@Param('userId') userId: string, @Param('anonId') anonId: string): Promise<AnonymousIdentity> {
        try {
            return await this.anonymousIdentityService.findByUserId(userId, anonId) as AnonymousIdentity
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get anonymous identities for user ${userId}!`)
        }
    }

    @Get(':userId')
    async getAnonymousIdentities(@Param('userId') userId: string): Promise<AnonymousIdentity[]> {
        try {
            return await this.anonymousIdentityService.findByUserId(userId) as AnonymousIdentity[]
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException(`Failed to get anonymous identities for user ${userId}!`)
        }
    }


}
