import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from './config/config.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // 启动应用
  const port = configService.port
  await app.listen(port)
  console.log(`应用已启动，监听端口: ${port}`)
}
bootstrap()
