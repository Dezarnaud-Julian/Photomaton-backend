import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CodeService {
  private codeDictionary: { [key: string]: boolean } = {};

  constructor() {
    this.loadCodes();
  }

  // Charge les codes depuis `codes.txt` et initialise chaque code avec `true` (non utilisé).
  private loadCodes() {
    try {
      const filePath = path.join(__dirname, '../src/codes.txt');
      const data = fs.readFileSync(filePath, 'utf8'); // Utilisation de readFileSync pour une lecture synchrone
      const codes = data.split('\n').map(line => line.trim()).filter(line => line);
      codes.forEach(code => {
        this.codeDictionary[code] = true;
      });
      console.log('Codes loaded successfully:', this.codeDictionary);
    } catch (error) {
      console.error('Error loading codes:', error);
      throw new BadRequestException('Failed to load codes');
    }
}

  // Vérifie le code scanné
  checkCode(code: string): string {
    if (!(code in this.codeDictionary)) {
      return 'Code invalide';
    } else if (!this.codeDictionary[code]) {
      return 'Code déjà utilisé';
    } else {
      this.codeDictionary[code] = false; // Marque le code comme utilisé
      return 'IMPRESSION';
    }
  }
}
