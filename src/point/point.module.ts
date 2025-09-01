import { Module } from '@nestjs/common'
import { PointController } from './point.controller'
import { PointService } from './point.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Point, PointSchema } from '../schemas/point.schema'
import { PointTransaction, PointTransactionSchema } from '../schemas/point.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Point.name, schema: PointSchema }]),
    MongooseModule.forFeature([{ name: PointTransaction.name, schema: PointTransactionSchema }]),
  ],
  controllers: [PointController],
  providers: [PointService],
  exports: [PointService]
})
export class PointModule { }
