/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 *
 * @fileoverview Main generator class for creating Sequelize models, migrations, and related files
 * from a database schema. This class handles the entire generation process including:
 * - Database schema introspection
 * - Model file generation with TypeScript interfaces
 * - Migration file creation
 * - Relationship and foreign key handling
 * - Repository pattern implementation
 * - ERD diagram generation
 */

import fs from 'node:fs';

import merge from 'deepmerge';
import { rimraf } from 'rimraf';
import { pascalCase } from 'change-case';

// helpers
import FileHelper from '~/helpers/FileHelper';
import StringHelper from '~/helpers/StringHelper';

// classes
import DbUtils from '~/classes/DbUtils';
import TemplateWriter from './TemplateWriter';
import KnexClient from '~/classes/KnexClient';
import MigrationGenerator, { MigrationOptions } from './MigrationGenerator';
import RelationshipGenerator from './RelationshipGenerator';
import TableColumns, { type ColumnInfo } from '~/classes/TableColumns';

// utils
import ModelGenerator, { InitTemplateVars, ModelTemplateVars, sp } from './ModelGenerator';

// types
import type { Knex } from 'knex';
import type { ForeignKey, Relationship, TableIndex } from '~/typings/utils';
import type { GeneratorOptions } from '~/typings/generator';

/**
 * Generates Sequelize models, migrations, and related files from a database schema.
 *
 * This class provides a comprehensive solution for generating TypeScript-based Sequelize models
 * from an existing database. It handles schema introspection, model generation with proper
 * TypeScript typing, migration files, repository pattern implementation, and ERD diagrams.
 *
 * @example
 * ```typescript
 * const generator = new PosquelizeGenerator(
 *   'postgresql://user:pass@localhost/mydb',
 *   './src',
 *   { schemas: ['public'], tables: ['users', 'posts'] }
 * );
 * await generator.generate();
 * ```
 */
export default class PosquelizeGenerator {
  /**
   * The Knex.js database client instance used for all database operations.
   * This client is created during initialization and used throughout the generation
   * process for schema introspection, table queries, and metadata extraction.
   *
   * The client is configured using the provided connection string and supports
   * all database operations needed for model generation, including:
   * - Schema information retrieval
   * - Table structure analysis
   * - Index and foreign key inspection
   * - Relationship discovery
   *
   * @see KnexClient.create() for the client creation logic
   * @see Database connection is established in the constructor
   */
  public knex: Knex;

  /**
   * Database metadata including schemas, indexes, relationships, and foreign keys.
   * This data is fetched once during initialization and used throughout the generation process.
   */
  private dbData: {
    schemas: Readonly<string[]>;
    indexes: TableIndex[];
    relationships: Relationship[];
    foreignKeys: ForeignKey[];
  } = {
    schemas: [],
    indexes: [],
    relationships: [],
    foreignKeys: [],
  };

  /**
   * Creates a new instance of PosquelizeGenerator
   * @param connectionString The database connection string
   * @param rootDir The root directory where files will be generated
   * @param options Optional configuration for the generator
   */
  constructor(
    public readonly connectionString: string,
    public readonly rootDir: string,
    public readonly options: GeneratorOptions = {},
  ) {
    this.knex = KnexClient.create(this.connectionString);
  }

  /**
   * Gets the merged generator options with defaults
   * @returns The merged configuration options
   */
  public getOptions(): Required<GeneratorOptions> {
    return merge(
      {
        schemas: [],
        tables: [],
        dirname: 'database',
        cleanRootDir: false,
        diagram: true,
        migrations: {},
        repositories: true,
        generator: {
          model: {
            addNullTypeForNullable: true,
          }
        },
      },
      this.options,
    );
  }

  /**
   * Gets the base directory path, creating it if it doesn't exist.
   * Ensures the directory structure exists before returning the path.
   * @param joins Additional path segments to join
   * @returns The full path to the directory
   */
  private getBaseDir(...joins: string[]): string {
    const dirPath = FileHelper.join(this.rootDir, `src/${this.getOptions().dirname}`, ...joins);

    try {
      fs.mkdirSync(dirPath, {recursive: true});
    } catch {
      // do nothing
    }

    return dirPath;
  }

