export class PrintService {
  async print(filePath : string,copies : number) {
    console.log(`Printing ${copies} copies of ${filePath}`);
  }
}