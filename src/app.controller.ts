import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MailService } from './mail'; // Met à jour l'import pour le service
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService, // Injecte le service de mail
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const filePath = await this.appService.saveFile(file);
      return { path: filePath };
    } catch (err) {
      console.error('Error saving file:', err);
      throw new BadRequestException('Failed to upload file');
    }
  }

  @Post('sendEmail')
  async sendEmail(
    @Body('filePath') filePath: string,
    @Body('email') email: string,
  ) {
    if (!filePath || !email) {
      throw new BadRequestException('Missing file path or email');
    }

    try {
      const attachment = {
        filename: path.basename(filePath),
        path: filePath,
      };

      const emailSent = await this.mailService.send({
        to: email,
        subject: 'Voici votre souvenir!',
        message: 'Merci et à bientôt!',
        attachments: [attachment],
      });

      if (!emailSent) {
        throw new BadRequestException('Failed to send email');
      }

      return { message: 'Email sent successfully' };
    } catch (err) {
      console.error('Error sending email:', err);
      throw new BadRequestException('Failed to send email');
    }
  }
}