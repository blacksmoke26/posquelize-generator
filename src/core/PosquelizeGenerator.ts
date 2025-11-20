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

import {rimraf} from 'rimraf';

// helpers
import FileHelper from '~/helpers/FileHelper';
import StringHelper from '~/helpers/StringHelper';

// classes
import DbUtils from '~/classes/DbUtils';
import TemplateWriter from './TemplateWriter';
import KnexClient from '~/classes/KnexClient';
import ConfigHandler from '~/core/ConfigHandler';
import ConfigCombiner from '~/core/ConfigCombiner';
import MigrationGenerator from './MigrationGenerator';
import RelationshipGenerator from './RelationshipGenerator';
import MultiFileDiffViewer from '~/classes/MultiFileDiffViewer';
import TableColumns, {type ColumnInfo} from '~/classes/TableColumns';

// objects
import CodeFile from '~/objects/CodeFile';

// formatters
import ModelFormatter from '~/formatters/ModelFormatter';

// utils
import ModelGenerator, {InitTemplateVars, ModelTemplateVars, sp} from './ModelGenerator';

// types
import type {Knex} from 'knex';
import type {ForeignKey, Relationship, TableIndex} from '~/typings/utils';
import type {GenerateConfigFile, GeneratorOptions} from '~/typings/generator';
import type {FileComparison} from '~/typings/multi-diff';

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
   * The model generator instance responsible for creating Sequelize model templates.
   * This instance handles the generation of TypeScript model files, including:
   * - Field definitions and type annotations
   * - Interface generation for type safety
   * - Model attributes and configurations
   * - Relationship definitions
   * - Index and constraint generation
   *
   * The generator is initialized with merged options and used throughout the
   * model generation process for each table in the database schema.
   *
   * @see ModelGenerator for detailed generation logic
   * @see getOptions() for configuration options used during initialization
   */
  private modelGen: InstanceType<typeof ModelGenerator>;
  /**
   * Template writer instance for generating and writing various template files.
   * This instance handles the rendering and writing of all template-based files including:
   * - Model files with TypeScript interfaces and Sequelize definitions
   * - Migration files for database schema changes
   * - Repository pattern implementation files
   * - Configuration and initialization files
   * - ERD diagram files
   *
   * The writer is initialized with merged generator options and used throughout
   * the generation process to create all output files.
   */
  private writer: InstanceType<typeof TemplateWriter>;
  /**
   * Collection of code files generated during the process.
   * This array stores all generated CodeFile instances which contain
   * the file content and metadata needed for:
   * - Diff generation in dry-run mode
   * - File comparison and change tracking
   * - Output formatting and validation
   * - HTML diff viewer input
   *
   * The files are accumulated during generation and used when
   * generating the interactive diff HTML report.
   */
  private codeFiles: CodeFile[] = [];
  /**
   * Model formatter instance responsible for code formatting and naming conventions.
   * This formatter handles various formatting aspects including:
   * - Model name case conversion (camelCase, PascalCase, etc.)
   * - Property name transformations
   * - File name generation and casing
   * - Singularize/pluralize model names
   * - Template variable preparation and formatting
   *
   * The formatter is initialized with generator options and used consistently
   * throughout the model generation process to maintain naming conventions.
   */
  protected formatter: ModelFormatter;
  /**
   * Relationship generator instance for handling model associations and relationships.
   * This generator manages the creation of:
   * - Sequelize association definitions (belongsTo, hasMany, etc.)
   * - Relationship imports and exports
   * - Foreign key relationship mapping
   * - Association options and configurations
   * - Model initialization with relationships
   *
   * The generator processes database relationships and converts them into
   * appropriate Sequelize model associations based on the configured options.
   */
  protected relationship: RelationshipGenerator;

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
   * Initializes a new generator instance with the specified connection, output directory, and options.
   * This constructor sets up the database connection and model generator for the generation process.
   *
   * @param connectionString - Database connection string (e.g., 'postgresql://user:pass@localhost/db')
   * @param rootDir - Root directory path where all generated files will be placed
   * @param options - Optional configuration settings for customizing the generation behavior
   */
  private constructor(
    public connectionString: string,
    public rootDir: string,
    public options: GeneratorOptions = {},
  ) {
    if (this.getOptions().dryRunDiff) {
      this.options.dryRun = true;
      this.options.beforeFileSave = (file: CodeFile) => {
        this.codeFiles.push(file);
        return false;
      };
    }

    this.knex = KnexClient.create(this.connectionString);
    this.modelGen = new ModelGenerator(this.getOptions());
    this.writer = new TemplateWriter(this.getOptions());
    this.formatter = ModelFormatter.create(this.getOptions());
    this.relationship = new RelationshipGenerator(this.getOptions());
  }

  /**
   * Creates a new PosquelizeGenerator instance with the specified parameters.
   * This is a factory method that provides a convenient way to create generator instances.
   *
   * @param connectionString - Database connection string (e.g., 'postgresql://user:pass@localhost/db')
   * @param rootDir - Root directory path where all generated files will be placed
   * @param options - Optional configuration settings for customizing the generation behavior
   * @returns A new instance of PosquelizeGenerator initialized with the provided parameters
   *
   * @example
   * ```typescript
   * const generator = PosquelizeGenerator.create(
   *   'postgresql://user:pass@localhost/mydb',
   *   './src',
   *   { schemas: ['public'], tables: ['users'] }
   * );
   * ```
   */
  public static create(
    connectionString: string,
    rootDir: string,
    options: GeneratorOptions = {},
  ) {
    return new PosquelizeGenerator(connectionString, rootDir, options);
  }

  /**
   * Creates a new generator instance from a configuration file (posquelize.config.js).
   * This static method provides an alternative initialization approach by loading
   * configuration settings from an external JavaScript file instead of passing
   * parameters directly to the constructor.
   *
   * The configuration file should export connection details, output directory,
   * and generation options in the expected format. This method will:
   * - Locate the configuration file in the specified directory
   * - Parse and validate the configuration settings
   * - Create and return a new generator instance with those settings
   * - Generate a default configuration file if one doesn't exist
   *
   * @param dirPath - Directory path containing the posquelize.config.js file
   * @param options - Optional additional options to merge with config file settings
   * @returns Promise resolving to a new PosquelizeGenerator instance, or null if
   *          configuration loading fails or the config file needs to be created
   * @throws {Error} When the configuration file exists but cannot be parsed or
   *                  contains invalid settings
   *
   * @example
   * ```typescript
   * // Basic usage with default config file location
   * const generator = await PosquelizeGenerator.createWithConfig('./project-root');
   * if (generator) {
   *   await generator.generate();
   * }
   *
   * // With additional options to override config file settings
   * const generator = await PosquelizeGenerator.createWithConfig('./project-root', {
   *   schemas: ['public'],
   *   tables: ['users', 'posts']
   * });
   * ```
   *
   * @note If the configuration file doesn't exist, this method will automatically
   *       create a template configuration file and return null, prompting the user
   *       to review and modify the configuration before running again.
   */
  public static async createWithConfig(dirPath: string, options: Partial<GenerateConfigFile> = {}): Promise<PosquelizeGenerator | null> {
    const configFile = FileHelper.join(dirPath, 'posquelize.config.js');

    if (!fs.existsSync(configFile)) {
      console.error('Configuration file not found: "posquelize.config.js"');
      console.info('Creating a new configuration file in the current directory...');
      (new TemplateWriter).renderOut('pos.config', configFile);
      console.info('Please review and modify the configuration file, then run the command again.');
      return null;
    }

    console.info('Loading configuration file: "posquelize.config.js"');
    const handler = new ConfigHandler(configFile, options);
    if (!(await handler.load())) {
      return null;
    }

    return handler.createGenerator();
  }

  /**
   * Gets the merged generator options with defaults
   * @returns The merged configuration options
   */
  public getOptions(): Required<GeneratorOptions> {
    return ConfigCombiner.withOptions(this?.options ?? {}) as Required<GeneratorOptions>;
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
    if (this.options.dryRun) return;

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
  private filterSchemaTables(tableName: string, schemaName: string): boolean {
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
    const columnsInfo = await TableColumns.list(this.knex, tableName, schemaName);

    const tableData = this.getTableData(tableName, schemaName, columnsInfo);
    const modelName = this.formatter.getModelName(tableName);

    this.updateInitializerVars(modelName, tableName, initTplVars);
    const modTplVars = ModelFormatter.getModelTemplateVars({schemaName, modelName, tableName});

    const timestampInfo = this.getTimestampInfo(columnsInfo);

    this.processColumns(columnsInfo, tableData, modTplVars, modelName, interfacesVar);
    this.generateModelComponents(tableData, modTplVars, schemaName, tableName, timestampInfo);

    this.finalizeTemplateVars(modTplVars);
    this.writeModelFile(this.formatter.getFileName(tableName), modTplVars);
    this.updateConfig(config, modelName);

    if (this.getOptions().repositories) {
      this.writer.writeRepoFile(this.getBaseDir(), StringHelper.tableToModel(tableName), this.getOptions().dirname);
    }
  }

  /**
   * Retrieves table-specific data including relations, indexes, and foreign keys.
   * Filters the global database metadata to return only relevant data for the specified table.
   * @param tableName The name of the table
   * @param schemaName The schema name containing the table
   * @param columnsInfo Array of column information
   * @returns Object containing table data
   */
  private getTableData(tableName: string, schemaName: string, columnsInfo: ColumnInfo[]) {
    return {
      relations: this.dbData.relationships.filter((x) => x.source.table === tableName) ?? [],
      indexes: this.dbData.indexes.filter((x) => x.table === tableName && x.schema === schemaName),
      foreignKeys: this.dbData.foreignKeys.filter((x) => x.tableName === tableName && x.schema === schemaName),
      columnsInfo,
    };
  }

  /**
   * Updates the initializer template variables with model information.
   * Adds import statements and export declarations for the generated model.
   * @param modelName The name of the model
   * @param tableName
   * @param initTplVars The initializer template variables to update
   */
  private updateInitializerVars(modelName: string, tableName: string, initTplVars: InitTemplateVars): void {
    initTplVars.importClasses += sp(0, `import %s from './%s';\n`, modelName, this.formatter.getFileName(tableName));
    initTplVars.importTypes += sp(0, `export * from './%s';\n`, this.formatter.getFileName(tableName));
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

      this.modelGen.generateEnums(columnInfo, modTplVars);

      this.modelGen.generateInterfaces(columnInfo, modTplVars, interfacesVar);
      this.modelGen.generateFields({
        columnInfo, vars: modTplVars, modelName,
        targetTable: relation?.target?.table ?? null,
        targetColumn: relation?.target?.column ?? null,
        isFK: relation !== null,
      });

      this.modelGen.generateAttributes({columnInfo, modTplVars, tableForeignKeys: tableData.foreignKeys});
    }
  }

  /**
   * Generates supplemental model components beyond basic field definitions.
   * Creates all additional model code including relationships, configuration options,
   * indexes, and Sequelize associations based on the table structure and metadata.
   *
   * This method coordinates the generation of:
   * - Import statements for related models based on foreign key relationships
   * - Sequelize model options including schema configuration and timestamp settings
   * - Database index definitions for performance optimization
   * - Association definitions for establishing model relationships
   *
   * @param tableData Object containing table metadata including relationships,
   *                 indexes, and column information used for component generation
   * @param modTplVars Template variables object that accumulates generated code
   *                   components for the final model file
   * @param schemaName Database schema name where the table resides
   * @param tableName Name of the database table being processed
   * @param timestampInfo Object indicating whether the table contains
   *                      created_at and updated_at timestamp columns
   */
  private generateModelComponents(
    tableData: { relations: Relationship[]; indexes: TableIndex[]; columnsInfo: ColumnInfo[] },
    modTplVars: ModelTemplateVars,
    schemaName: string,
    tableName: string,
    timestampInfo: { hasCreatedAt: boolean; hasUpdatedAt: boolean },
  ): void {
    this.modelGen.generateRelationsImports(tableData.relations, modTplVars);
    this.modelGen.generateOptions(modTplVars, {schemaName, tableName, ...timestampInfo, columnsInfo: tableData.columnsInfo});
    this.modelGen.generateIndexes(tableData.indexes, modTplVars);
    this.relationship.generateAssociations(tableData.relations, modTplVars, tableName);
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
    this.writer.renderOut('model-template', fileName, {...modTplVars, dirname: this.getOptions().dirname});

    if (!this.options.dryRun) {
      console.log('Model generated:', fileName);
    }
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
    this.writer.writeBaseFiles(this.getBaseDir(), this.getOptions().dirname, this.connectionString, {
      repoBase: this.getOptions().repositories,
    });

    // Initialize template variables for models and interfaces
    const initTplVars = ModelFormatter.getInitializerTemplateVars();
    const interfacesVar: { text: string } = {
      text: '',
    };

    // Generate all model files
    await this.generateModels(initTplVars, interfacesVar, config);

    // Write model type definitions
    this.writer.renderOut('generic/models.d', FileHelper.join(this.getBaseDir(), 'typings/models.d.ts'), {
      text: interfacesVar.text.replaceAll(`\n\n\n`, `\n\n`),
    });

    // Write server configuration file
    this.writer.writeServerFile(FileHelper.dirname(this.getBaseDir()), config.anyModelName, this.getOptions().dirname);

    // Generate relationship definitions
    this.relationship.generateRelations(this.dbData.relationships, initTplVars, {
      schemas: this.getOptions().schemas,
      tables: this.getOptions().tables,
    });

    // Write models initializer file
    const fileName = FileHelper.join(this.getBaseDir('models'), 'index.ts');
    this.writer.renderOut('models-initializer', fileName, initTplVars);

    if (!this.options.dryRun) {
      console.log('Models Initializer generated:', fileName);
    }

    await Promise.all([
      this.generateMigrations(),
      this.generateDiagram(),
    ]);

    await this.generateDiffHtml();
  }

  /**
   * Generates an interactive HTML diff viewer for dry-run mode.
   *
   * This method creates a visual comparison between existing files and the changes
   * that would be made during the generation process. The HTML diff viewer provides
   * a side-by-side view of changes with syntax highlighting and file navigation.
   *
   * The diff viewer is only generated when the dryRunDiff option is enabled.
   * It uses the MultiFileDiffViewer class to create an interactive HTML report
   * with customizable themes and layout options.
   *
   * The generated HTML file includes:
   * - Side-by-side file comparison
   * - Syntax highlighting for TypeScript files
   * - File tree navigation
   * - Change summary statistics
   * - Theme support (light/dark modes)
   *
   * @throws {Error} When diff generation fails due to file system or template errors
   */
  private async generateDiffHtml(): Promise<void> {
    if (!this.options.dryRunDiff) return;

    const diffViewer = new MultiFileDiffViewer(
      {
        // Custom theme options with improved colors
        primaryColor: '#586069',
        accentColor: '#0969da',
        successColor: '#2da44e',
        dangerColor: '#d1242f',
        warningColor: '#d29922',
        lightBg: '#f6f8fa',
        darkBg: '#0d1117f2',
        fontSizeScale: 1.0,
      },
      {
        // Advanced configuration
        headerTitle: '⚡ Posquelize Diff Viewer',
        footerText: 'Generated with ❤️ Posquelize',
        showFileIcons: true,
        showSummary: true,
      },
    );

    const fileComparisons: FileComparison[] = this.codeFiles.map(x => ({
      ...x.getComparison(),
      newPath: x.getFilename(this.rootDir),
      oldPath: '', // most of the time, new and old path is same so omitting the value here
    }) as FileComparison);

    const template = this.writer.getTemplateFile('dry-run-interactive-diff')
    const htmlOutput = diffViewer.writeFile(FileHelper.readFile(template), fileComparisons, {
      outputFormat: 'side-by-side',
      showFiles: true,
      matching: 'words',
      compactMode: false,
      theme: 'light'
    }, this.rootDir);

    console.log(`✨ Interactive diff viewer generated: ${htmlOutput}`);
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
    if (this.getOptions().diagram) {
      await this.writer.writeDiagrams(this.getBaseDir('diagrams'), this.connectionString);
    }
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
    if (this.getOptions().migrations === false || this.getOptions().dryRun) {
      return;
    }

    const migGenerator = new MigrationGenerator(
      this.knex,
      {
        schemas: this.dbData.schemas,
        indexes: this.dbData.indexes,
        foreignKeys: this.dbData.foreignKeys,
        outDir: this.getBaseDir('migrations'),
        rootDir: this.rootDir,
      },
      {
        ...this.getOptions(),
        dirname: this.getOptions().dirname,
        tables: this.getOptions().tables,
      },
    );

    await migGenerator.generate();
  }
}
