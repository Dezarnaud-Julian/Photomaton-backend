// AppService.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    try {
      const uploadPath = path.join(__dirname, '..', 'capturesImages');
      const filePath = path.join(uploadPath, 'photo.jpg');
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      fs.writeFileSync(filePath, file.buffer);

      return filePath;
    } catch (err) {
      console.log('error', err);
      throw new BadRequestException('Failed to save file');
    }
  }

  async sendEmail(filePath: string, email: string) {
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File does not exist');
    }
    if (!email) {
      throw new BadRequestException('No email provided');
    }
    else{
      console.log('Email sent!', email);
    }
  }
}