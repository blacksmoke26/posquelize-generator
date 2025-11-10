/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

/**
 * A utility class to convert a JSON object into a TypeScript interface string.
 *
 * This class provides functionality to analyze a JSON object and generate corresponding
 * TypeScript interface definitions. It handles nested objects, arrays, and various primitive
 * types, while also managing circular references to prevent infinite recursion.
 *
 * @example
 * ```typescript
 * const json = {
 *   name: "John",
 *   age: 30,
 *   address: {
 *     street: "123 Main St",
 *     city: "New York"
 *   }
 * };
 * const tsInterface = JsonToTsConverter.convert(json, "Person");
 * console.log(tsInterface);
 * ```
 */
export class JsonToTsConverter {
  /**
   * A map to store generated TypeScript interfaces.
   *
   * The key represents the interface name, and the value is the full interface definition string.
   * This collection ensures that interfaces are only generated once and allows for proper
   * ordering when assembling the final output.
   */
  private interfaces: Map<string, string> = new Map();

  /**
   * A WeakSet to track visited objects during the conversion process.
   *
   * This is used to detect and handle circular references in the input JSON object.
   * By tracking visited objects, we can prevent infinite recursion when objects reference
   * themselves or create circular dependencies.
   */
  private visitedObjects = new WeakSet<object>();

  /**
   * Creates an instance of JsonToTsConverter.
   * The constructor is private to enforce the use of the static factory method `convert`.
   */
  private constructor() { }

  /**
   * Static method to convert a JSON object into TypeScript interfaces.
   *
   * @param jsonData - The JSON object to convert. Must be a valid object, not null or primitive.
   * @param rootType - Optional name for the root interface. Defaults to 'RootObject'.
   * @returns A string containing the generated TypeScript interfaces, formatted with proper indentation.
   * @throws {Error} If the input is not a valid JSON object.
   * @example
   * ```typescript
   * const json = {
   *   name: "John",
   *   age: 30,
   *   address: {
   *     street: "123 Main St",
   *     city: "New York"
   *   }
   * };
   * const tsInterface = JsonToTsConverter.convert(json, "Person");
   * console.log(tsInterface);
   * ```
   */
  public static  convert(jsonData: unknown, rootType: string = 'RootObject'): string {
    return new JsonToTsConverter().convertJson(jsonData, rootType);
  }

  /**
   * The main internal method that orchestrates the conversion process.
   *
   * This method validates the input, initializes the conversion state, triggers the
   * interface generation, and assembles the final output in the correct order.
   *
   * @param jsonData - The JSON object to convert. Must be a valid object, not null or primitive.
   * @param rootInterfaceName - The name to use for the root interface (e.g., 'User', 'ApiResponse').
   * @returns A formatted string containing all generated TypeScript interfaces.
   * @throws {Error} If the input is not a valid JSON object.
   */
  private convertJson(jsonData: unknown, rootInterfaceName: string): string {
    if (typeof jsonData !== 'object' || jsonData === null) {
      return `interface ${rootInterfaceName} {\n  [p: string]: unknown;\n}`;
    }

    this.interfaces.clear();
    this.visitedObjects = new WeakSet<object>();

    this.generateInterface(jsonData, rootInterfaceName);

    // The root interface might be the only one, or it might depend on others.
    // We'll build the final string, ensuring dependencies are declared first.
    // A simple approach is to reverse the order of generation, as dependencies are generated first.
    const orderedInterfaces = Array.from(this.interfaces.entries()).reverse();

    return orderedInterfaces.map(([, content]) => content).join('\n\n');
  }

  /**
   * Recursively generates an interface definition for a given object.
   *
   * This method analyzes the structure of an object and creates a TypeScript interface
   * that matches its properties. It handles nested objects by recursively calling itself
   * and uses a WeakSet to track visited objects to prevent infinite recursion in case
   * of circular references.
   *
   * @param obj - The object to analyze and convert to an interface.
   * @param interfaceName - The name to assign to the generated interface.
   */
  private generateInterface(obj: any, interfaceName: string): void {
    // Prevent infinite recursion from circular references
    if (typeof obj === 'object' && obj !== null) {
      if (this.visitedObjects.has(obj)) {
        return;
      }
      this.visitedObjects.add(obj);
    }

    if (this.interfaces.has(interfaceName)) {
      return; // Interface already generated
    }

    let interfaceBody = '';
    const keys = Object.keys(obj);

    for (const key of keys) {
      const value = obj[key];
      const type = this.getType(value, this.capitalize(key));
      interfaceBody += `  ${key}: ${type};\n`;
    }

    const fullInterface = `interface ${interfaceName} {\n${interfaceBody.trimEnd()}\n}`;
    this.interfaces.set(interfaceName, fullInterface);
  }

  /**
   * Determines the TypeScript type string for a given value.
   *
   * This method analyzes a value and returns the appropriate TypeScript type string.
   * It handles all JSON primitive types, arrays (including nested arrays), and objects.
   * For objects, it triggers the generation of a new interface and returns its name.
   *
   * @param value - The value to analyze for type determination.
   * @param parentKey - The key of the property holding this value, used for naming child interfaces.
   * @returns A string representing the TypeScript type.
   */
  private getType(value: any, parentKey: string): string {
    if (value === null) {
      return 'null';
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'any[]'; // Or a more specific empty array type if desired
      }
      // Get the type of the first element as a representative for the whole array
      const elementType = this.getType(value[0], this.capitalize(parentKey));
      return `${elementType}[]`;
    }
    if (typeof value === 'object') {
      const interfaceName = this.capitalize(parentKey);
      this.generateInterface(value, interfaceName);
      return interfaceName;
    }
    return typeof value; // 'string', 'number', 'boolean'
  }

  /**
   * Capitalizes the first letter of a string and sanitizes it for use in interface names.
   *
   * This method ensures that generated interface names are valid TypeScript identifiers
   * by removing invalid characters and capitalizing the first letter. It's used to convert
   * JSON object keys into appropriate interface names.
   *
   * @param str - The string to capitalize and sanitize.
   * @returns The capitalized and sanitized string suitable for use as an interface name.
   */
  private capitalize(str: string): string {
    if (!str) return '';
    // Sanitize the key to be a valid TypeScript identifier
    const sanitizedKey = str.replace(/[^a-zA-Z0-9_$]/g, '');
    return sanitizedKey.charAt(0).toUpperCase() + sanitizedKey.slice(1);
  }
}
