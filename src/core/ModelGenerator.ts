/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 *
 * @fileoverview This module provides comprehensive utilities for generating Sequelize model templates
 * from database table definitions. It includes functionality for creating TypeScript interfaces,
 * enums, field declarations, associations, and complete model configurations.
 *
 * The main class `ModelGenerator` serves as an abstract utility for transforming database
 * schema information into fully-featured Sequelize models with proper TypeScript typing.
 *
 * Key features:
 * - Automatic TypeScript type generation based on database column types
 * - Support for enums, JSON columns, and custom types
 * - Foreign key relationship handling with proper type references
 * - Index configuration generation
 * - Comprehensive JSDoc documentation generation
 * - Template-based code generation for consistent output
 *
 * @example
 * ```typescript
 * const templateVars = ModelGenerator.getModelTemplateVars({
 *   schemaName: 'public',
 *   modelName: 'User',
 *   tableName: 'users'
 * });
 * ```
 */

import { sprintf } from 'sprintf-js';
import { singular } from 'pluralize';
import { pascalCase } from 'change-case';

// classes
import { ColumnInfo } from '~/classes/TableColumns';

// parsers
import SequelizeParser from '~/parsers/SequelizeParser';

// helpers
import StringHelper from '~/helpers/StringHelper';

// utils
import TypeUtils from '~/classes/TypeUtils';
import TableUtils from '~/classes/TableUtils';

// types
import { ForeignKey, Relationship, TableIndex } from '~/typings/utils';
import {GeneratorOptions} from '~/typings/generator';

/**
 * Template variables for generating a Sequelize model
 * Contains all necessary components for building a complete model file including
 * imports, definitions, attributes, and configurations.
 *
 * @interface ModelTemplateVars
 * @description Represents all the template variables needed to generate a complete
 * Sequelize model file from database table information.
 */
export interface ModelTemplateVars {
  /** Database schema name where the table resides */
  schemaName: string;
  /** Import statements for required external modules and dependencies */
  imports: string;
  /** Import statements for related models used in associations */
  modelsImport: string;
  /** Name of the database table being modeled */
  tableName: string;
  /** Generated name of the TypeScript model class (PascalCase) */
  modelName: string;
  /** Generated TypeScript enum definitions for enum-type columns */
  enums: string;
  /** Generated TypeScript interface definitions for complex types */
  interfaces: string;
  /** Generated TypeScript field declarations with proper typing */
  fields: string;
  /** Generated Sequelize association declarations (belongsTo, hasMany, etc.) */
  associations: string;
  /** Generated Sequelize attribute configurations for the model */
  attributes: string;
  /** Generated model options configuration (tableName, schema, timestamps, etc.) */
  options: string;
  /** Import statements for custom type definitions */
  typesImport: string;
}

/**
 * Template variables for generating model initializer files
 * Contains components needed for the main index/init file that sets up all models
 *
 * @interface InitTemplateVars
 * @description Represents the template variables needed to generate the main
 * initializer file that imports and sets up all model associations.
 */
export interface InitTemplateVars {
  /** Import statements for all generated model classes */
  importClasses: string;
  /** Import statements for type definitions used across models */
  importTypes: string;
  /** Generated model association setup code */
  associations: string;
  /** Export statements for all generated model classes */
  exportClasses: string;
}

/**
 * Parameters for determining type text in field declarations
 *
 * @interface DetermineTypeTextParams
 * @description Configuration object containing all the necessary information
 * to determine the appropriate TypeScript type annotation for a model field.
 */
export interface DetermineTypeTextParams {
  /** Whether the column is a foreign key referencing another table */
  isFK: boolean;
  /** Complete column information including type, flags, and naming conventions */
  columnInfo: ColumnInfo;
  /** Base TypeScript type for the column */
  tsType: string;
  /** Name of the referenced table (for foreign keys) */
  targetTable: string | null;
  /** Name of the referenced column (for foreign keys) */
  targetColumn: string | null;
  generator?: GeneratorOptions['generator'];
}

/**
 * Parameters for generating TypeScript field declarations in the model
 *
 * @interface GenerateFieldsParams
 * @description Contains all the necessary information for generating TypeScript
 * field declarations for a database column, including column metadata, template
 * variables to modify, and relationship information.
 */
