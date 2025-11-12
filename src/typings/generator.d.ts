import { MigrationOptions } from '~/core/MigrationGenerator';

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
  migrations?: MigrationOptions['generate'] | false;

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
}
