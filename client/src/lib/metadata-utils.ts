/**
 * Utility functions for normalizing XML metadata from xml2js format
 * xml2js returns all values as arrays, e.g., { subtype: ["text"] }
 * This utility flattens and type-casts the values appropriately
 * 
 * @param fieldDef - The xml2js parsed field definition
 * @param knownFieldType - Optional field type to use for context-aware casting (e.g., "TextField", "NumberField")
 */

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
        // xml2js may return element objects shaped like { _: 'value' }
        // Map over entries and unwrap element objects, then filter empties
        flattened[key] = rawValue
          .map(entry => {
            // Handle xml2js element objects with underscore property
            if (typeof entry === 'object' && entry !== null && '_' in entry) {
              return entry._;
            }
            // Handle plain string values
            return entry;
          })
          .filter(v => v !== '' && v !== undefined && v !== null);
      } else if (typeof rawValue === 'string') {
        // Single string value - parse as JSON or CSV
        try {
          const parsed = JSON.parse(rawValue);
          flattened[key] = Array.isArray(parsed) ? parsed : [rawValue];
        } catch {
          if (rawValue.includes(',')) {
            flattened[key] = rawValue.split(',').map(s => s.trim()).filter(s => s);
          } else if (rawValue) {
            flattened[key] = [rawValue];
          } else {
            flattened[key] = [];
          }
        }
      } else if (typeof rawValue === 'object' && rawValue !== null && '_' in rawValue) {
        // Single xml2js element object - unwrap and wrap in array
        flattened[key] = rawValue._ ? [rawValue._] : [];
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
