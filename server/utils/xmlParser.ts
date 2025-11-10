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

export interface Country {
  countryCode: string;
  countryCode3Digits: string;
  countryName: string;
  region: string;
  subRegion: string;
  intermediateRegion: string;
  phoneCountryCode: string;
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

export async function loadCountriesFromXML(): Promise<Country[]> {
  try {
    const xmlPath = path.join(process.cwd(), 'client/src/0_universal_value_sets/countries.xml');
    const xmlContent = readFileSync(xmlPath, 'utf-8');
    
    const result = await parseXML(xmlContent);
    
    if (!result.countries || !result.countries.country) {
      throw new Error('Invalid countries XML structure');
    }
    
    const countries: Country[] = result.countries.country.map((country: any) => ({
      countryCode: country.countryCode?.[0] ?? '',
      countryCode3Digits: country.countryCode3Digits?.[0] ?? '',
      countryName: country.countryName?.[0] ?? '',
      region: country.region?.[0] ?? '',
      subRegion: country.subRegion?.[0] ?? '',
      intermediateRegion: country.intermediateRegion?.[0] ?? '',
      phoneCountryCode: country.phoneCountryCode?.[0] ?? '',
    }));
    
    console.log(`✓ Loaded ${countries.length} countries from XML metadata`);
    return countries;
  } catch (error) {
    console.error('Error loading countries from XML:', error);
    throw error;
  }
}
