const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
import { BadRequestException } from '@nestjs/common';
import { exec } from 'child_process';
import { join } from 'path';
import { degrees } from 'pdf-lib';
import { print as printWindows } from 'pdf-to-printer';
import { print as printUnix, getPrinters, isPrintComplete } from 'unix-print';
const { print } = require('pdf-to-printer');

export class PrintService {
  async readCopiesCount(): Promise<number> {
    try {
      const data = await fs.readFile('src/compteur.txt', 'utf8');
      return parseInt(data, 10);
    } catch (err) {
      console.error('Error reading compteur.txt:', err);
      throw new BadRequestException('Failed to read copies count');
    }
  }

  async updateCopiesCount(newCount: number): Promise<void> {
    try {
      console.log('Updating copies count to', newCount);
      await fs.writeFile('src/compteur.txt', newCount.toString(), 'utf8');
    } catch (err) {
      console.error('Error writing to compteur.txt:', err);
      throw new BadRequestException('Failed to update copies count');
    }
  }

  async optimizeImage(
    inputPath: string,
    outputPath: string,
    format: string,
  ): Promise<void> {
    let x = 3228;
    let y = 2160;
    if (format === 'MINIPOLAROID') {
      x = 720 / 2;
      y = 1080 / 2;
    }
    if (format === 'POLAROID') {
      x = 720;
      y = 720;
    }
    try {
      await sharp(inputPath)
        .resize(x, y, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
    } catch (err) {
      console.error('Error optimizing image:', err);
      throw new BadRequestException('Failed to optimize image');
    }
  }

  async convertJpgToPdf(
    jpgPath: string,
    pdfPath: string,
    format: string,
    frame: string,
  ) {
    const optimizedImagePath = jpgPath.replace(
      /\.(jpg|jpeg)$/i,
      '-optimized.jpg',
    );

    // Optimise l'image avant de l'incorporer dans le PDF
    await this.optimizeImage(jpgPath, optimizedImagePath, format);

    const pdfDoc = await PDFDocument.create();
    const jpgImageBytes = await fs.readFile(optimizedImagePath);
    const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);

    if (format === 'POLAROID') {
      const pdfWidth = 288;
      const pdfHeight = 216;

      const imgWidth = jpgImage.width / 4;
      const imgHeight = jpgImage.height / 4;

      const x = ((pdfWidth - imgWidth) / 2) * 3;
      const y = pdfHeight - imgHeight - x + 180;

      const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
      page.drawImage(jpgImage, {
        x: x,
        y: y,
        width: imgWidth,
        height: imgHeight,
      });

      if (frame !== 'NULL') {
        const frameBytes = await fs.readFile(
          join(__dirname, '..', 'client', 'frames/polaroid', frame + '.png'),
        );
        const frameImage = await pdfDoc.embedPng(frameBytes);

        const frameWidth = frameImage.width / 5;
        const frameHeight = frameImage.height / 5;

        page.drawImage(frameImage, {
          x: pdfWidth / 2,
          y: -25,
          width: frameWidth,
          height: frameHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(pdfPath, pdfBytes);
    } else if (format === 'MINIPOLAROID') {
      const pdfWidth = 288;
      const pdfHeight = 216;

      const imgWidth = jpgImage.width / 2.7;
      const imgHeight = jpgImage.height / 2.7;

      const x = ((pdfWidth - imgWidth) / 2) * 2.845 - 3;
      const y = pdfHeight - imgHeight + 25;

      const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
      page.drawImage(jpgImage, {
        x: x,
        y: y,
        width: imgWidth,
        height: imgHeight,
      });

      page.drawImage(jpgImage, {
        x: x - 144.5,
        y: y,
        width: imgWidth,
        height: imgHeight,
      });

      page.drawImage(jpgImage, {
        x: x - 288,
        y: y,
        width: imgWidth,
        height: imgHeight,
      });

      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(pdfPath, pdfBytes);
    } else {
      const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
      page.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: jpgImage.width,
        height: jpgImage.height,
      });
      page.setRotation(degrees(90));
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(pdfPath, pdfBytes);
    }
    try {
      await fs.unlink(optimizedImagePath);
    } catch (err) {
      console.error(`Error deleting the optimized image: ${err}`);
    }
  }

  async print(
    filePath: string,
    copiesRequested: number,
    format: string,
    frame: string,
  ) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg') {
      console.error('The file must be a .jpg or .jpeg image');
      throw new BadRequestException('The file must be a .jpg or .jpeg image');
    }

