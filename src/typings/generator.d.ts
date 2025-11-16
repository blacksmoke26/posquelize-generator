/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 *
 * Configuration interface for the database model generator.
 * Defines options for controlling model generation, migrations, diagrams,
 * repositories, and various output formatting preferences.
 */

/**
 * Configuration options for the generator
 */
export interface GeneratorOptions {
  /**
   * The directory name where generated files will be placed
   * @default 'database'
   */
  dirname?: string;
  /**
   * List of schemas to generate models for
   */
  schemas?: string[];
  /**
   * List of tables to generate models for
   */
  tables?: string[];
  /**
   * Whether to clean the root directory before generation
   * @default false
   */
  cleanRootDir?: boolean;

  /**
   * Configuration options specific to the code generator behavior and output formatting.
   * These options control how the generated TypeScript models and types are constructed,
   * allowing for customization of the code generation process to match specific project
   * requirements and coding standards.
   */
  generator?: {
    /**
     * Configuration options for model generation, controlling how TypeScript models
     * and their properties are generated from database schemas.
     */
    model?: {
      /**
       * Controls whether nullable database columns should be explicitly typed with
       * the `null` type in the generated Model TypeScript property declaration.
       *
       * When enabled (true), nullable columns will be typed as `T | null` where T is the
       * base type. When disabled (false), nullable columns will use the base type only,
       * relying on TypeScript's strict null checking settings to determine nullability.
       *
       * This option is particularly useful when working with TypeScript's strict null
       * checks or when you need explicit null handling in your generated types.
       *
       * @default true
       * @example  When set to true
       * ```typescript
       * declare role?: Sequelize.CreationOptional<string | null>  // nullable column
       * declare role: Sequelize.CreationOptional<string>  // non-null column
       * ```
       * @example When set to false
       * ```typescript
       * declare role?: Sequelize.CreationOptional<string>  // nullable column
       * declare role: Sequelize.CreationOptional<string>  // non-null column
       * ```
       */
      addNullTypeForNullable?: boolean;
      /**
       * Determines whether database enum columns should be generated as TypeScript union types
       * rather than native TypeScript enums in the model definitions.
       *
       * When enabled, enum columns are transformed into string literal union types,
       * enhancing type safety during compilation and eliminating runtime enum overhead.
       * When disabled, the generator creates standard TypeScript enum declarations.
       *
       * This configuration is beneficial for:
       * - Achieving compile-time type checking for enum values
       * - Reducing bundle size by avoiding enum object generation at runtime
       * - Improving code maintainability with explicit value representation
       * - Ensuring consistent type behavior across different execution environments
       *
       * @default false
       * @example When enabled
       * ```typescript
       * // Generated with replaceEnumsWithTypes: true
       * declare status?: CreationOptional<'active' | 'inactive' | 'pending'>;
       * ```
       * @example When disabled
       * ```typescript
       * // Generated with replaceEnumsWithTypes: false
       * declare status?: CreationOptional<UserStatus>;
       * ```
       */
      replaceEnumsWithTypes?: boolean;
    },
    /**
     * Configuration for handling database enums during model generation.
     * Each enum definition maps to a database column with an enum constraint,
     * specifying the allowed values that can be stored in that column.
     */
    enums?: Array<{
      /**
       * The full path to the database column that has an enum constraint.
       * The path follows the format `schemaName.tableName.columnName`, where:
       * - schemaName: The database schema name (e.g., "public")
       * - tableName: The name of the table containing the enum column
       * - columnName: The name of the column with the enum constraint
       *
       * This precise path ensures accurate identification of the enum location
       * in the database schema, allowing for proper type generation and validation.
       *
       * @example
       * ```typescript
       * path: "public.users.status"  // Schema: public, Table: users, Column: status
       * path: "auth.accounts.role"   // Schema: auth, Table: accounts, Column: role
       * ```
       */
      path: `${string}.${string}.${string}`,
      /**
       * The allowed values for the enum, defining the valid options that can be
       * stored in the database column. This can be provided in two formats:
       *
       * 1. String Array: A simple array of string values when the enum represents
       *    a basic list of options without associated numeric values
       * 2. Object Map: A key-value mapping where keys represent the enum member names
       *    and values can be either strings or numbers, useful when the enum has
       *    specific numeric mappings or needs to preserve both names and values
       *
       * The format chosen affects how the TypeScript enum types are generated.
       * Arrays create simple string enums, while object maps create enums with
       * explicit member names and values.
       *
       * @example
       * ```typescript
       * // String array format - creates a simple string enum
       * values: ["admin", "user", "moderator"]
       *
       * // Object map format - creates an enum with explicit values
       * values: {active: 10, inactive: 5, deleted: 0, suspended: 3}
       *
       * // Mixed string and number values
       * values: {draft: "draft", published: 1, archived: "archived"}
       * ```
       */
      values: (string[]) | { [k: string]: string | number },
      /**
       * The default value for the enum column when no explicit value is provided.
       * This can be either a string or number value that matches one of the enum's
       * allowed values. When specified, the database will automatically use this
       * value for new records if no enum value is explicitly set.
       *
       * The default value must be compatible with the enum's value type:
       * - For string array enums, provide a string that exists in the array
       * - For object map enums, provide either a string key or a numeric value
       *   that exists in the map
       *
       * @example
       * ```typescript
       * // For string array enum
       * values: ["admin", "user", "guest"]
       * defaultValue: "guest"  // Uses default of "guest"
       *
       * // For object map enum
       * values: {active: 1, inactive: 0}
       * defaultValue: 1  // Uses default of "active" (value 1)
       * ```
       */
      defaultValue?: string | number;
    }>,
    /**
     * Configuration options for migration file generation. These settings control
     * how database migration files are created and formatted, allowing for
     * customization of the migration output to match specific project requirements
     * and build environments.
     */
    migration?: {
      /**
       * Determines whether migration files should be generated using CommonJS module
       * syntax instead of ECMAScript modules (ESM). This option is particularly useful
       * for maintaining compatibility with older Node.js environments or build systems
       * that rely on CommonJS for their module loading mechanism.
       *
       * When enabled (true):
       * - Files will use require() for imports
       * - Exports will use module.exports
       * - Generated files will have .js extension with CommonJS syntax
       *
       * When disabled (false):
       * - Files will use ES6 import/export syntax
       * - Generated files will use ESM module format
       * - Better compatibility with modern TypeScript configurations
       *
       * This setting affects only the syntax of generated migration files and does
       * not impact the actual migration functionality or database operations.
       *
       * @default false
       * @example
       * // CommonJS output (useCommonJs: true)
       * module.exports = {
       *   up: async (queryInterface, Sequelize) => { ... },
       *   down: async (queryInterface, Sequelize) => { ... }
       * };
       *
       * // ESM output (useCommonJs: false)
       * export async function up (queryInterface, Sequelize) { ... },
       * export async function down (queryInterface, Sequelize) { ... },
       */
      useCommonJs?: boolean;
    },
  };

