// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  
  // Habilitar CORS para React Native
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  });
  
  await app.listen(4000, '0.0.0.0');
  console.log('🚀 Backend corriendo en http://localhost:4000');
  console.log('🌐 Backend accesible en http://192.168.1.13:4000');
}
bootstrap();