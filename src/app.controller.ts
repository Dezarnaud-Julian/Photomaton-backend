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
import { PrintService } from './print';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService, // Injecte le service de mail
    private readonly printService: PrintService,
  ) {}

  @Get()
  hello() {
    return 'hello';
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('mode') mode: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const filePath = await this.appService.saveFile(file, mode);
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

  @Post('print')
  //filepath et copies
  async print(
    @Body('filePath') filePath: string,
    @Body('copies') copies: number,
    @Body('format') format: string,
    @Body('frame') frame: string,
  ) {
    if (!filePath || !copies) {
      throw new BadRequestException('Missing file path or copies');
    }

    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('File does not exist');
      }

      const printed = await this.printService.print(
        filePath,
        copies,
        format,
        frame,
      );
    } catch (err) {
      console.error('Error printing file:', err);
      throw new BadRequestException(err.message);
    }
  }

  @Post('updateCopies')
  async updateCopies(@Body('copies') copies: number) {
    console.log('Updating copies count:', copies);
    if (isNaN(copies) || copies <= 0) {
      throw new BadRequestException('Invalid number of copies');
    }

    try {
      await this.printService.updateCopiesCount(copies);
      return { message: 'Copies count updated successfully' };
    } catch (err) {
      console.error('Error updating copies count:', err);
      throw new BadRequestException('Failed to update copies count');
    }
  }

  @Post('reboot')
  async reboot() {
    console.log('Reboot');
    this.appService.rebootMachine();
  }

  @Post('shutdown')
  async shutdown() {
    console.log('shutdown');
    this.appService.shutdownMachine();
  }

  @Post('quit')
  async quitApplication() {
    console.log('Quit Application');
    this.appService.closeWindow();
  }
  
  
}