export interface GenerateFieldsParams {
  /** Complete column information including type, flags, and naming conventions */
  columnInfo: ColumnInfo;
  /** Template variables object to modify with generated field declaration */
  vars: ModelTemplateVars;
  /** Name of the model being generated (used for type resolution) */
  modelName: string;
  /** Whether the column is a foreign key referencing another table */
  isFK: boolean;
  /** Name of the referenced table (for foreign keys) */
  targetTable: string | null;
  /** Name of the referenced column (for foreign keys) */
  targetColumn: string | null;
  /** Generator options configuration */
  generator?: GeneratorOptions['generator'];
}

/**
 * Utility function that adds leading spaces and formats a string using sprintf
 *
 * @function sp
 * @description A utility function for formatting strings with proper indentation.
 * Commonly used throughout the codebase to maintain consistent code formatting.
 *
 * @param {number} count - Number of spaces to prepend to the formatted string
 * @param {string} [str=''] - Format string template (optional, defaults to empty string)
 * @param {...any[]} args - Arguments to be passed to sprintf for string formatting (optional)
 * @returns {string} Formatted string with the specified number of leading spaces
 *
 * @example
 * ```typescript
 * sp(2, 'hello %s', 'world') // Returns '  hello world'
 * ```
 */
export const sp = (count: number, str: string = '', ...args: any[]) => ' '.repeat(count) + sprintf(str, ...args);

/**
 * Abstract class for generating Sequelize model templates
 *
 * @class ModelGenerator
 * @description Provides comprehensive static methods for generating Sequelize model
 * files from database table definitions. This class handles all aspects of model
 * generation including TypeScript typing, Sequelize attributes, associations,
 * and configurations. All methods are static as this is a utility class.
 *
 * The generation process follows these steps:
 * 1. Create template variables with initial values
 * 2. Generate TypeScript interfaces and enums for complex types
 * 3. Generate field declarations with proper typing
 * 4. Generate Sequelize attribute configurations
 * 5. Generate model options and indexes
 * 6. Generate association code and imports
 *
 * @example
 * ```typescript
 * const templateVars = ModelGenerator.getModelTemplateVars();
 * ModelGenerator.generateFields(columnInfo, templateVars, 'User', options);
 * ```
 */
export default abstract class ModelGenerator {
  /**
   * Creates a new ModelTemplateVars object with all properties initialized to empty strings
   * Merges any provided partial variables with the defaults
   *
   * @function getModelTemplateVars
   * @description Factory method for creating template variables with default values.
   * This ensures all required properties are initialized with sensible defaults
   * before any generation begins.
   *
   * @param {Partial<ModelTemplateVars>} [vars={}] - Partial template variables to merge with default values
   * @returns {ModelTemplateVars} Complete ModelTemplateVars object with all properties initialized
   *
   * @example
   * ```typescript
   * const template = ModelGenerator.getModelTemplateVars({
   *   modelName: 'User',
   *   tableName: 'users'
   * });
   * ```
   */
  public static getModelTemplateVars = (vars: Partial<ModelTemplateVars> = {}): ModelTemplateVars => {
    return {
      schemaName: '',
      imports: '',
      modelsImport: '',
      modelName: '',
      enums: '',
      interfaces: '',
      tableName: '',
      fields: '',
      associations: '',
      attributes: '',
      options: '',
      typesImport: '',
      ...vars,
    };
  };

  /**
   * Creates a new InitTemplateVars object with all properties initialized to empty strings
   * Merges any provided partial variables with the defaults
   *
   * @function getInitializerTemplateVars
   * @description Factory method for creating initializer template variables.
   * Used for generating the main index file that imports and sets up all models.
   *
   * @param {Partial<InitTemplateVars>} [vars={}] - Partial template variables to merge with default values
   * @returns {InitTemplateVars} Complete InitTemplateVars object with all properties initialized
   *
   * @example
   * ```typescript
   * const initTemplate = ModelGenerator.getInitializerTemplateVars({
   *   importClasses: 'import User from \'./User\';'
   * });
   * ```
   */
  public static getInitializerTemplateVars = (vars: Partial<InitTemplateVars> = {}): InitTemplateVars => {
    return {
      importClasses: '',
      importTypes: '',
      associations: '',
      exportClasses: '',
      ...vars,
    };
  };

