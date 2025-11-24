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
    const value = fieldDef[key]?.[0];
    
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
    } else if (arrayFields.includes(key)) {
      // Parse array fields from JSON or comma-separated strings
      if (typeof value === 'string') {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            flattened[key] = parsed;
          } else {
            // If not an array, wrap in array
            flattened[key] = [value];
          }
        } catch {
          // If JSON parse fails, try comma-separated
          if (value.includes(',')) {
            flattened[key] = value.split(',').map(s => s.trim()).filter(s => s);
          } else if (value) {
            // Single value
            flattened[key] = [value];
          } else {
            flattened[key] = [];
          }
        }
      } else if (Array.isArray(value)) {
        flattened[key] = value;
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
