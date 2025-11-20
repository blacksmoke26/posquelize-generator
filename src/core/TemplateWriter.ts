/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import fs from 'node:fs';
import merge from 'deepmerge';

// helpers
import FileHelper from '~/helpers/FileHelper';
import NunjucksHelper from '~/helpers/NunjucksHelper';

// classes
import CodeFile from '~/objects/CodeFile';
import KnexClient from '~/classes/KnexClient';
import DbmlDiagramExporter from './DbmlDiagramExporter';

// types
import type {GeneratorOptions} from '~/typings/generator';

/**
 * Configuration options for controlling the generation of base files during scaffold creation.
 * Determines which components are included in the generated project structure.
 */
export interface WriteBaseFileOptions {
  /**
   * Controls the generation of the RepositoryBase.ts file.
   * When enabled, creates the base repository class in the base directory.
   * @default true
   */
  repoBase?: boolean;
}

/**
 * Utility class for generating template files and scaffolding project components.
 *
 * Provides functionality to create various configuration, model, repository, and server files
 * using Nunjucks templates. Designed to work with database models and repository patterns.
 */
export default class TemplateWriter {
  /**
   * Initializes a new TemplateWriter instance with optional configuration.
   *
   * @param options - Generator configuration options affecting template behavior
   */
  constructor(public readonly options: GeneratorOptions = {}) {
  }

  public getTemplateFile (template: string): string {
    const templateDir = this.options?.templatesDir ?? '';
    let templateFile = FileHelper.join(templateDir, `${template}.njk`);

    if ( !templateDir.trim() || !fs.existsSync(templateFile)) {
      templateFile = FileHelper.join(FileHelper.dirname(__dirname, 1), 'templates', `${template}.njk`);
    }

    return templateFile;
  }

  /**
   * Processes a Nunjucks template and persists the rendered output to disk.
   *
   * @param template - Base name of the template file (excluding .njk extension)
   * @param outFile - Target path where the rendered content will be saved
   * @param context - Data object passed to the template for variable substitution
   */
  public renderOut(template: string, outFile: string, context: Record<string, any> = {}): void {
    let templateFile = this.getTemplateFile(template);

    const text = NunjucksHelper.renderFile(templateFile, context, {
      autoescape: false,
    }).trimEnd() + `\n`;

    (new CodeFile(outFile, text, this.options)).save();
  }

  /**
   * Generates database schema documentation in DBML (Database Markup Language) format.
   *
   * Establishes database connection using the provided connection string, extracts schema metadata,
   * and exports it as a DBML file for documentation purposes.
   *
   * @param outputDir - Destination directory for the generated DBML file
   * @param connectionString - Complete database connection URI
   * @returns Promise resolving when schema export completes
   */
  public async writeDiagrams(outputDir: string, connectionString: string): Promise<void> {
    // Export database schema to DBML format
    await DbmlDiagramExporter.create(this.options).export(connectionString, FileHelper.join(outputDir, 'database.dbml'));
  }

  /**
   * Generates essential base files for project scaffolding.
   *
   * Creates a comprehensive set of foundation files including base classes, configuration files,
   * and project metadata. The generated files provide the structure for a database-driven application
   * with repository and model patterns.
   *
   * Generated files include:
   * - Base model and repository classes
   * - Application instance configuration
   * - Database connection and environment settings
   * - TypeScript and Sequelize configuration
   * - Package management and version control files
   *
   * @param baseDir - Root directory containing the repositories folder
   * @param mainDir - Target directory name for generated source files
   * @param connectionString - Database connection string for configuration
   * @param options - Optional settings to control file generation behavior
   *   @property repoBase - Flag to enable/disable RepositoryBase.ts generation
   *
   * @example
   * // Generate all base files with default settings
   * const writer = new TemplateWriter();
   * writer.writeBaseFiles('/project/path', 'src', 'postgresql://user:pass@localhost:5432/dbname');
   *
   * @example
   * // Generate without repository base class
   * const writer = new TemplateWriter();
   * writer.writeBaseFiles('/project/path', 'src', 'postgresql://user:pass@localhost:5432/dbname', {
   *   repoBase: false
   * });
   */
  public writeBaseFiles(baseDir: string, mainDir: string, connectionString: string, options: WriteBaseFileOptions = {}): void {
    const newOptions = merge<Required<WriteBaseFileOptions>>({repoBase: true}, options);

    if (newOptions.repoBase) {
      // Generate RepositoryBase.ts from template
      this.renderOut('repo-base', FileHelper.join(baseDir, 'base/RepositoryBase.ts'));
    }

    // Generate ModelBase.ts from template
    this.renderOut('model-base', FileHelper.join(baseDir, 'base/ModelBase.ts'));

    // Generate instance.ts from template
    this.renderOut('instance-template', FileHelper.join(baseDir, 'instance.ts'), {dirname: mainDir});

    // Generate config.js from template
    this.renderOut('core/sequelize-config', FileHelper.join(baseDir, 'config/config.js'));

    const rootPath = FileHelper.dirname(baseDir, 2);

    // Generate environment configuration
    this.renderOut('core/env', FileHelper.join(rootPath, '.env'), KnexClient.connectionStringToDbConfig(connectionString));
    this.renderOut('core/tsconfig.json', FileHelper.join(rootPath, 'tsconfig.json'));
    this.renderOut('core/sequelize-rc', FileHelper.join(rootPath, '.sequelizerc'), {dirname: mainDir});
    this.renderOut('core/package.json', FileHelper.join(rootPath, 'package.json'));
    this.renderOut('core/gitignore', FileHelper.join(rootPath, '.gitignore'));
    this.renderOut('core/readme', FileHelper.join(rootPath, 'README.md'));
  }

  /**
   * Creates a repository implementation file for a specified model.
   *
   * Processes the repository template with the provided model name and outputs
   * a TypeScript file containing the repository class definition in the repositories directory.
   *
   * @param baseDir - Path to the directory containing the repositories folder
   * @param modelName - Name of the model for which to create the repository
   * @param mainDir - Directory name where source files are organized
   */
  public writeRepoFile(baseDir: string, modelName: string, mainDir: string): void {
    const fileName = FileHelper.join(baseDir, 'repositories', `${modelName}Repository.ts`);
    this.renderOut('repo-template', fileName, {modelName, dirname: mainDir});

    if (!this.options.dryRun) {
      console.log('Repository generated:', fileName);
    }
  }

  /**
   * Generates a server configuration file for a specific model.
   *
   * Creates a TypeScript server file configured to work with the specified model,
   * including necessary imports and basic setup for API endpoints.
   *
   * @param baseDir - Target directory for the generated server file
   * @param modelName - Model identifier to be referenced in server configuration
   * @param mainDir - Root directory name for source organization
   */
  public writeServerFile(baseDir: string, modelName: string, mainDir: string): void {
    this.renderOut('core/server', FileHelper.join(baseDir, `server.ts`), {model: modelName, dirname: mainDir});
  }
}
