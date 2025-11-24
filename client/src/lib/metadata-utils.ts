/**
 * Utility functions for normalizing XML metadata from xml2js format
 * xml2js returns all values as arrays, e.g., { subtype: ["text"] }
 * This utility flattens and type-casts the values appropriately
 * 
 * @param fieldDef - The xml2js parsed field definition
 * @param knownFieldType - Optional field type to use for context-aware casting (e.g., "TextField", "NumberField")
 */

/**
 * Recursively unwrap xml2js element objects and arrays
 * xml2js can nest values in complex ways:
 * - { _: 'value' } - element with text content
 * - { _: ['value'] } - element with attributes and text
 * - ['value1', 'value2'] - multiple elements
 * - [{ _: 'value1' }, { _: 'value2' }] - multiple elements with text
 * - { $: { attr: 'val' } } - element with only attributes (no text)
 */
function unwrapXmlValue(value: any): any {
  // If array, take first element and recurse
  if (Array.isArray(value)) {
    return value.length > 0 ? unwrapXmlValue(value[0]) : '';
  }
  
  // If object with underscore property (text content), extract and recurse
  if (typeof value === 'object' && value !== null && '_' in value) {
    return unwrapXmlValue(value._);
  }
  
  // If object without text content (e.g., attribute-only nodes), return empty
  // This prevents [object Object] artifacts from polluting arrays
  if (typeof value === 'object' && value !== null) {
    return '';
  }
  
  // Base case: scalar value (string, number, boolean, null, undefined)
  return value;
}

export function flattenXmlMetadata(fieldDef: any, knownFieldType?: string): Record<string, any> {
  const flattened: any = {};
  
  // Fields that should be parsed as numbers
  const numericFields = [
    'maxLength', 'minValue', 'maxValue', 'precision', 'scale',
    'decimalPlaces', 'visibleLinesInEdit', 'visibleLinesInView',
    'minDigits', 'maxDigits'
  ];
  
  // Fields that should be parsed as booleans
  const booleanFields = [
    'required', 'copyAble', 'truncate', 'percentageDisplay', 'allowSearch',
    'allowNegativeNumbers', 'onlyPositive', 'displayThousandsSeparator'
  ];
  
  // Fields that should be parsed as arrays
  const arrayFields = ['displayColumns'];
  
  // Get field type to determine defaultValue type
  // Prefer knownFieldType (from caller) over XML metadata
  const fieldType = knownFieldType || fieldDef.type?.[0];
  
  Object.keys(fieldDef).forEach(key => {
    const rawValue = fieldDef[key];
    
    // Handle array fields specially - check if xml2js returned a true array
    if (arrayFields.includes(key)) {
      if (Array.isArray(rawValue)) {
        // xml2js gives us an array - this is native XML array format
        // Each entry could be a scalar, object with underscore, or nested array
        // Recursively unwrap each entry, trim, and filter empties
        flattened[key] = rawValue
          .map(entry => {
            const unwrapped = unwrapXmlValue(entry);
            // Convert to string safely: preserve zero but filter null/undefined
            if (unwrapped === null || unwrapped === undefined) {
              return '';
            } else if (typeof unwrapped === 'string') {
              return unwrapped.trim();
            } else {
              // Preserve numeric zero and other values
              return String(unwrapped);
            }
          })
          .filter(v => v !== '');
      } else if (typeof rawValue === 'string') {
        // Single string value - parse as JSON or CSV (legacy formats)
        const trimmed = rawValue.trim();
        if (!trimmed) {
          flattened[key] = [];
        } else {
          try {
            const parsed = JSON.parse(trimmed);
            flattened[key] = Array.isArray(parsed) ? parsed : [trimmed];
          } catch {
            if (trimmed.includes(',')) {
              flattened[key] = trimmed.split(',').map(s => s.trim()).filter(s => s);
            } else {
              flattened[key] = [trimmed];
            }
          }
        }
      } else if (typeof rawValue === 'object' && rawValue !== null) {
        // Single xml2js element object - unwrap recursively and wrap in array
        const unwrapped = unwrapXmlValue(rawValue);
        let stringValue: string;
        if (unwrapped === null || unwrapped === undefined) {
          stringValue = '';
        } else if (typeof unwrapped === 'string') {
          stringValue = unwrapped.trim();
        } else {
          stringValue = String(unwrapped);
        }
        flattened[key] = stringValue ? [stringValue] : [];
      } else {
        flattened[key] = [];
      }
      return;
    }
    
    // For non-array fields, extract first element from xml2js array
    const value = rawValue?.[0];
    
    // Skip undefined or empty string values
    if (value === undefined || value === '') {
      return;
    }
    
    // Convert to appropriate type
    if (numericFields.includes(key)) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        flattened[key] = num;
      }
    } else if (booleanFields.includes(key)) {
      // Convert string boolean to actual boolean
      if (value === 'true') {
        flattened[key] = true;
      } else if (value === 'false') {
        flattened[key] = false;
      }
    } else if (key === 'defaultValue') {
      // Type-cast defaultValue based on field type
      if (fieldType === 'NumberField') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          flattened[key] = num;
        }
      } else if (fieldType === 'CheckboxField') {
        // For checkbox, convert to boolean
        if (value === 'true') {
          flattened[key] = true;
        } else if (value === 'false') {
          flattened[key] = false;
        }
      } else {
        // For text fields and others, keep as string
        flattened[key] = value;
      }
    } else {
      // String values
      flattened[key] = value;
    }
  });
  
  return flattened;
}