  /**
   * Initializes the required directory structure for generated files.
   * Creates all necessary subdirectories within the base directory.
   */
  private initDirs(): void {
    this.getBaseDir('base');
    this.getBaseDir('config');
    this.getBaseDir('typings');
    this.getBaseDir('repositories');
    this.getBaseDir('seeders');
  }

  /**
   * Filters database tables and schemas based on generator configuration.
   *
   * Determines whether a given table and schema combination should be included in the generation
   * process based on the schemas and tables filtering options. This method is used throughout
   * the generation process to ensure only the requested schemas and tables are processed.
   *
   * The filtering logic follows these rules:
   * - If no schemas are specified (empty array), all schemas are allowed
   * - If schemas are specified, the given schema must be in the allowed list
   * - If no tables are specified (empty array), all tables are allowed
   * - If tables are specified, the given table must be in the allowed list
   * - Both schema and table filters must pass for the table to be included
   *
   * @param tableName - The name of the database table to check
   * @param schemaName - The name of the database schema containing the table
   * @returns True if the table/schema combination should be included in generation, false otherwise
   *
   * @example
   * ```typescript
   * // With options { schemas: ['public'], tables: ['users'] }
   * filterSchemaTables('users', 'public') // true
   * filterSchemaTables('posts', 'public') // false (table not in filter)
   * filterSchemaTables('users', 'auth')   // false (schema not in filter)
   *
   * // With options { schemas: [], tables: [] } (no filters)
   * filterSchemaTables('any_table', 'any_schema') // true (everything allowed)
   * ```
   */
  private filterSchemaTables (tableName: string, schemaName: string): boolean {
    let hasPassed = true;

    const filterSchemas = this.getOptions().schemas;
    const filterTables = this.getOptions().tables;

    if (filterSchemas.length && !filterSchemas.includes(schemaName)) {
      hasPassed = false;
    }

    if (filterTables.length && !filterTables.includes(tableName)) {
      hasPassed = false;
    }

    return hasPassed;
  }

  /**
   * Fetches database schema information including schemas, indexes, relationships, and foreign keys.
   * This is an expensive operation that runs only once during generation.
   */
  private async fetchData(): Promise<void> {
    console.log('Fetching database information...');
    const [schemas, indexes, relationships, foreignKeys] = await Promise.all([
      DbUtils.getSchemas(this.knex),
      DbUtils.getIndexes(this.knex),
      DbUtils.getRelationships(this.knex),
      DbUtils.getForeignKeys(this.knex),
    ]);

    this.dbData.schemas = schemas.filter(x => {
      return !this.getOptions().schemas.length ? true : this.getOptions().schemas.includes(x);
    });

    this.dbData.indexes = indexes.filter(x => {
      return this.filterSchemaTables(x.table, x.schema);
    });

    this.dbData.relationships = relationships.filter(x => {
      return this.filterSchemaTables(x.source.schema, x.source.table) || this.filterSchemaTables(x.target.schema, x.target.table);
    });

    this.dbData.foreignKeys = foreignKeys.filter(x => {
      return this.filterSchemaTables(x.tableName, x.schema);
    });
  }

  /**
   * Converts a table name to a model name in PascalCase.
   * Handles singularization and case conversion for consistent naming.
   * @param tableName The database table name
   * @returns The model name in PascalCase
   */
  private getModelName(tableName: string): string {
    return pascalCase(StringHelper.normalizeSingular(tableName));
  }

  /**
   * Gets all tables for a given schema, filtered by the tables option if specified.
   * Respects the generator's table filtering configuration.
   * @param schemaName The schema name to get tables for
   * @returns A readonly array of table names
   */
  private async getSchemaTables(schemaName: string): Promise<Readonly<string[]>> {
    const schemaTables = await DbUtils.getTables(this.knex, schemaName);
    return schemaTables.filter((x) => {
      return !this.getOptions().tables.length ? true : this.getOptions().tables.includes(x);
    });
  }

