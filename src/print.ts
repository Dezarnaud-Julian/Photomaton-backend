const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
import { BadRequestException } from "@nestjs/common";
import { degrees, degreesToRadians } from "pdf-lib";
import { print as printWindows } from "pdf-to-printer";
import { print as printUnix, getPrinters, isPrintComplete } from "unix-print";
const { print } = require("pdf-to-printer");
//restart print if problem : cupsenable DP-QW410

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

    async convertJpgToPdf(jpgPath: string, pdfPath: string, template: string) {
        const pdfDoc = await PDFDocument.create();
        const jpgImageBytes = await fs.readFile(jpgPath);
        const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);

        if(template === 'POLAROID'){

            const cadreBytes = await fs.readFile("./src/cadres/POLAROID/MAMA.png");
            const cadreImage = await pdfDoc.embedPng(cadreBytes);

            // Dimensions du format 4x6 pouces en points (1 pouce = 72 points)
            const pdfWidth = 288;
            const pdfHeight = 216; 

            const imgWidth = jpgImage.width/4;
            const imgHeight = jpgImage.height/4;

            const cadreWidth = cadreImage.width/5;
            const cadreHeight = cadreImage.height/5;

            const x = ((pdfWidth - imgWidth)/2) *3;
            const y = ((pdfHeight - imgHeight) - x) +180;

            const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
            page.drawImage(jpgImage, {
                x: x,
                y: y,
                width: imgWidth,
                height: imgHeight,
            });

            page.drawImage(cadreImage, {
                x: pdfWidth/2,
                y: -25,
                width: cadreWidth,
                height: cadreHeight,
            });
            //page.setRotation(degrees(90))

            const pdfBytes = await pdfDoc.save();
            await fs.writeFile(pdfPath, pdfBytes);
        }else{
            const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
            page.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: jpgImage.width,
                height: jpgImage.height,
            });
            page.setRotation(degrees(90))
            const pdfBytes = await pdfDoc.save();
            await fs.writeFile(pdfPath, pdfBytes);
        }
    }

    async print(filePath: string, copiesRequested: number, template: string) {
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg') {
            console.error('The file must be a .jpg or .jpeg image');
            throw new BadRequestException('The file must be a .jpg or .jpeg image');
        }

        const pdfPath = filePath.replace(/\.(jpg|jpeg)$/i, '.pdf');

        try {
            await this.convertJpgToPdf(filePath, pdfPath, template);
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

            if (template === 'POLAROID') {
                await this.updateCopiesCount(copiesAvailable - copiesToPrint);
            }else{
                await this.updateCopiesCount(copiesAvailable - (copiesToPrint*2));
            }
            await this.updateCopiesCount(copiesAvailable - copiesToPrint);

            console.log(`Printing ${copiesToPrint} copies of ${pdfPath} on printer ${printer}`);

            if (process.platform === "win32") {
                // on windows
                const printPromises = [];
                for (let i = 0; i < copiesToPrint; i++) {
                    printPromises.push(
                        printWindows(pdfPath, { printer }).then(() => console.log(`Printed copy ${i + 1} of ${pdfPath}`)).catch(err => console.error(`Error printing copy ${i + 1}: ${err}`))
                    );
                }
                await Promise.all(printPromises);
            }
            else {
                // on linux
                // lpoptions -l
                // PageSize/Media Size: w288h288 w288h288-div2 *w288h216 w288h288_w288h144 w288h432 w288h432-div2 w288h432-div3 w288h576 w288h432_w288h144 w288h432-div2_w288h144 w288h576-div2 w288h576-div4 w324h216 w324h288 w324h324 w324h432 w324h432-div2 w324h486 w324h432-div3 w324h576 w324h576-div2 w324h576-div4 w324h432_w324h144 w324h432-div2_w324h144
                // w288h216 = 4x3
                // w288h288 = 4x4
                // w288h432 = 4x6
                let options = [`-n ${copiesRequested}`, `-o PageSize=w288h432`];

                if(template === 'POLAROID'){
                    options = [`-n ${copiesRequested}`, `-o PageSize=w288h216`];
                }
                
                console.log("Linux driver with options", options)
                await getPrinters().then(console.log);
                const printJob = await printUnix(pdfPath, printer, options).catch(err => console.error(`Error while printing: ${err}`))
                async function waitForPrintCompletion(printJob) {
                    while (!await isPrintComplete(printJob)) {
                        // Wait a bit before checking again (to avoid constant checks)
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
                    }
                    console.log('Job complete');
                }
    
                await waitForPrintCompletion(printJob);
                console.log(`Printed copies of ${pdfPath}`)
            }

            // If there were more copies requested than available, send an error after printing
            if (copiesRequested > copiesAvailable) {
                throw new BadRequestException('Not enough copies available. Printed what was possible.');
            }

        } catch (err) {
            console.error(`Error in print process: ${err}`);
            throw err;  // Re-throw the caught exception
        }

        // Optionally delete the PDF after printing
        try {
            // await fs.unlink(pdfPath);
        } catch (err) {
            console.error(`Error deleting the PDF file: ${err}`);
        }
    }
}

// PageSize/Media Size: w288h288 w288h288-div2 *w288h216 w288h288_w288h144 w288h432