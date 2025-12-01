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
  phoneNumberFormat: string;
}

export interface CultureCode {
  cultureCode: string;
  cultureName: string;
  cultureNameEnglish: string;
  numberThousandsSeparator: string;
  numberDecimalSeparator: string;
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  defaultTimePresentation: string;
  nameOrder: string;
  fallBackCultureLanguage: string;
}

export interface Timezone {
  timezoneId: string;
  displayName: string;
  region: string;
  utcOffset: string;
  utcOffsetDST: string;
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

export async function loadCultureCodesFromXML(): Promise<CultureCode[]> {
  try {
    const xmlPath = path.join(process.cwd(), 'client/src/0_universal_value_sets/culture_codes.xml');
    const xmlContent = readFileSync(xmlPath, 'utf-8');
    
    const result = await parseXML(xmlContent);
    
    if (!result.cultures || !result.cultures.culture) {
      throw new Error('Invalid culture codes XML structure');
    }
    
    const cultureCodes: CultureCode[] = result.cultures.culture.map((culture: any) => ({
      cultureCode: culture.cultureCode?.[0] ?? '',
      cultureName: culture.cultureName?.[0] ?? '',
      cultureNameEnglish: culture.cultureNameEnglish?.[0] ?? '',
      numberThousandsSeparator: culture.numberThousandsSeparator?.[0] ?? '',
      numberDecimalSeparator: culture.numberDecimalSeparator?.[0] ?? '',
      dateFormat: culture.dateFormat?.[0] ?? '',
      timeFormat: culture.timeFormat?.[0] ?? '',
      dateTimeFormat: culture.dateTimeFormat?.[0] ?? '',
      defaultTimePresentation: culture.defaultTimePresentation?.[0] ?? '',
      nameOrder: culture.NameOrder?.[0] ?? '',
      fallBackCultureLanguage: culture.FallBackCultureLanguage?.[0] ?? '',
    }));
    
    console.log(`✓ Loaded ${cultureCodes.length} culture codes from XML metadata`);
    return cultureCodes;
  } catch (error) {
    console.error('Error loading culture codes from XML:', error);
    throw error;
  }
}

export async function loadTimezonesFromXML(): Promise<Timezone[]> {
  try {
    const xmlPath = path.join(process.cwd(), 'client/src/0_universal_value_sets/timezones.xml');
    const xmlContent = readFileSync(xmlPath, 'utf-8');
    
    const result = await parseXML(xmlContent);
    
    if (!result.timezones || !result.timezones.timezone) {
      throw new Error('Invalid timezones XML structure');
    }
    
    const timezones: Timezone[] = result.timezones.timezone.map((tz: any) => ({
      timezoneId: tz.timezoneId?.[0] ?? '',
      displayName: tz.displayName?.[0] ?? '',
      region: tz.region?.[0] ?? '',
      utcOffset: tz.utcOffset?.[0] ?? '',
      utcOffsetDST: tz.utcOffsetDST?.[0] ?? '',
    }));
    
    console.log(`✓ Loaded ${timezones.length} timezones from XML metadata`);
    return timezones;
  } catch (error) {
    console.error('Error loading timezones from XML:', error);
    throw error;
  }
}