  /**
   * Controls the generation of database migration files. When enabled, creates
   * migration scripts that can recreate the database schema in another environment.
   *
   * The migration files include:
   * - Table creation statements with all columns and constraints
   * - Index definitions (unique, primary, and regular indexes)
   * - Foreign key constraints and relationships
   * - Schema-specific considerations and naming conventions
   *
   * Set false to disable migration generation entirely. When truthy, accepts
   * configuration options from MigrationOptions['generate'] to customize the
   * migration generation behavior.
   *
   * Migration files are generated in the migrations subdirectory of the base
   * output directory and follow the Knex migration format with up() and down()
   * methods for rollback support.
   *
   * @default true
   * @example
   * ```typescript
   * // Disable migrations
   * { migrations: false }
   *
   * // Enable with custom options
   * { migrations: { indexes: true, foreignKeys: true } }
   * ```
   * @see MigrationGenerator For the underlying migration generation implementation
   */
  migrations?: {
    /** Generate migration files for table indexes */
    indexes?: boolean;
    /** Generate initial seeder files for database records */
    seeders?: boolean;
    /** Generate migration files for database functions */
    functions?: boolean;
    /** Generate migration files for custom domains */
    domains?: boolean;
    /** Generate migration files for composite types */
    composites?: boolean;
    /** Generate migration files for table structures */
    tables?: boolean;
    /** Generate migration files for database views */
    views?: boolean;
    /** Generate migration files for database triggers */
    triggers?: boolean;
    /** Generate migration files for foreign key constraints */
    foreignKeys?: boolean;
  } | false;

  /**
   * Whether to generate Entity Relationship Diagram (ERD) files for the database schema.
   * When enabled, creates visual representations of the database structure including
   * tables, relationships, constraints, and schema metadata.
   *
   * Diagram files are generated in the diagrams subdirectory of the base output directory
   * and can be used for documentation and database visualization purposes.
   *
   * @default true
   * @example
   * ```typescript
   * // Disable diagram generation
   * { diagram: false }
   * ```
   */
  diagram?: boolean;

  /**
   * Controls the generation of repository pattern files for each model. When enabled,
   * creates repository classes that encapsulate database operations and provide a
   * clean abstraction layer for data access.
   *
   * Repository files include:
   * - Base repository interface with common CRUD operations
   * - Concrete repository implementations for each model
   * - Type-safe method signatures for database operations
   * - Integration with Sequelize models and associations
   * - Query builder methods for complex data retrieval
   *
   * The repository pattern helps to:
   * - Separate business logic from data access logic
   * - Improve code testability and maintainability
   * - Provide a consistent API for database operations
   * - Enable easier switching of data sources
   * - Reduce code duplication across the application
   *
   * Repository files are generated in the repositories subdirectory of the base
   * output directory and follow TypeScript best practices with proper typing and
   * documentation.
   *
   * @default true
   * @example
   * ```typescript
   * // Disable repository generation
   * { repositories: false }
   *
   * // Enable repository generation (default)
   * { repositories: true }
   * ```
   */
  repositories?: boolean;

  // Path to directory containing custom templates for code generation
  templatesDir?: string;
}

/** Configuration file for generator  */
export interface GenerateConfigFile extends GeneratorOptions {
  /** Database connection configuration */
  connection: {
    /** Host name / IP address */
    host: string;
    /** Username for database */
    username: string;
    /** The password for database authentication */
    password: string;
    /** The database name */
    database: string;
    /** The port to connect */
    port: number;
  };

  /** Output directory where generated files will be placed */
  outputDir?: string;
}
