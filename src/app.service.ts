// AppService.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

@Injectable()
export class AppService {
  shutdownMachine() {
    exec('sudo shutdown now', (err, output) => {
      // once the command has completed, the callback function is called
      if (err) {
          // log and return if we encounter an error
          console.error("could not execute command: ", err)
          return
      }
      // log the output received from the command
      console.log("Output: \n", output)
    })
  }
  rebootMachine() {
    exec('sudo reboot now', (err, output) => {
      // once the command has completed, the callback function is called
      if (err) {
          // log and return if we encounter an error
          console.error("could not execute command: ", err)
          return
      }
      // log the output received from the command
      console.log("Output: \n", output)
    })
  }
  getHello(): string {
    return 'Hello World!';
  }
  async saveFile(file: Express.Multer.File, mode: string): Promise<string> {
    try {
      var moment = require('moment');
      moment().format('yyyy-mm-dd:hh:mm:ss');
      const uploadPath = path.join(__dirname, '..', 'capturesImages');
      const filePath = path.join(uploadPath, moment()+mode);
      
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

  closeWindow() {
    if (process.env.IS_ELECTRON) {
      const { BrowserWindow } = require('electron');
      const win = BrowserWindow.getFocusedWindow();
      if (win) win.close();
    } else {
      exec('killall node', (error, stdout, stderr) => {
        if (error) {
          console.error(`Erreur lors de la fermeture de l'application : ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Erreur lors de l'exécution : ${stderr}`);
          return;
        }
        console.log('Application fermée avec succès');
      });
    }
  }
}