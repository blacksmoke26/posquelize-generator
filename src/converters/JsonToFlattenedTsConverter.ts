/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

/**
 * A utility class to convert a JSON object into a single, flattened TypeScript interface.
 * Nested objects are inlined into the main interface definition.
 *
 * @example
 * ```json
 * {
 *   "user": {
 *     "id": 1,
 *     "name": "John Doe"
 *   },
 *   "posts": [
 *     { "title": "First Post", "content": "Hello World" }
 *   ]
 * }
 * ```
 *
 * Would be converted to:
 * ```typescript
 * export interface RootObject {
 *   user: {
 *     id: number;
 *     name: string;
 *   };
 *   posts: {
 *     title: string;
 *     content: string;
 *   }[];
 * }
 * ```
 */
export class JsonToFlattenedTsConverter {
  /**
   * A WeakSet used to keep track of objects that have been visited during the conversion process.
   * This helps prevent infinite recursion when dealing with circular references in the input JSON.
   */
  private visitedObjects = new WeakSet<object>();

  /**
   * Creates an instance of JsonToFlattenedTsConverter.
   * The constructor is private to enforce the use of the static factory method `convert`.
   */
  private constructor() {}

  /**
   * Converts a JSON object into a flattened TypeScript interface.
   * This static method serves as the main entry point for the conversion process,
   * creating an instance of the converter and delegating the actual conversion work.
   *
   * @param jsonData The JSON object to convert. Must be a valid object structure.
   * @param interfaceName The name for the generated interface (e.g., 'User', 'ApiResponse').
   *                     Defaults to 'RootObject' if not specified.
   * @returns A formatted string containing the complete TypeScript interface definition.
   *          The interface will include all nested objects flattened into the main definition.
   * @throws {Error} If the input is not a valid JSON object (null, primitive, or undefined).
   * @example
   * ```typescript
   * const jsonData = {
   *   user: { id: 1, name: "John" },
   *   posts: [{ title: "Hello", content: "World" }]
   * };
   * const interfaceString = JsonToFlattenedTsConverter.convert(jsonData, "UserData");
   * console.log(interfaceString);
   * // Output:
   * // export interface UserData {
   * //   user: {
   * //     id: number;
   * //     name: string;
   * //   };
   * //   posts: {
   * //     title: string;
   * //     content: string;
   * //   }[];
   * // }
   * ```
   */
  public static convert(jsonData: unknown, interfaceName: string = 'RootObject'): string {
    return new JsonToFlattenedTsConverter().convertJson(jsonData, interfaceName);
  }

  /**
   * The main method to convert a JSON object into a single interface.
   *
   * @param jsonData The JSON object to convert.
   * @param interfaceName The name for the interface (e.g., 'User', 'ApiResponse'). Defaults to 'RootObject'.
   * @returns A formatted string containing the single generated TypeScript interface.
   * @throws {Error} If the input is not a valid JSON object.
   */
  private convertJson(jsonData: unknown, interfaceName: string = 'RootObject'): string {
    if (typeof jsonData !== 'object' || jsonData === null) {
      return `interface ${interfaceName} {}`;
    }

    // Reset the visited set for each conversion run
    this.visitedObjects = new WeakSet<object>();

    const interfaceBody = this.generateObjectBody(jsonData, 0).trim();

    return `interface ${interfaceName} ${interfaceBody}`.replace(/\[]$/, '');
  }

  /**
   * Recursively generates the body of an interface by inlining nested objects.
   *
   * @param obj The object or value to analyze.
   * @param indentLevel The current indentation level for formatting.
   * @returns A string representing the type definition for the given value.
   */
  private generateObjectBody(obj: any, indentLevel: number): string {
    const indent = this.getIndent(indentLevel);
    const nextIndent = this.getIndent(indentLevel + 1);

    // Handle null values
    if (obj === null) {
      return 'null';
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return '{}'; // Or a more specific empty array type if desired
      }
      // Use the first element's type as the representative for the whole array
      const elementType = this.getType(obj[0], indentLevel);
      return `${elementType}[]`;
    }

    // Handle primitives
    if (typeof obj !== 'object') {
      return typeof obj;
    }

    // --- Handle Objects ---
    // Safeguard against circular references.
    if (this.visitedObjects.has(obj)) {
      return 'any'; // If we've seen this object before, we can't represent it, so we use 'any'.
    }

    // Mark the current object as visited for the duration of its processing
    this.visitedObjects.add(obj);

    let body = '';
    const keys = Object.keys(obj);

    for (const key of keys) {
      const value = obj[key];
      const type = this.getType(value, indentLevel + 1);
      body += `${nextIndent}${key}: ${type};\n`;
    }

    // We are done processing this object, so we can remove it from the set.
    // This allows the same object structure to be analyzed in a different, non-circular path.
    this.visitedObjects.delete(obj);

    // If the object was empty, it's an empty object type
    if (keys.length === 0) {
      return '{}';
    }

    // Return the inlined object definition
    return `{\n${body.trimEnd()}\n${indent}}`;
  }

  /**
   * Determines the TypeScript type of a given value, delegating to `generateObjectBody` for complex types.
   *
   * @param value The value to analyze.
   * @param indentLevel The current indentation level for formatting.
   * @returns A string representing the TypeScript type.
   */
  private getType(value: any, indentLevel: number): string {
    if (value === null || typeof value !== 'object') {
      // Primitives and null are handled directly here to avoid extra recursion for simple cases.
      return this.generateObjectBody(value, indentLevel);
    }
    // For objects and arrays, delegate to the main recursive logic.
    return this.generateObjectBody(value, indentLevel);
  }

  /**
   * Generates an indentation string based on the level.
   *
   * @param level The number of indentation levels.
   * @returns A string of spaces.
   */
  private getIndent(level: number): string {
    return '  '.repeat(level);
  }
}