  /**
   * Determines the appropriate TypeScript type for a database column
   * Handles special cases for enum types (creates enum reference) and JSON types
   *
   * @function determineTsType
   * @description Analyzes column information and returns the appropriate TypeScript
   * type string. Special handling is provided for enum columns (which reference
   * generated enums) and JSON columns (which reference generated interfaces).
   *
   * @param {ColumnInfo} columnInfo - Complete column information including type parameters
   * @param {string} modelName - Name of the model being generated (used for enum naming)
   * @returns {string} TypeScript type string for the column
   *
   * @private
   * @static
   */
   private static determineTsType = (columnInfo: ColumnInfo, modelName: string): string => {
     if (SequelizeParser.isEnum(columnInfo.sequelizeTypeParams)) {
       return modelName + pascalCase(columnInfo.name);
     } else if (SequelizeParser.isJSON(columnInfo.sequelizeTypeParams)) {
       return TableUtils.toJsonColumnTypeName(columnInfo.table, columnInfo.name);
     } else {
       return columnInfo.tsType;
     }
   };

  /**
   * Determines the type annotation text for field declarations in the model
   * Handles foreign keys, primary keys, and nullable fields with appropriate Sequelize types
   *
   * @function determineTypeText
   * @description Generates the complete type annotation string for a model field.
   * Handles special cases for foreign keys (which reference other model fields),
   * primary keys (which are optional on creation), and nullable fields.
   *
   * @param {DetermineTypeTextParams} params - Configuration object containing column type information
   * @param {boolean} params.isFK - Whether the column is a foreign key referencing another table
   * @param {ColumnInfo} params.columnInfo - Complete column information including type parameters
   * @param {string} params.tsType - Base TypeScript type for the column
   * @param {string|null} params.targetTable - Name of the referenced table (for foreign keys)
   * @param {string|null} params.targetColumn - Name of the referenced column (for foreign keys)
   * @returns {string} Formatted type annotation string for the field declaration
   *
   * @private
   * @static
   */
  private static determineTypeText = (params: DetermineTypeTextParams): string => {
    const {isFK, columnInfo, tsType, targetTable, targetColumn} = params;

    const {primary, nullable} = columnInfo.flags;

    if (isFK && !primary) {
      return sp(0, `Sequelize.ForeignKey<%s['%s']>`, StringHelper.tableToModel(targetTable!), StringHelper.toPropertyName(targetColumn!));
    }

    if ( TypeUtils.isJSON(columnInfo.type) && columnInfo?.defaultValue?.toString?.()?.startsWith('[') ) {
      return sp(0, nullable || primary ? `Sequelize.CreationOptional<%s[]>` : `%s`, tsType);
    }

    return sp(0, nullable || primary ? `Sequelize.CreationOptional<%s>` : `%s`, tsType
      + (params?.generator?.model?.addNullTypeForNullable && nullable ? ' | null' : ''));
  };

  /**
   * Adds appropriate JSDoc comments for field declarations
   * Generates default comment for primary keys if none exists, or uses column comment
   *
   * @function addFieldComment
   * @description Adds JSDoc comments above field declarations in the generated model.
   * If the column is a primary key and has no comment, a default comment is generated.
   * Otherwise, the column's comment (if any) is used.
   *
   * @param {ModelTemplateVars} vars - Template variables object where the field text will be appended
   * @param {ColumnInfo} columnInfo - Column information containing comment and flag data
   *
   * @private
   * @static
   */
  private static addFieldComment = (vars: ModelTemplateVars, columnInfo: ColumnInfo): void => {
    if (columnInfo.flags.primary && !columnInfo.comment) {
      vars.fields += sp(2, '/** The unique identifier for the %s */\n', singular(columnInfo.table));
    }
    if (columnInfo.comment) {
      vars.fields += sp(2, '/** %s */\n', columnInfo.comment);
    }
  };