  /**
   * Generates Sequelize model files for all tables in the specified schemas.
   * Iterates through schemas and tables, processing each one to create complete model definitions.
   * @param initTplVars Template variables for the initializer file
   * @param interfacesVar Object to accumulate interface definitions
   * @param config Configuration object to track the first generated model name
   */
  private async generateModels(initTplVars: InitTemplateVars, interfacesVar: { text: string }, config: {
    anyModelName: string
  }): Promise<void> {
    const schemas = this.dbData.schemas;

    for await (const schemaName of schemas) {
      const schemaTables = await this.getSchemaTables(schemaName);

      for await (const tableName of schemaTables) {
        await this.processTable(tableName, schemaName, initTplVars, interfacesVar, config);
      }
    }
  }

  /**
   * Processes a single table to generate its model and related files.
   * This is the core method that handles all aspects of model generation for a single table.
   * @param tableName The name of the table to process
   * @param schemaName The schema name containing the table
   * @param initTplVars Template variables for the initializer file
   * @param interfacesVar Object to accumulate interface definitions
   * @param config Configuration object to track the first generated model name
   */
  private async processTable(
    tableName: string,
    schemaName: string,
    initTplVars: InitTemplateVars,
    interfacesVar: { text: string },
    config: { anyModelName: string },
  ): Promise<void> {
    const tableData = this.getTableData(tableName, schemaName);
    const modelName = this.getModelName(tableName);

    this.updateInitializerVars(modelName, initTplVars);
    const modTplVars = ModelGenerator.getModelTemplateVars({schemaName, modelName, tableName});

    const columnsInfo = await TableColumns.list(this.knex, tableName, schemaName);
    const timestampInfo = this.getTimestampInfo(columnsInfo);

    this.processColumns(columnsInfo, tableData, modTplVars, modelName, interfacesVar);
    this.generateModelComponents(tableData, modTplVars, schemaName, tableName, timestampInfo);

    this.finalizeTemplateVars(modTplVars);
    this.writeModelFile(modelName, modTplVars);
    this.updateConfig(config, modelName);

    if ( this.getOptions().repositories ) {
      TemplateWriter.writeRepoFile(this.getBaseDir(), StringHelper.tableToModel(tableName), this.getOptions().dirname);
    }
  }

  /**
   * Retrieves table-specific data including relations, indexes, and foreign keys.
   * Filters the global database metadata to return only relevant data for the specified table.
   * @param tableName The name of the table
   * @param schemaName The schema name containing the table
   * @returns Object containing table data
   */
  private getTableData(tableName: string, schemaName: string) {
    return {
      relations: this.dbData.relationships.filter((x) => x.source.table === tableName) ?? [],
      indexes: this.dbData.indexes.filter((x) => x.table === tableName && x.schema === schemaName),
      foreignKeys: this.dbData.foreignKeys.filter((x) => x.tableName === tableName && x.schema === schemaName),
    };
  }

  /**
   * Updates the initializer template variables with model information.
   * Adds import statements and export declarations for the generated model.
   * @param modelName The name of the model
   * @param initTplVars The initializer template variables to update
   */
  private updateInitializerVars(modelName: string, initTplVars: InitTemplateVars): void {
    initTplVars.importClasses += sp(0, `import %s from './%s';\n`, modelName, modelName);
    initTplVars.importTypes += sp(0, `export * from './%s';\n`, modelName);
    initTplVars.exportClasses += sp(2, `%s,\n`, modelName);
  }

  /**
   * Determines if the table has timestamp columns.
   * Checks for common timestamp column naming patterns.
   * @param columnsInfo Array of column information
   * @returns Object indicating presence of created_at and updated_at columns
   */
  private getTimestampInfo(columnsInfo: ColumnInfo[]) {
    return {
      hasCreatedAt: columnsInfo.findIndex((x) => /^created(_a|A)t$/.test(x.name)) !== -1,
      hasUpdatedAt: columnsInfo.findIndex((x) => /^updated(_a|A)t$/.test(x.name)) !== -1,
    };
  }

