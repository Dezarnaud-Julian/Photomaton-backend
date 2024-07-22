import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailService } from './mail'; // Met à jour l'import pour le service
import { PrintService } from './print';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, MailService, PrintService],
})
export class AppModule {}