  /**
   * Generates TypeScript field declarations for a model column with proper typing and modifiers
   * Handles readonly for primary keys, nullable markers, and foreign key references
   *
   * @function generateFields
   * @description Creates the TypeScript field declaration for a single database column.
   * The generated field includes proper typing, readonly modifiers for primary keys,
   * nullable markers, and appropriate JSDoc comments.
   *
   * @param {GenerateFieldsParams} params - Parameters object containing column information and generation context
   * @param {ColumnInfo} params.columnInfo - Column information including type, flags, and naming
   * @param {ModelTemplateVars} params.vars - Template variables object to modify with generated field declaration
   * @param {string} params.modelName - Name of the model being generated (used for type resolution)
   * @param {boolean} params.isFK - Whether the column is a foreign key
   * @param {string|null} params.targetTable - Name of the referenced table (if foreign key)
   * @param {string|null} params.targetColumn - Name of the referenced column (if foreign key)
   * @param {GeneratorOptions['generator']} [params.generator] - Generator options configuration
   */
   public static generateFields = (params: GenerateFieldsParams) => {
    const readOnly = params.columnInfo.flags.primary ? 'readonly ' : '';
    const tsType = this.determineTsType(params.columnInfo, params.modelName);

    this.addFieldComment(params.vars, params.columnInfo);

    const typeText = this.determineTypeText({
      isFK: params.isFK,
      columnInfo: params.columnInfo,
      tsType,
      targetTable: params.targetTable,
      targetColumn: params.targetColumn,
      generator: params.generator,
    });

    const nullable = params.columnInfo.flags.nullable ? '?' : '';
    params.vars.fields += sp(2, `%sdeclare %s%s: %s;\n`, readOnly, params.columnInfo.propertyName, nullable, typeText);
  };

  /**
   * Generates a TypeScript interface definition for a column
   * Creates an interface with generic string index signature for JSON columns
   *
   * @function generateInterfaceDefinition
   * @description Creates a TypeScript interface definition for JSON columns.
   * If a custom interface is provided in the column info, it's used directly.
   * Otherwise, a generic interface with a string index signature is generated.
   *
   * @param {ColumnInfo} columnInfo - Column information containing table name and interface definition
   * @param {{text: string}} interfacesVars - Object containing the accumulated interface text
   *
   * @private
   * @static
   */
  private static generateInterfaceDefinition = (columnInfo: ColumnInfo, interfacesVars: { text: string }): void => {
    const typeName = TableUtils.toJsonColumnTypeName(columnInfo.table, columnInfo.name);

    if (!columnInfo?.tsInterface || !columnInfo?.tsInterface?.includes?.('interface')) {
      interfacesVars.text += sp(0, `\n/** Interface representing the structure of the '%s'.'%s' metadata field. */\n`, columnInfo.table, columnInfo.name);
      interfacesVars.text += sp(0, `\nexport interface %s {\n`, typeName);
      interfacesVars.text += sp(2, `[p: string]: unknown;\n`);
      interfacesVars.text += sp(0, `}\n`);
    } else {
      interfacesVars.text += sp(0, `\nexport %s\n`, columnInfo?.tsInterface.trim());
    }
  };

  /**
   * Generates TypeScript interfaces for complex column types (primarily JSON columns)
   * Creates the interface definition and adds the appropriate type import
   *
   * @function generateInterfaces
   * @description Generates TypeScript interfaces for columns that require custom typing,
   * primarily JSON columns. The generated interface is added to the interfaces section
   * and its type is added to the imports section.
   *
   * @param {ColumnInfo} columnInfo - Column information including type and interface definition
   * @param {ModelTemplateVars} vars - Template variables object to modify with type imports
   * @param {{text: string}} interfacesVars - Object containing the generated interface text
   *
   * @public
   * @static
   */
  public static generateInterfaces = (columnInfo: ColumnInfo, vars: ModelTemplateVars, interfacesVars: {
    text: string
  }) => {
    if (!TypeUtils.isJSON(columnInfo.type)) {
      return;
    }

    this.generateInterfaceDefinition(columnInfo, interfacesVars);

    const typeName = TableUtils.toJsonColumnTypeName(columnInfo.table, columnInfo.name);
    vars.typesImport += sp(0, ', %s', typeName);
  };

  /**
   * Formats enum values for TypeScript enum generation
   * Converts values to PascalCase keys with string values
   *
   * @function generateEnumValues
   * @description Takes an array of enum string values and formats them into
   * TypeScript enum members. Each value is converted to PascalCase for the
   * key and the original value is used as the string value.
   *
   * @param {string[]} values - Array of enum string values
   * @returns {string} Formatted string containing all enum member definitions
   *
   * @private
   * @static
   *
   * @example
   * ```typescript
   * generateEnumValues(['active', 'inactive'])
   * // Returns:
   * // "  Active = 'active',\n  Inactive = 'inactive',\n"
   * ```
   */
  private static generateEnumValues = (values: string[]): string => {
    return values.map((x) => sp(2, `%s = '%s',\n`, pascalCase(x), x)).join('');
  };

