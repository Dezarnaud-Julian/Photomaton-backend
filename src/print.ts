const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
import { print as printWindows } from "pdf-to-printer"
import { print as printUnix } from "unix-print";

export class PrintService {
    async convertJpgToPdf(jpgPath: string, pdfPath: string) {
        const jpgImageBytes = await fs.readFile(jpgPath);
        const pdfDoc = await PDFDocument.create();
        const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);

        const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
        page.drawImage(jpgImage, {
            x: 0,
            y: 0,
            width: jpgImage.width,
            height: jpgImage.height,
        });

        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(pdfPath, pdfBytes);
    }

    async print(filePath: string, copies: number) {
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg') {
            console.error('The file must be a .jpg or .jpeg image');
            return;
        }

        const pdfPath = filePath.replace(/\.(jpg|jpeg)$/i, '.pdf');
        await this.convertJpgToPdf(filePath, pdfPath);

        console.log(`Printing ${copies} copies of ${pdfPath}`);

        const printer='DP-QW410'
        const printPromises = [];
        for (let i = 0; i < copies; i++) {
            printPromises.push(
                process.platform === "win32" ?
                    // on windows
                    printWindows(pdfPath, { printer }).then(() => console.log(`Printed copy ${i + 1} of ${pdfPath}`)).catch(err => console.error(`Error printing copy ${i + 1}: ${err}`))
                    :
                    // on linux
                    printUnix(pdfPath, printer).then(() => console.log(`Printed copy ${i + 1} of ${pdfPath}`)).catch(err => console.error(`Error printing copy ${i + 1}: ${err}`))
                
            );
        }

        await Promise.all(printPromises);
        await fs.unlink(pdfPath); // Optionally delete the PDF after printing
    }
}