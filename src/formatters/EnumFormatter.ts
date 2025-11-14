/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import {singular} from 'pluralize';
import {pascalCase} from 'change-case';

// helpers
import StringHelper from '~/helpers/StringHelper';

// core
import {ModelTemplateVars, sp} from '~/core/ModelGenerator';

// types
import type {GeneratorOptions} from '~/typings/generator';
import type {ColumnInfo} from '~/classes/TableColumns';

/**
 * EnumFormatter class responsible for generating TypeScript enum definitions
 * based on provided column information and values.
 */
export default class EnumFormatter {
  /**
   * Creates an instance of EnumFormatter.
   * @param params - The parameters containing column information and template variables.
   * @param options - The generator options.
   */
  constructor(public readonly params: { columnInfo: ColumnInfo, vars: ModelTemplateVars }, public readonly options: GeneratorOptions) {
  }

  /**
   * Generates TypeScript enum members from provided values
   *
   * @private
   * @description Converts enum values into properly formatted TypeScript enum members.
   * Handles both array-based and object-based enum definitions. For array values,
   * converts each value to PascalCase for the enum key. For object values, preserves
   * the original keys converted to PascalCase.
   *
   * @param {string[] | { [p: string]: number | string }} values - Either an array of string values
   * or an object with string keys and string/number values
   * @returns {string} Formatted string containing all enum member definitions with proper indentation
   *
   * @example
   * // Array input:
   * generateEnumValues(['active', 'inactive'])
   * // Returns:
   * // "  Active = 'active',\n  Inactive = 'inactive',\n"
   *
   * @example
   * // Object input:
   * generateEnumValues({ 'OPEN': 1, 'CLOSED': 2 })
   * // Returns:
   * // "  Open = 1,\n  Closed = 2,\n"
   */
  private generateEnumValues(values: string[] | { [p: string]: number | string }): string {
    if (Array.isArray(values)) {
      return values.map((x) => sp(2, `%s = '%s',\n`, pascalCase(x), x)).join('');
    }

    return Object.entries(values).map(([k, v]) => {
      return sp(2, `%s = %s,\n`, pascalCase(k), /\d+/.test(String(v)) ? v : `'${v}'`);
    }).join('');
  };

  /**
   * Generates TypeScript type definitions from provided values
   *
   * @private
   * @description Converts enum values into properly formatted TypeScript type definitions.
   * For array values, creates a union type of string literals. For object values,
   * creates an object type with PascalCase keys and appropriately typed values.
   *
   * @param {string[] | { [p: string]: number | string }} values - Either an array of string values
   * or an object with string keys and string/number values
   * @returns {string} Formatted string containing type definition
   *
   * @example
   * // Array input:
   * generateTypeValues(['active', 'inactive'])
   * // Returns:
   * // "'active' | 'inactive'"
   *
   * @example
   * // Object input:
   * generateTypeValues({ 'OPEN': 1, 'CLOSED': 2 })
   * // Returns:
   * // "  Open: 1,\n  Closed: 2,\n"
   */
  private generateTypeValues(values: string[] | { [p: string]: number | string }): string {
    if (Array.isArray(values)) {
      return values.map((x) => `'${x}'`).join(' | ');
    }

    return Object.entries(values).map(([k, v]) => {
      return sp(2, `%s: %s,\n`, pascalCase(k), /\d+/.test(String(v)) ? v : `'${v}'`);
    }).join('');
  }

  /**
   * Processes enum values and generates TypeScript enum definition
   * @param {string[] | { [p: string]: number | string }} values - Either an array of string values
   * or an object with string keys and string/number values that will become the enum members
   */
  public process(values: string[] | { [p: string]: number | string }): void {
    const {table, name} = this.params.columnInfo;
    const enumName = StringHelper.toConfigurableEnumName(table, name);

    if (!this.options.generator?.model?.replaceEnumsWithTypes) {
      this.params.vars.enums += sp(0, `\n/** Enum representing possible '%s' values for a '%s'. */\n`, name, singular(table));
      this.params.vars.enums += sp(0, `export enum %s {\n`, enumName);
      this.params.vars.enums += this.generateEnumValues(values);
      this.params.vars.enums += sp(0, `}\n`);
      return;
    }

    if (Array.isArray(values)) {
      this.params.vars.enums += sp(0, `\nexport type %s = %s;\n`, enumName, this.generateTypeValues(values));
      return;
    }

    this.params.vars.enums += sp(0, `\nexport const %s = {\n`, enumName);
    this.params.vars.enums += this.generateTypeValues(values);
    this.params.vars.enums += sp(0, `} as const;\n`);
    this.params.vars.enums += sp(0, `\nexport type %s = typeof %s [keyof typeof %s];\n`, enumName, enumName, enumName);
  }
}