  /**
   * Processes all columns in a table to generate fields, interfaces, and attributes.
   * Handles column type mapping, relationship detection, and attribute generation.
   * @param columnsInfo Array of column information
   * @param tableData Table-specific data including relations and foreign keys
   * @param modTplVars Model template variables
   * @param modelName The name of the model
   * @param interfacesVar Object to accumulate interface definitions
   */
  private processColumns(
    columnsInfo: ColumnInfo[],
    tableData: { relations: Relationship[]; foreignKeys: ForeignKey[] },
    modTplVars: ModelTemplateVars,
    modelName: string,
    interfacesVar: { text: string },
  ): void {
    for (const columnInfo of columnsInfo) {
      const relation = tableData.relations.find((x) => x.source.column === columnInfo.name) ?? null;

      ModelGenerator.generateEnums(columnInfo, modTplVars, modelName);
      ModelGenerator.generateInterfaces(columnInfo, modTplVars, interfacesVar);
      ModelGenerator.generateFields({
        columnInfo, vars: modTplVars, modelName,
        targetTable: relation?.target?.table ?? null,
        targetColumn: relation?.target?.column ?? null,
        isFK: relation !== null,
        generator: this.getOptions().generator,
      });

      ModelGenerator.generateAttributes({columnInfo, modTplVars, tableForeignKeys: tableData.foreignKeys});
    }
  }

  /**
   * Generates all model components including relations, options, indexes, and associations.
   * Orchestrates the generation of all supplemental model code beyond basic fields.
   * @param tableData Table-specific data including relations and indexes
   * @param modTplVars Model template variables
   * @param schemaName The schema name
   * @param tableName The table name
   * @param timestampInfo Timestamp column information
   */
  private generateModelComponents(
    tableData: { relations: Relationship[]; indexes: TableIndex[] },
    modTplVars: ModelTemplateVars,
    schemaName: string,
    tableName: string,
    timestampInfo: { hasCreatedAt: boolean; hasUpdatedAt: boolean },
  ): void {
    ModelGenerator.generateRelationsImports(tableData.relations, modTplVars);
    ModelGenerator.generateOptions(modTplVars, {schemaName, tableName, ...timestampInfo});
    ModelGenerator.generateIndexes(tableData.indexes, modTplVars);
    RelationshipGenerator.generateAssociations(tableData.relations, modTplVars, tableName);
  }

  /**
   * Finalizes template variables by trimming whitespace and adding type imports if needed.
   * Ensures the generated code is properly formatted and includes necessary imports.
   * @param modTplVars Model template variables to finalize
   */
  private finalizeTemplateVars(modTplVars: ModelTemplateVars): void {
    modTplVars.modelsImport = modTplVars.modelsImport.trimEnd();
    modTplVars.fields = modTplVars.fields.trimEnd();
    modTplVars.options = modTplVars.options.trimEnd();
    modTplVars.attributes = modTplVars.attributes.trimEnd();

    if (modTplVars.typesImport.trim()) {
      modTplVars.typesImport = sp(0, `import type { %s } from '~/%s/typings/models';\n`, modTplVars.typesImport.replace(/^, /, ''), this.getOptions().dirname);
      modTplVars.typesImport = `\n// types\n` + modTplVars.typesImport;
    }
  }

  /**
   * Writes the model file to disk.
   * Renders the template using the collected template variables and writes to the file system.
   * @param modelName The name of the model
   * @param modTplVars Model template variables
   */
  private writeModelFile(modelName: string, modTplVars: ModelTemplateVars): void {
    const fileName = FileHelper.join(this.getBaseDir('models'), `${modelName}.ts`);
    TemplateWriter.renderOut('model-template', fileName, {...modTplVars, dirname: this.getOptions().dirname});
    console.log('Model generated:', fileName);
  }

  /**
   * Updates the configuration with the first model name if not already set.
   * Used to reference a sample model in generated configuration files.
   * @param config Configuration object
   * @param modelName The name of the model
   */
  private updateConfig(config: { anyModelName: string }, modelName: string): void {
    if (!config.anyModelName?.trim?.()) {
      config.anyModelName = modelName;
    }
  }

