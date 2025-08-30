import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from './config/config.service'
import { SensitiveDataInterceptor } from './common/interceptors/sensitive-data.interceptor'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }))

  // 全局应用敏感数据拦截器
  app.useGlobalInterceptors(new SensitiveDataInterceptor())

  // 启动应用
  const port = configService.port
  await app.listen(port)
  console.log(`应用已启动，监听端口: ${port}`)
}
bootstrap()
