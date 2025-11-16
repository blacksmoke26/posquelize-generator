/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 *
 * @fileoverview
 * MigrationGenerator is a comprehensive utility class designed to automate the generation of database migration files.
 * It supports creating migrations for tables, indexes, foreign keys, views, triggers, functions, composites, domains,
 * and initial seeders. The class works with PostgreSQL databases through the Knex.js query builder.
 *
 * Key features:
 * - Generates timestamped migration files with proper naming conventions
 * - Handles multiple database schemas
 * - Creates migrations for all database objects in a logical order
 * - Supports foreign key relationships and constraints
 * - Generates initial seeder files for database records
 * - Provides configurable output directories and timestamps
 *
 * Dependencies:
 * - Knex.js for database operations
 * - Moment.js for timestamp handling
 * - Deepmerge for object merging
 *
 * Usage:
 * ```typescript
 * const generator = new MigrationGenerator(knex, data, options);
 * await generator.generate();
 * ```
 */

// classes
import DbUtils from '~/classes/DbUtils';
import MigrationHandler from './MigrationHandler';
import TemplateWriter from './TemplateWriter';
import TableColumns from '~/classes/TableColumns';

// helpers
import FileHelper from '~/helpers/FileHelper';
import DateTimeHelper from '~/helpers/DateTimeHelper';

// formatters
import MigrationFormatter from '~/formatters/MigrationFormatter';

// types
import type {Knex} from 'knex';
import type {ForeignKey, TableIndex} from '~/typings/utils';
import type {GeneratorOptions} from '~/typings/generator';

/**
 * Configuration interface for migration generation.
 * Contains all necessary settings for generating migration files including
 * directory paths and timestamp management.
 */
export interface MigrationConfig {
  /** The directory name where the migration is being processed */
  dirname: string;
  /** The output directory where migration files will be generated */
  outDir: string;
  /** The root directory of the project */
  rootDir: string;
  /** The timestamp for the migration generation */
  timestamp: Date;
  /** Function to get the timestamp as a number formatted for migration filenames */
  getTime(): number;
}

/**
 * Class responsible for generating database migration files
 *
 * This class orchestrates the creation of migration files for all database objects
 * including tables, indexes, foreign keys, views, triggers, functions, composites,
 * domains, and initial seeders. It processes schemas in a systematic order to ensure
 * proper dependency handling.
 */
export default class MigrationGenerator {
  private writer: InstanceType<typeof TemplateWriter>;
  private handler: InstanceType<typeof MigrationHandler>;

  /**
   * Creates an instance of MigrationGenerator
   *
   * @param knex - Knex instance for database operations
   * @param data - Migration data containing schemas, indexes and foreign keys
   * @param options - Migration options including directory paths
   */
  constructor(
    public readonly knex: Knex,
    public readonly data: {
      schemas: Readonly<string[]>;
      indexes: TableIndex[];
      foreignKeys: ForeignKey[];
      outDir: string;
      rootDir: string;
    },
    public readonly options: Required<GeneratorOptions>,
  ) {
    this.writer = new TemplateWriter(this.options);
    this.handler = new MigrationHandler(this.writer, this.options);
  }

  /**
   * Gets the migration configuration object
   *
   * Initializes configuration with current timestamp and directory settings.
   * The timestamp function increments by 30 seconds to ensure unique filenames.
   *
   * @returns The migration configuration with timestamp and directory settings
   */
  private getMigrationConfig(): MigrationConfig {
    return {
      timestamp: new Date(),
      getTime(): number {
        this.timestamp = DateTimeHelper.fromTimestamp(DateTimeHelper.getTimestamp(this.timestamp, 30));
        return +DateTimeHelper.getTimestamp(this.timestamp);
      },
      dirname: this.options.dirname,
      outDir: this.data.outDir,
      rootDir: this.data.rootDir,
    };
  }

  /**
   * Generates all migration files including tables, indexes, and seeders
   *
   * This is the main entry point for migration generation. It orchestrates
   * the entire process in a specific order:
   * 1. Database objects (functions, composites, domains)
   * 2. Table structures
   * 3. Remaining objects (indexes, foreign keys, views, triggers)
   * 4. Initial seeders
   */
  public async generate(): Promise<void> {
    const config = this.getMigrationConfig();

    console.log('Cleaning up migrations directory...');
    await this.generateDatabaseObjects(config);
    await this.generateTableMigrations(config);
    await this.generateRemainingMigrations(config);
    await this.generateInitialSeeders(config);
  }

