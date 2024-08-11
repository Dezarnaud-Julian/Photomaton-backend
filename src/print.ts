const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
import { print as printWindows } from "pdf-to-printer";
import { print as printUnix, getPrinters, isPrintComplete } from "unix-print";

export class PrintService {
    async convertJpgToPdf(jpgPath: string, pdfPath: string) {
        const jpgImageBytes = await fs.readFile(jpgPath);
        const pdfDoc = await PDFDocument.create();
        const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);


        //const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);

        // Dimensions du format 4x6 pouces en points (1 pouce = 72 points)
        const pdfWidth = 288;
        const pdfHeight = 432; 

        const imgWidth = jpgImage.width/2;
        const imgHeight = jpgImage.height/2;

        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 1.06;

        const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
        page.drawImage(jpgImage, {
            x: x,
            y: y,
            width: imgWidth,
            height: imgHeight,
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

        const printer='DP-QW410';
        console.log(`Printing ${copies} copies of ${pdfPath} on printer ${printer}`);

        if (process.platform === "win32") {
            const printPromises = [];
            for (let i = 0; i < copies; i++) {
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
            const options = [`-n ${copies}`, `-o PageSize=w288h432`];
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
            console.log(`Printed copies of ${pdfPath}`);
        }

        //await fs.unlink(pdfPath); // Optionally delete the PDF after printing
    }
}