  /**
   * Generates TypeScript enum definitions for database columns with enum types
   * Creates a named enum with PascalCase keys and documentation
   *
   * @function generateEnums
   * @description Creates TypeScript enum definitions for database columns that
   * use the ENUM type. The enum is named using the model name and column name
   * in PascalCase, and includes JSDoc documentation.
   *
   * @param {ColumnInfo} columnInfo - Column information containing enum type parameters
   * @param {ModelTemplateVars} vars - Template variables object to modify with generated enum
   * @param {string} modelName - Name of the model (used to prefix the enum name)
   *
   * @public
   * @static
   */
  public static generateEnums = (columnInfo: ColumnInfo, vars: ModelTemplateVars, modelName: string) => {
    const values = SequelizeParser.parseEnums(columnInfo.sequelizeTypeParams);
    if (!values.length) return;

    vars.enums += sp(0, `\n/** Enum representing possible %s values for a %s. */\n`, columnInfo.name, singular(columnInfo.table));
    vars.enums += sp(0, `export enum %s%s {\n`, modelName, pascalCase(columnInfo.name));
    vars.enums += this.generateEnumValues(values);
    vars.enums += sp(0, `}\n`);
  };

  /**
   * Generates basic model configuration options
   * Sets up sequelize instance, schema, and table name
   *
   * @function generateBasicOptions
   * @description Adds the fundamental configuration options for a Sequelize model,
   * including the database connection instance, schema name, and table name.
   * These are the minimum required options for any model definition.
   *
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with options
   * @param {Object} options - Configuration containing schema and table names
   * @param {string} options.schemaName - Database schema name
   * @param {string} options.tableName - Database table name
   *
   * @private
   * @static
   */
  private static generateBasicOptions = (
    modTplVars: ModelTemplateVars,
    { schemaName, tableName }: { schemaName: string; tableName: string },
  ): void => {
    modTplVars.options += sp(4, `sequelize: getInstance(),\n`);
    modTplVars.options += sp(4, `schema: '%s',\n`, schemaName);
    modTplVars.options += sp(4, `tableName: '%s',\n`, tableName);
  };

  /**
   * Generates timestamp configuration options for the model
   * Handles createdAt and updatedAt timestamps with individual control
   *
   * @function generateTimestampOptions
   * @description Configures timestamp options for the model. Allows independent
   * control over createdAt and updatedAt timestamps. If only one is enabled,
   * the appropriate configuration is added to enable just that timestamp.
   *
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with timestamp options
   * @param {Object} options - Timestamp configuration
   * @param {boolean} options.hasCreatedAt - Whether the model should track creation timestamps
   * @param {boolean} options.hasUpdatedAt - Whether the model should track update timestamps
   *
   * @private
   * @static
   */
  private static generateTimestampOptions = (
    modTplVars: ModelTemplateVars,
    { hasCreatedAt, hasUpdatedAt }: { hasCreatedAt: boolean; hasUpdatedAt: boolean },
  ): void => {
    modTplVars.options += sp(4, `timestamps: %s,\n`, hasCreatedAt && hasUpdatedAt ? 'true' : 'false');

    if (!hasUpdatedAt && hasCreatedAt) {
      modTplVars.options += sp(4, `createdAt: true,\n`);
    }

    if (!hasCreatedAt && hasUpdatedAt) {
      modTplVars.options += sp(4, `updatedAt: true,\n`);
    }
  };

  /**
   * Generates complete model options configuration
   * Combines basic options (schema, table) with timestamp configurations
   *
   * @function generateOptions
   * @description Generates the complete options configuration for a Sequelize model.
   * This includes basic options (schema, table, sequelize instance) and timestamp
   * configurations. The method delegates to helper methods for each option type.
   *
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with all options
   * @param {Object} options - Complete configuration including schema, table, and timestamp settings
   * @param {string} options.schemaName - Database schema name
   * @param {string} options.tableName - Database table name
   * @param {boolean} options.hasCreatedAt - Whether to track creation timestamps
   * @param {boolean} options.hasUpdatedAt - Whether to track update timestamps
   *
   * @public
   * @static
   */
  public static generateOptions = (
    modTplVars: ModelTemplateVars,
    options: { schemaName: string; tableName: string; hasCreatedAt: boolean; hasUpdatedAt: boolean },
  ) => {
    this.generateBasicOptions(modTplVars, options);
    this.generateTimestampOptions(modTplVars, options);
  };

