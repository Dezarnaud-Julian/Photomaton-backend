import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailService } from './mail'; // Met à jour l'import pour le service
import { PrintService } from './print';
import { ConfigModule } from '@nestjs/config';
import { ImagesController } from './images/images.controller';
import { ImagesModule } from './images/images.module';
import { CodeService } from './code.service';


@Module({
  imports: [ConfigModule.forRoot(), ImagesModule],
  controllers: [AppController, ImagesController],
  providers: [AppService, MailService, PrintService, CodeService],
})
export class AppModule {}
