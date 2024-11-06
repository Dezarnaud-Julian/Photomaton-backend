import { Injectable, BadRequestException } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

@Injectable()
export class CodeService {
  private codeDictionary: { [key: string]: boolean } = {};

  constructor() {
    this.loadCodes();
  }

  // Charge les codes depuis `codes.json` et initialise chaque code avec `false` (non utilisé).
  private async loadCodes() {
    try {
      const codesData = await readFile('codes.json');
      this.codeDictionary = JSON.parse(codesData.toString()) as { [key: string]: boolean };
      console.log('Codes loaded successfully:', this.codeDictionary);
    } catch (error) {
      console.error('Error loading codes:', error);
      throw new BadRequestException('Failed to load codes');
    }
  }

  async saveCodesInFile(codes: { [key: string]: boolean }) {
    await writeFile('codes.json', JSON.stringify(codes), 'utf8');
  };
  

  // Vérifie le code scanné
  checkCode(code: string): string {
    if (!(code in this.codeDictionary)) {
      return 'Code invalide';
    } else if (this.codeDictionary[code]) {
      return 'Code déjà utilisé';
    } else {
      this.codeDictionary[code] = true; // Marque le code comme utilisé
      this.saveCodesInFile(this.codeDictionary);
      return 'IMPRESSION';
    }
  }
}