  /**
   * Main method to generate all Sequelize models, migrations, and related files.
   * Orchestrates the entire generation process from database connection to file output.
   *
   * The generation process includes:
   * 1. Database connection and verification
   * 2. Directory setup and cleanup
   * 3. Schema metadata fetching
   * 4. Model generation for all specified tables
   * 5. Type definition generation
   * 6. Migration file creation
   * 7. ERD diagram generation
   */
  public async generate(): Promise<void> {
    // connect with database
    await KnexClient.checkConnection(this.knex);

    // Clean root directory if option is enabled
    if (this.getOptions().cleanRootDir) {
      console.log('Removing leftovers...');
      try {
        await rimraf(this.rootDir);
      } catch {
        console.error('Error: Unable to remove the app directory due to used by another process');
      }
    }

    // Initialize directory structure
    this.initDirs();

    // Fetch database schema information
    await this.fetchData();

    // Initialize configuration for tracking generated models
    const config: {
      anyModelName: string;
    } = {anyModelName: ''};

    // Write base template files
    TemplateWriter.writeBaseFiles(this.getBaseDir(), this.getOptions().dirname, this.connectionString, {
      repoBase: this.getOptions().repositories,
    });

    // Initialize template variables for models and interfaces
    const initTplVars = ModelGenerator.getInitializerTemplateVars();
    const interfacesVar: { text: string } = {
      text: '',
    };

    // Generate all model files
    await this.generateModels(initTplVars, interfacesVar, config);

    // Write model type definitions
    TemplateWriter.renderOut('generic/models.d', FileHelper.join(this.getBaseDir(), 'typings/models.d.ts'), {
      text: interfacesVar.text.replaceAll(`\n\n\n`, `\n\n`),
    });

    // Write server configuration file
    TemplateWriter.writeServerFile(FileHelper.dirname(this.getBaseDir()), config.anyModelName, this.getOptions().dirname);

    // Generate relationship definitions
    RelationshipGenerator.generateRelations(this.dbData.relationships, initTplVars, {
      schemas: this.getOptions().schemas,
      tables: this.getOptions().tables,
    });

    // Write models initializer file
    const fileName = FileHelper.join(this.getBaseDir('models'), 'index.ts');
    TemplateWriter.renderOut('models-initializer', fileName, initTplVars);
    console.log('Models Initializer generated:', fileName);

    await Promise.all([
      this.generateMigrations(),
      this.generateDiagram(),
    ]);
  }

  /**
   * Generates Entity Relationship Diagram (ERD) files for the database schema.
   *
   * This method creates visual representations of the database structure including
   * tables, relationships, and constraints. The diagrams are generated in the
   * diagrams subdirectory of the base output directory.
   *
   * Generation can be disabled by setting the diagram option to false in the
   * generator configuration.
   *
   * @throws {Error} When diagram generation fails due to connection or permission issues
   */
  private async generateDiagram(): Promise<void> {
    if (!this.getOptions().diagram) {
      return;
    }

    await TemplateWriter.writeDiagrams(this.getBaseDir('diagrams'), this.connectionString);
  }

  /**
   * Generates database migration files based on the current schema.
   *
   * This method creates migration scripts that can be used to recreate the database
   * schema in another environment. It includes all tables, indexes, foreign keys,
   * and other schema objects. The migrations are generated in the migrations
   * subdirectory of the base output directory.
   *
   * The migration files follow the Knex.js migration format and include:
   * - Table creation statements
   * - Column definitions with types and constraints
   * - Index creation
   * - Foreign key constraints
   * - Schema-specific considerations
   *
   * Generation can be disabled by setting the migrations option to false in the
   * generator configuration.
   *
   * @throws {Error} When migration generation fails due to schema analysis errors
   * @see {@link MigrationGenerator} For the underlying migration generation logic
   */
  private async generateMigrations(): Promise<void> {
    if (this.getOptions().migrations === false) {
      return;
    }

    const migGenerator = new MigrationGenerator(
      this.knex,
      {
        schemas: this.dbData.schemas,
        indexes: this.dbData.indexes,
        foreignKeys: this.dbData.foreignKeys,
      },
      {
        dirname: this.getOptions().dirname,
        outDir: this.getBaseDir('migrations'),
        rootDir: this.rootDir,
        tables: this.getOptions().tables,
        generate: this.getOptions().migrations as MigrationOptions['generate']
      },
    );

    await migGenerator.generate();
  }
}