  /**
   * Generates migration files for database objects (functions, composites, domains)
   *
   * These objects need to be created before tables as they might be referenced
   * in table definitions.
   *
   * @param config - Migration configuration
   */
  private async generateDatabaseObjects(config: MigrationConfig): Promise<void> {
    if ( !this.options.migrations ) return;

    const {composites, functions, domains} = this.options.migrations;

    if (functions) {
      await this.handler.generateFunctions(this.knex, this.data.schemas, config);
    } else if (composites) {
      await this.handler.generateComposites(this.knex, this.data.schemas, config);
    } else if (domains) {
      await this.handler.generateDomains(this.knex, this.data.schemas, config);
    }
  }

  /**
   * Generates migration files for all tables in all schemas
   *
   * Processes each schema sequentially and generates table migration files
   * with proper column definitions and constraints.
   *
   * @param config - Migration configuration
   */
  private async generateTableMigrations(config: MigrationConfig): Promise<void> {
    if ( !this.options.migrations || !this.options.migrations.tables) return;

    for await (const schemaName of this.data.schemas) {
      await this.processSchema(schemaName, config);
    }
  }

  /**
   * Processes all tables within a schema
   *
   * Retrieves all tables in the given schema and processes each one
   * to generate its migration file.
   *
   * @param schemaName - Name of the schema to process
   * @param config - Migration configuration
   */
  private async processSchema(schemaName: string, config: MigrationConfig): Promise<void> {
    const schemaTables = await DbUtils.getTables(this.knex, schemaName);
    const filteredTables = schemaTables.filter(x => {
      return !this.options.tables.length ? true : this.options.tables.includes(x);
    });

    for await (const tableName of filteredTables) {
      await this.processTable(schemaName, tableName, config);
    }
  }

  /**
   * Generates migration file for a specific table
   *
   * Creates a migration file containing the table's structure including
   * columns, data types, constraints, and foreign key relationships.
   *
   * @param schemaName - Name of the schema containing the table
   * @param tableName - Name of the table to process
   * @param config - Migration configuration
   */
  private async processTable(schemaName: string, tableName: string, config: MigrationConfig): Promise<void> {
    const tableForeignKeys = this.data.foreignKeys.filter(
      (x) => x.tableName === tableName && x.schema === schemaName
    );
    const columnsInfo = await TableColumns.list(this.knex, tableName, schemaName);
    const variables = MigrationFormatter.initVariables();

    await this.handler.generateTableInfo({ tableName, columnsInfo, schemaName, tableForeignKeys }, variables);

    const fileName = this.handler.createFilename(config.outDir, `create_${schemaName}_${tableName}_table`, config.getTime());
    console.log('Generated table migration:', fileName);
    this.handler.createFile(fileName, variables);
  }

  /**
   * Generates migration files for remaining database objects (indexes, foreign keys, views, triggers)
   *
   * These objects are created after table structures as they reference existing tables.
   * The order ensures proper dependency resolution.
   *
   * @param config - Migration configuration
   */
  private async generateRemainingMigrations(config: MigrationConfig): Promise<void> {
    if ( !this.options.migrations ) return;

    if (this.options.migrations.indexes) {
      await this.handler.generateIndexes(this.data.indexes, config);
    }

    await this.generateForeignKeysMigration(config);

    if (this.options.migrations.views) {
      await this.handler.generateViews(this.knex, this.data.schemas, config);
    }

    if (this.options.migrations.triggers) {
      await this.handler.generateTriggers(this.knex, this.data.schemas, config);
    }
  }

  /**
   * Generates migration file for all foreign keys
   *
   * Creates a dedicated migration for all foreign key constraints across all tables.
   * This separation allows for easier maintenance and potential recreation of constraints.
   *
   * @param config - Migration configuration
   */
  private async generateForeignKeysMigration(config: MigrationConfig): Promise<void> {
    if ( !this.options.migrations || !this.options.migrations.foreignKeys) return;

    const fkVars = MigrationFormatter.initVariables();
    this.handler.generateForeignKeys(this.data.foreignKeys, fkVars);

    const fileName = this.handler.createFilename(config.outDir, `create-foreign-keys`, config.getTime());
    console.log('Generated FK migration:', fileName);
    this.handler.createFile(fileName, fkVars);
  }

  /**
   * Generates initial seeder file for database records
   *
   * Creates a seeder file that can be used to populate the database with
   * initial or test data after migration execution.
   *
   * @param config - Migration configuration
   */
  private async generateInitialSeeders(config: MigrationConfig): Promise<void> {
    if ( !this.options.migrations || !this.options.migrations.seeders) return;

    const seedFile = this.handler.createFilename(
      FileHelper.join(config.outDir, '../seeders'),
      'add_init_records',
      config.getTime()
    );
    this.writer.renderOut('seeder-init', seedFile);
  }
}
