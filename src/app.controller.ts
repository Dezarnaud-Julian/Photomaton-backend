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
import { CodeService } from './code.service';
import { networkInterfaces } from 'os';
import { exec } from 'child_process';
const fsCredits = require('fs').promises;

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
    private readonly printService: PrintService,
    private readonly codeService: CodeService,
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
      throw new BadRequestException({
        message: 'Erreur lors de l’impression',
        details: err.message || 'Un problème est survenu avec l’imprimante.',
      });
    }
  }

  @Post('checkCode')
  async checkCode(@Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Code is required');
    }

    const result = this.codeService.checkCode(code);
    return { message: result };
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

  @Get('ip')
  getIPs() {
    const nets = networkInterfaces();
    const results: Record<string, string[]> = {};

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
        if (net.family === familyV4Value && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
        }
      }
    }

    return results;
  }

  @Post('cupsenable')
  async cupsenable() {
    const printerName = 'DP-QW410';

    // // Supprimer tous les travaux d'impression de la file d'attente
    // exec(`sudo -E cancel -a ${printerName}`, (err, output) => {
    //   if (err) {
    //     console.error('Failed to clear the print queue: ', err);
    //     return;
    //   }
    //   console.log(`Cleared print queue for ${printerName}:`, output);
    
    //   exec(`sudo -E cupsenable ${printerName}`, (err, output) => {
    //     if (err) {
    //       console.error('Failed to enable the printer: ', err);
    //       return;
    //     }
    //     console.log(`Printer ${printerName} enabled successfully:`, output);
    //   });
    // });
    
    exec(`sudo -E cupsenable ${printerName}`, (err, output) => {
      if (err) {
        console.error('Failed to enable the printer: ', err);
        return;
      }
      console.log(`Printer ${printerName} enabled successfully:`, output);
    });

  }

  @Get('credits')
    async getCredits() {
      try {
        const data = await fsCredits.readFile('src/compteur.txt', 'utf8');
        return parseInt(data, 10);
      } catch (err) {
        console.error('Error reading compteur.txt:', err);
        throw new BadRequestException('Failed to read copies count');
      }
    }
}
