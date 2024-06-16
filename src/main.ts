import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config'; // Charger les variables d'environnement


declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Activer CORS
  await app.listen(3001);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();