  /**
   * Generates a single database index configuration for the model
   * Creates index definition with name, fields, type, and uniqueness properties
   *
   * @function generateSingleIndex
   * @description Generates the configuration for a single database index.
   * Includes the index name, fields, type (e.g., BTREE, HASH), and uniqueness.
   * If the index has a comment, it's added as a JSDoc comment.
   *
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with index configuration
   * @param {TableIndex} index - Complete index definition including columns and properties
   *
   * @private
   * @static
   */
  private static generateSingleIndex = (modTplVars: ModelTemplateVars, index: TableIndex): void => {
    if (index.comment) {
      modTplVars.options += sp(6, `/** %s */\n`, index.comment);
    }

    modTplVars.options += sp(6, `{\n`);
    modTplVars.options += sp(8, `name: '%s',\n`, index.name);
    modTplVars.options += sp(8, `fields: [%s],\n`, index.columns.map((x) => `'${x}'`).join(', '));

    if (index.type) {
      modTplVars.options += sp(8, `using: '%s',\n`, index.type.toUpperCase());
    }

    if (index.constraint === 'UNIQUE') {
      modTplVars.options += sp(8, `unique: true,\n`);
    }

    modTplVars.options += sp(6, `},\n`);
  };

  /**
   * Generates index configurations for all table indexes
   * Wraps individual index definitions in the indexes array property
   *
   * @function generateIndexes
   * @description Generates the complete indexes configuration for a model.
   * Takes an array of table indexes and generates the Sequelize configuration
   * for all of them. If no indexes are provided, nothing is added.
   *
   * @param {TableIndex[]} indexes - Array of all table indexes to generate configurations for
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with index array
   *
   * @public
   * @static
   */
  public static generateIndexes = (indexes: TableIndex[], modTplVars: ModelTemplateVars) => {
    if (!indexes.length) return;

    modTplVars.options += sp(4, `indexes: [\n`);
    for (const index of indexes) {
      this.generateSingleIndex(modTplVars, index);
    }
    modTplVars.options += sp(4, `]\n`);
  };

  /**
   * Generates the field name and field property for a column attribute
   * Creates the attribute object and adds field mapping if property name differs from column name
   *
   * @function generateAttributeField
   * @description Creates the field definition for a Sequelize attribute. If the
   * TypeScript property name differs from the database column name (due to
   * case conversion), a field mapping is added to maintain the connection.
   *
   * @param {ColumnInfo} columnInfo - Column information containing name and property name
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with attribute definition
   *
   * @private
   * @static
   */
  private static generateAttributeField = (columnInfo: ColumnInfo, modTplVars: ModelTemplateVars): void => {
    modTplVars.attributes += sp(4, `%s: {\n`, columnInfo.propertyName);

    if (columnInfo.propertyName !== columnInfo.name) {
      modTplVars.attributes += sp(6, `field: '%s',\n`, columnInfo.name);
    }
  };

  /**
   * Generates the reference configuration for foreign key attributes
   * Creates the references object with model and key properties for foreign keys
   *
   * @function generateAttributeReference
   * @description Generates the reference configuration for foreign key attributes.
   * This includes the referenced model and key, and optionally the deferrable
   * constraint configuration for PostgreSQL.
   *
   * @param {ForeignKey|null} foreignKey - Foreign key relationship information
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with reference configuration
   *
   * @private
   * @static
   */
  private static generateAttributeReference = (foreignKey: ForeignKey | null, modTplVars: ModelTemplateVars): void => {
    if (!foreignKey) return;

    modTplVars.attributes += sp(6, `references: {\n`);
    modTplVars.attributes += sp(8, `model: %s,\n`, StringHelper.tableToModel(foreignKey.referenced.table!));
    modTplVars.attributes += sp(8, `key: '%s',\n`, StringHelper.toPropertyName(foreignKey.referenced.column!));

    if (foreignKey.isDeferrable) {
      modTplVars.attributes += sp(8, `deferrable: true,\n`);
    }

    modTplVars.attributes += sp(6, `},\n`);
  };

