import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailService } from './mail'; // Met à jour l'import pour le service


@Module({
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
