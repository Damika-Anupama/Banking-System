import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPipe',
  standalone: false
})
export class FilterPipe implements PipeTransform {

  transform(items: any[], searchTerm: string): any[] {
    // Return empty array if items is null, undefined, or not an array
    if (!items || !Array.isArray(items)) {
      console.warn('FilterPipe received invalid items:', items);
      return [];
    }

    // Return original items if searchTerm is empty, null, or undefined
    if (!searchTerm || searchTerm.trim().length === 0) {
      return items;
    }

    try {
      // Normalize search term
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();

      // Filter items with safe navigation
      return items.filter(item => {
        try {
          // Return false if item is null or undefined
          if (!item) {
            return false;
          }

          // Safely check each property
          const accountIdMatch = this.safeStringMatch(item.account_id, normalizedSearchTerm);
          const branchNameMatch = this.safeStringMatch(item.branch_name, normalizedSearchTerm);
          const accountTypeMatch = this.safeStringMatch(item.account_type, normalizedSearchTerm);
          const savingTypeMatch = this.safeStringMatch(item.saving_type, normalizedSearchTerm);

          return accountIdMatch || branchNameMatch || accountTypeMatch || savingTypeMatch;
        } catch (itemError) {
          console.error('Error filtering individual item:', itemError, item);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in FilterPipe transform:', error);
      // Return original items in case of error to prevent UI crash
      return items;
    }
  }

  /**
   * Safely checks if a value matches the search term
   * Handles null, undefined, and various data types
   */
  private safeStringMatch(value: any, searchTerm: string): boolean {
    try {
      // Return false for null or undefined
      if (value === null || value === undefined) {
        return false;
      }

      // Convert to string and normalize
      const stringValue = String(value).toLowerCase().trim();

      // Check if it includes the search term
      return stringValue.includes(searchTerm);
    } catch (error) {
      console.error('Error in safeStringMatch:', error, value);
      return false;
    }
  }

  /**
   * Alternative transform method for more flexible filtering
   * Can be used if you need to specify which fields to search
   */
  transformWithFields(items: any[], searchTerm: string, fields: string[]): any[] {
    // Validate inputs
    if (!items || !Array.isArray(items)) {
      return [];
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      return items;
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      console.warn('FilterPipe: No fields specified for filtering');
      return items;
    }

    try {
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();

      return items.filter(item => {
        if (!item) {
          return false;
        }

        // Check if any of the specified fields match
        return fields.some(field => {
          try {
            const value = this.getNestedProperty(item, field);
            return this.safeStringMatch(value, normalizedSearchTerm);
          } catch (error) {
            console.error(`Error accessing field "${field}" in item:`, error);
            return false;
          }
        });
      });
    } catch (error) {
      console.error('Error in FilterPipe transformWithFields:', error);
      return items;
    }
  }

  /**
   * Safely gets nested property from an object
   * Supports dot notation (e.g., 'user.name')
   */
  private getNestedProperty(obj: any, path: string): any {
    try {
      if (!obj || !path) {
        return undefined;
      }

      const keys = path.split('.');
      let result = obj;

      for (const key of keys) {
        if (result === null || result === undefined) {
          return undefined;
        }
        result = result[key];
      }

      return result;
    } catch (error) {
      console.error('Error getting nested property:', error);
      return undefined;
    }
  }
}