  /**
   * Generates the type configuration for a column attribute
   * Handles various type formats including quoted types, commented types, raw types, and standard DataTypes
   *
   * @function generateAttributeType
   * @description Generates the type configuration for a Sequelize attribute.
   * Handles various type formats including:
   * - Quoted types for custom types ($QUOTE prefix)
   * - Commented types with inline documentation ($COMMENT prefix)
   * - Raw types with getter/setter implementations ($RAW prefix)
   * - Standard Sequelize DataTypes
   *
   * @param {ColumnInfo} columnInfo - Column information containing sequelize type parameters
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with type configuration
   *
   * @private
   * @static
   */
  private static generateAttributeType = (columnInfo: ColumnInfo, modTplVars: ModelTemplateVars): void => {
    let sequelizeType = columnInfo.sequelizeTypeParams;

    if (!sequelizeType || sequelizeType === 'null') {
      modTplVars.attributes += sp(6, `type: DataTypes.%s, // TODO Set data type here. \n`, 'UNKNOWN');
      return;
    }

    if (sequelizeType.startsWith('$QUOTE')) {
      sequelizeType = sequelizeType.replace('$QUOTE.', '');
      modTplVars.attributes += sp(6, `type: '%s',\n`, sequelizeType);
    } else if (sequelizeType.startsWith('$COMMENT')) {
      const [ty, cm] = sequelizeType.replace('$COMMENT.', '').split('|');
      modTplVars.attributes += sp(6, `type: DataTypes.%s, // %s\n`, ty, cm);
    } else if (sequelizeType.startsWith('$RAW')) {
      const [x, y] = sequelizeType.replace('$RAW.', '').split('|');
      sequelizeType = x;
      modTplVars.attributes += sp(6, `type: '%s', // %s\n`, sequelizeType, y || 'PostgreSQL\'s Native Custom (Composite) Type.');
      modTplVars.attributes += sp(6, `get() {\n`);
      modTplVars.attributes += sp(8, `const rawValue = this.getDataValue('%s');\n`, columnInfo.propertyName);
      modTplVars.attributes += sp(8, `// TODO: Implement getter logic here!\n`);
      modTplVars.attributes += sp(8, `return rawValue;\n`);
      modTplVars.attributes += sp(6, `},\n`);

      modTplVars.attributes += sp(6, `set(value: string) {\n`);
      modTplVars.attributes += sp(8, `// TODO: Implement setter logic here!\n`);
      modTplVars.attributes += sp(8, `this.setDataValue('%s', value);\n`, columnInfo.propertyName);
      modTplVars.attributes += sp(6, `},\n`);
    } else {
      if (TypeUtils.isArray(columnInfo.type) || TypeUtils.isRange(columnInfo.type)) {
        sequelizeType = sequelizeType.replace('(', '(DataTypes.');
      }
      modTplVars.attributes += sp(6, `type: DataTypes.%s,\n`, sequelizeType);
    }
  };

  /**
   * Generates flag configurations for a column attribute
   * Adds primaryKey and autoIncrement flags when applicable
   *
   * @function generateAttributeFlags
   * @description Generates boolean flag configurations for a Sequelize attribute.
   * Currently, handles primaryKey and autoIncrement flags. These are added
   * only when the corresponding column flags are set to true.
   *
   * @param {ColumnInfo} columnInfo - Column information containing various boolean flags
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with flag configurations
   *
   * @private
   * @static
   */
  private static generateAttributeFlags = (columnInfo: ColumnInfo, modTplVars: ModelTemplateVars): void => {
    if (columnInfo.flags.primary) {
      modTplVars.attributes += sp(6, `primaryKey: true,\n`);
    }

    if (columnInfo.flags.autoIncrement) {
      modTplVars.attributes += sp(6, `autoIncrement: true,\n`);
    }
  };

  /**
   * Generates default value configuration for a column attribute
   * Handles JSON, date, and primitive value defaults with appropriate formatting
   *
   * @function generateAttributeDefault
   * @description Generates the default value configuration for a column attribute.
   * Handles different default value types:
   * - JSON values are formatted with single quotes and spaces
   * - Primitive values are used as-is
   * - Date values use Sequelize.literal for database functions like CURRENT_TIMESTAMP
   *
   * @param {ColumnInfo} columnInfo - Column information containing default value and type
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with default value configuration
   *
   * @private
   * @static
   */
  private static generateAttributeDefault = (columnInfo: ColumnInfo, modTplVars: ModelTemplateVars): void => {
    if (columnInfo.defaultValue) {
      if (TypeUtils.isJSON(columnInfo.type)) {
        const formatted = String(columnInfo.defaultValue ?? '')
          .replaceAll('"', '\'')
          .replaceAll('{', '{ ')
          .replaceAll('}', ' }');
        modTplVars.attributes += sp(6, `defaultValue: %s,\n`, formatted);
      } else if (!TypeUtils.isDate(columnInfo.type)) {
        modTplVars.attributes += sp(6, `defaultValue: %s,\n`, columnInfo.defaultValue);
      } else {
        if (columnInfo.defaultValueRaw?.startsWith?.('CURRENT_')) modTplVars.attributes += sp(6, `defaultValue: Sequelize.literal('%s'),\n`, columnInfo.defaultValueRaw);
      }
    }
  };

