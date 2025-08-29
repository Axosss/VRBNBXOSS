/**
 * Utility functions for converting between snake_case and camelCase
 */

/**
 * Convert a snake_case string to camelCase
 * @example snakeToCamel('user_name') => 'userName'
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert a camelCase string to snake_case
 * @example camelToSnake('userName') => 'user_name'
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Convert all keys in an object from snake_case to camelCase
 * Handles nested objects recursively
 */
export function convertKeysSnakeToCamel<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (obj instanceof Date) {
    return obj as T
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysSnakeToCamel(item)) as T
  }

  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {}
    const objRecord = obj as Record<string, unknown>
    
    for (const key in objRecord) {
      if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
        const camelKey = snakeToCamel(key)
        const value = objRecord[key]
        
        // Recursively convert nested objects
        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          converted[camelKey] = convertKeysSnakeToCamel(value)
        } else if (Array.isArray(value)) {
          converted[camelKey] = value.map(item => 
            typeof item === 'object' ? convertKeysSnakeToCamel(item) : item
          )
        } else {
          converted[camelKey] = value
        }
      }
    }
    
    return converted
  }

  return obj
}

/**
 * Convert all keys in an object from camelCase to snake_case
 * Handles nested objects recursively
 */
export function convertKeysCamelToSnake<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (obj instanceof Date) {
    return obj.toISOString() as any
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysCamelToSnake(item)) as T
  }

  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {}
    const objRecord = obj as Record<string, unknown>
    
    for (const key in objRecord) {
      if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
        const snakeKey = camelToSnake(key)
        const value = objRecord[key]
        
        // Recursively convert nested objects
        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          converted[snakeKey] = convertKeysCamelToSnake(value)
        } else if (Array.isArray(value)) {
          converted[snakeKey] = value.map(item => 
            typeof item === 'object' ? convertKeysCamelToSnake(item) : item
          )
        } else if (value instanceof Date) {
          converted[snakeKey] = value.toISOString()
        } else {
          converted[snakeKey] = value
        }
      }
    }
    
    return converted
  }

  return obj
}

/**
 * Safely convert a value that might be undefined or null
 */
export function safeConvert<T>(
  value: unknown,
  converter: (val: unknown) => T
): T | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  return converter(value)
}

/**
 * Convert specific fields while preserving others
 * Useful when you only want to convert certain fields
 */
export function convertSpecificFields<T = unknown>(
  obj: unknown,
  fieldsToConvert: string[],
  converter: (key: string) => string
): T {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const result = { ...obj }
  
  for (const key of fieldsToConvert) {
    if (key in obj) {
      const newKey = converter(key)
      if (newKey !== key) {
        result[newKey] = obj[key]
        delete result[key]
      }
    }
  }
  
  return result
}