    const pdfPath = filePath.replace(/\.(jpg|jpeg)$/i, '.pdf');

    try {
      await this.convertJpgToPdf(filePath, pdfPath, format, frame);
    } catch (err) {
      console.error(`Error converting JPG to PDF: ${err}`);
      throw new BadRequestException('Failed to convert JPG to PDF');
    }

    const printer = 'DP-QW410';
    let copiesAvailable;

    try {
      copiesAvailable = await this.readCopiesCount();
      if (copiesAvailable <= 0) {
        console.error('No copies left to print');
        throw new BadRequestException('Veuillez changer le rouleau');
      }

      const copiesToPrint = Math.min(copiesRequested, copiesAvailable);

      if (format === 'POLAROID') {
        await this.updateCopiesCount(copiesAvailable - copiesToPrint / 2);
      } else {
        if (format === 'MINIPOLAROID') {
          await this.updateCopiesCount(copiesAvailable - copiesToPrint / 3);
        } else {
          await this.updateCopiesCount(copiesAvailable - copiesToPrint);
        }
      }

      // Launch cupsenable to be sure the printer is activated and ready to get the print order
      exec(`cupsenable ${printer}`, (err, output) => {
        if (err) {
          console.error('could not execute command: ', err);
          return;
        }
      });
      console.log(
        `Printing ${copiesToPrint} copies of ${pdfPath} on printer ${printer}`,
      );

      if (process.platform === 'win32') {
        // on windows
        const printPromises = [];
        for (let i = 0; i < copiesToPrint; i++) {
          printPromises.push(
            printWindows(pdfPath, { printer })
              .then(() => console.log(`Printed copy ${i + 1} of ${pdfPath}`))
              .catch((err) =>
                console.error(`Error printing copy ${i + 1}: ${err}`),
              ),
          );
        }
        await Promise.all(printPromises);
      } else {
        // on linux
        // lpoptions -l
        // PageSize/Media Size: w288h288 w288h288-div2 *w288h216 w288h288_w288h144 w288h432 w288h432-div2 w288h432-div3 w288h576 w288h432_w288h144 w288h432-div2_w288h144 w288h576-div2 w288h576-div4 w324h216 w324h288 w324h324 w324h432 w324h432-div2 w324h486 w324h432-div3 w324h576 w324h576-div2 w324h576-div4 w324h432_w324h144 w324h432-div2_w324h144
        // w288h216 = 4x3 POLAROID
        // w288h288 = 4x4
        // w288h432 = 4x6 PHOTO

        let options = [`-n ${copiesRequested}`, `-o PageSize=w288h432`];

        if (format === 'POLAROID') {
          options = [`-n ${copiesRequested}`, `-o PageSize=w288h216`];
        }

        if (format === 'MINIPOLAROID') {
          if (copiesRequested > 3) {
            copiesRequested = 2;
          }
          options = [`-n ${copiesRequested}`, `-o PageSize=w288h432-div3`];
        }

        console.log('Linux driver with options', options);
        await getPrinters().then(console.log);
        try {
          console.log('Sending job to printer...');
          const printJob = await printUnix(pdfPath, printer, options);
          console.log(`Printed copies of ${pdfPath}`);
        } catch (err) {
          console.error('Error while printing:', err);
          throw new BadRequestException({
            message: 'Erreur lors de l’impression',
            details: err.message || 'Un problème est survenu avec l’imprimante.',
          });
        }        
        console.log(`Printed copies of ${pdfPath}`);
      }

      // If there were more copies requested than available, send an error after printing
      if (copiesRequested > copiesAvailable) {
        throw new BadRequestException(
          'Not enough copies available. Printed what was possible.',
        );
      }
    } catch (err) {
      console.error(`Error in print process: ${err}`);
      throw new BadRequestException({
        message: 'Erreur lors de l’impression',
        details: err.message || 'Un problème est survenu avec l’imprimante.',
      });    }

    // Optionally delete the PDF after printing
    try {
      await fs.unlink(pdfPath);
    } catch (err) {
      console.error(`Error deleting the PDF file: ${err}`);
    }
  }
}

// PageSize/Media Size: w288h288 w288h288-div2 *w288h216 w288h288_w288h144 w288h432