  /**
   * Generates complete Sequelize model attribute configurations for a column
   * Combines field definition, references, type, flags, comments, defaults, and nullable settings
   *
   * @function generateAttributes
   * @description Generates the complete attribute configuration for a single column.
   * This is a comprehensive method that combines all aspects of attribute
   * configuration including field mapping, foreign key references, type definition,
   * boolean flags, comments, default values, and nullability.
   *
   * @param {Object} params - Parameter object
   * @param {ColumnInfo} params.columnInfo - Complete column information including type, flags, and properties
   * @param {ModelTemplateVars} params.modTplVars - Template variables object to modify with generated attribute configuration
   * @param {ForeignKey[]} params.tableForeignKeys - Array of all foreign key relationships for the table
   *
   * @public
   * @static
   */
  public static generateAttributes = (params: {
    columnInfo: ColumnInfo;
    modTplVars: ModelTemplateVars;
    tableForeignKeys: ForeignKey[];
  }) => {
    const { columnInfo, modTplVars, tableForeignKeys } = params;
    const foreignKey = tableForeignKeys.find((x) => x.columnName === columnInfo.name) ?? null;

    this.generateAttributeField(columnInfo, modTplVars);
    this.generateAttributeReference(foreignKey, modTplVars);
    this.generateAttributeType(columnInfo, modTplVars);
    this.generateAttributeFlags(columnInfo, modTplVars);

    if (columnInfo.comment) {
      modTplVars.attributes += sp(6, `comment: '%s',\n`, columnInfo.comment);
    }

    this.generateAttributeDefault(columnInfo, modTplVars);

    modTplVars.attributes += sp(6, `allowNull: %s,\n`, String(columnInfo.flags.nullable));
    modTplVars.attributes += sp(4, `},\n`);
  };

  /**
   * Generates import statement for a single related model
   * Tracks imported models to avoid duplicates and adds import statement to modelsImport
   *
   * @function generateSingleModelImport
   * @description Generates an import statement for a single model that is
   * referenced in associations. Tracks which models have already been imported
   * to avoid duplicate imports. The import statement follows the pattern:
   * import ModelName from './ModelName';
   *
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with import statements
   * @param {Relationship} tableRelation - Relationship configuration containing target model information
   * @param {string[]} imported - Array tracking already imported table names to prevent duplicates
   *
   * @private
   * @static
   */
  private static generateSingleModelImport = (
    modTplVars: ModelTemplateVars,
    tableRelation: Relationship,
    imported: string[],
  ): void => {
    if (imported.includes(tableRelation.target.table)) return;

    imported.push(tableRelation.target.table);
    modTplVars.modelsImport += sp(
      0,
      'import %s from \'./%s\';\n',
      StringHelper.tableToModel(tableRelation.target.table),
      StringHelper.tableToModel(tableRelation.target.table),
    );
  };

  /**
   * Generates import statements for all related models used in associations
   * Creates a section of imports for models referenced by foreign keys and relationships
   *
   * @function generateRelationsImports
   * @description Generates all import statements for models that are referenced
   * in associations. The imports are organized in a dedicated section with a
   * comment header. Each model is imported only once, even if referenced in
   * multiple relationships.
   *
   * @param {Relationship[]} tableRelations - Array of all relationship configurations for the table
   * @param {ModelTemplateVars} modTplVars - Template variables object to modify with generated import statements
   *
   * @public
   * @static
   */
  public static generateRelationsImports = (tableRelations: Relationship[], modTplVars: ModelTemplateVars) => {
    if (!tableRelations.length) return;

    const imported: string[] = [];
    modTplVars.modelsImport += `\n\n// models\n`;

    for (const tableRelation of tableRelations) {
      this.generateSingleModelImport(modTplVars, tableRelation, imported);
    }
  };
}
