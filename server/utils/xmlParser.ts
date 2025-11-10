import { readFileSync } from 'fs';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import path from 'path';

const parseXML = promisify(parseString);

export interface Currency {
  currencyISOCode: string;
  currencyName: string;
  currencyCulture: string;
  currencyLocaleName: string;
  currencySymbol: string;
  currencySymbolPosition: string;
  currencyDecimalPlaces: number;
  currencyThousandsSeparator: string;
  currencyDecimalSeparator: string;
}

export async function loadCurrenciesFromXML(): Promise<Currency[]> {
  try {
    const xmlPath = path.join(process.cwd(), 'client/src/0_universal_value_sets/currencies.xml');
    const xmlContent = readFileSync(xmlPath, 'utf-8');
    
    const result = await parseXML(xmlContent);
    
    if (!result.currencies || !result.currencies.currency) {
      throw new Error('Invalid currencies XML structure');
    }
    
    const currencies: Currency[] = result.currencies.currency.map((curr: any) => ({
      currencyISOCode: curr.currencyISOCode[0],
      currencyName: curr.currencyName[0],
      currencyCulture: curr.currencyCulture[0],
      currencyLocaleName: curr.currencyLocaleName[0],
      currencySymbol: curr.currencySymbol[0],
      currencySymbolPosition: curr.currencySymbolPosition[0],
      currencyDecimalPlaces: parseInt(curr.currencyDecimalPlaces[0], 10),
      currencyThousandsSeparator: curr.currencyThousandsSeparator[0],
      currencyDecimalSeparator: curr.currencyDecimalSeparator[0],
    }));
    
    console.log(`✓ Loaded ${currencies.length} currencies from XML metadata`);
    return currencies;
  } catch (error) {
    console.error('Error loading currencies from XML:', error);
    throw error;
  }
}
