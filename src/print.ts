const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
import { BadRequestException } from "@nestjs/common";
import { print as printWindows } from "pdf-to-printer";
import { print as printUnix, getPrinters, isPrintComplete } from "unix-print";

export class PrintService {
    async convertJpgToPdf(jpgPath: string, pdfPath: string, template: string) {
        const jpgImageBytes = await fs.readFile(jpgPath);
        const pdfDoc = await PDFDocument.create();
        const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);


        let page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
        let imgWidth = jpgImage.width;
        let imgHeight = jpgImage.height;


        if(template === 'POLAROID'){

            // Dimensions du format 4x6 pouces en points (1 pouce = 72 points)
            const pdfWidth = 288;
            const pdfHeight = 432;

            imgWidth = jpgImage.width/2;
            imgHeight = jpgImage.height/2;

            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 1.06;

            page = pdfDoc.addPage([pdfWidth, pdfHeight]);
            page.drawImage(jpgImage, {
                x: x,
                y: y,
                width: imgWidth,
                height: imgHeight,
            });
        }


        page.drawImage(jpgImage, {
            x: 0,
            y: 0,
            width: imgWidth,
            height: imgHeight,
        });

        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(pdfPath, pdfBytes);
    }

    async print(filePath: string, copies: number, template: string) {
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg') {
            console.error('The file must be a .jpg or .jpeg image');
            throw new BadRequestException('Failed to print file');
        }
    
        const pdfPath = filePath.replace(/\.(jpg|jpeg)$/i, '.pdf');
    
        try {
            await this.convertJpgToPdf(filePath, pdfPath, template);
        } catch (err) {
            console.error(`Error converting JPG to PDF: ${err}`);
            throw new BadRequestException('Failed to convert JPG to PDF');
        }
    
        const printer = 'DP-QW410';
        console.log(`Printing ${copies} copies of ${pdfPath} on printer ${printer}`);
    
        try {
            if (process.platform === "win32") {
                const printPromises = [];
                for (let i = 0; i < copies; i++) {
                    printPromises.push(
                        printWindows(pdfPath, { printer })
                            .then(() => console.log(`Printed copy ${i + 1} of ${pdfPath}`))
                    );
                }
                await Promise.all(printPromises);
            } else {
                // on linux
                const options = [`-n ${copies}`, `-o PageSize=w288h432`];
                console.log("Linux driver with options", options);
                await getPrinters().then(console.log);
    
                let printJob;
                try {
                    printJob = await printUnix(pdfPath, printer, options);
                } catch (err) {
                    console.error(`Error while printing: ${err}`);
                    throw new BadRequestException('Failed to print on Unix system');
                }
    
                async function waitForPrintCompletion(printJob) {
                    while (!await isPrintComplete(printJob)) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
                    }
                    console.log('Job complete');
                }
    
                await waitForPrintCompletion(printJob);
                console.log(`Printed copies of ${pdfPath}`);
            }
        } catch (err) {
            console.error(`Error in print process: ${err}`);
            throw new BadRequestException('Failed to print file');
        }
    
        // Optionally delete the PDF after printing
        try {
            // await fs.unlink(pdfPath);
        } catch (err) {
            console.error(`Error deleting the PDF file: ${err}`);
        }
    }    
}