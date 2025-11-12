/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import merge from 'deepmerge';

// helpers
import FileHelper from '~/helpers/FileHelper';
import NunjucksHelper from '~/helpers/NunjucksHelper';

// classes
import KnexClient from '~/classes/KnexClient';
import DbmlDiagramExporter from './DbmlDiagramExporter';

/**
 * Options for configuring the behavior of writing base files during scaffold generation.
 * These options control which components are generated and how they are structured.
 */
export interface WriteBaseFileOptions {
  /**
   * Whether to generate the base repo file (RepoBase.ts).
   * When true, the RepoBase.ts file will be created in the base directory.
   * @default true
   */
  repoBase?: boolean;
}

/**
 * Abstract class for scaffold generation utilities.
 * All methods are static and cannot be instantiated.
 */
export default abstract class TemplateWriter {
  /**
   * Renders a Nunjucks template and saves the output to a file.
   *
   * @param template - The name of the template file (without extension).
   * @param outFile - The path where the rendered output will be saved.
   * @param context - Optional context object containing variables for template rendering.
   */
  public static renderOut(template: string, outFile: string, context: Record<string, any> = {}): void {
    const templateFile: string = FileHelper.join(FileHelper.dirname(__dirname, 1), 'templates', `${template}.njk`);
    const text = NunjucksHelper.renderFile(templateFile, context, {
      autoescape: false,
    });
    FileHelper.saveTextToFile(outFile, text);
  }

  /**
   * Writes database diagrams in DBML format and generates a README file.
   * Connects to the database using the connection string from environment variables,
   * exports the schema as a DBML file, and creates a README with documentation.
   *
   * @param {string} outputDir - The directory path where the diagram files will be written.
   * @param {string} connectionString - Database connection string
   * @returns {Promise<void>}
   */
  public static async writeDiagrams(outputDir: string, connectionString: string): Promise<void> {
    // Export database schema to DBML format
    await DbmlDiagramExporter.export(connectionString, FileHelper.join(outputDir, 'database.dbml'));
  }

  /**
   * Writes base files required for the scaffold generation.
   *
   * This method generates essential base files for a project scaffold, including:
   * - ModelBase.ts (if repoBase option is enabled)
   * - RepositoryBase.ts
   * - instance.ts
   * - Configuration files (config.js, .env, tsconfig.json, .sequelizerc)
   * - Project setup files (package.json, .gitignore, README.md)
   *
   * @param {string} baseDir - The base directory path where the repositories folder is located.
   * @param {string} mainDir - The main directory name where files will be placed.
   * @param {string} connectionString - The database connection string used for configuration.
   * @param {WriteBaseFileOptions} options - Optional configuration for controlling which files are generated.
   *   @property {boolean} [repoBase=true] - Whether to generate the RepoBase.ts file.
   *
   * @example
   * // Basic usage with default options
   * TemplateWriter.writeBaseFiles('/path/to/project', 'src', 'postgresql://user:pass@localhost:5432/db');
   *
   * @example
   * // Custom options
   * TemplateWriter.writeBaseFiles('/path/to/project', 'src', 'postgresql://user:pass@localhost:5432/db', {
   *   repoBase: false
   * });
   */
  public static writeBaseFiles(baseDir: string, mainDir: string, connectionString: string, options: WriteBaseFileOptions = {}): void {
    const newOptions = merge<Required<WriteBaseFileOptions>>({ repoBase: true }, options);

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

    // Generate ModelBase.ts from template
    this.renderOut('core/env', FileHelper.join(rootPath, '.env'), KnexClient.connectionStringToDbConfig(connectionString));
    this.renderOut('core/tsconfig.json', FileHelper.join(rootPath, 'tsconfig.json'));
    this.renderOut('core/sequelize-rc', FileHelper.join(rootPath, '.sequelizerc'), {dirname: mainDir});
    this.renderOut('core/package.json', FileHelper.join(rootPath, 'package.json'));
    this.renderOut('core/gitignore', FileHelper.join(rootPath, '.gitignore'));
    this.renderOut('core/readme', FileHelper.join(rootPath, 'README.md'));
  }

  /**
   * Generates and writes a repository file for the given model name.
   * This function generates a repository file for the given model name using a template.
   * It renders the repository template with the provided model name and saves it to the
   * repositories directory.
   *
   * @param {string} baseDir - The base directory path where the repositories folder is located.
   * @param {string} modelName - The name of the model to generate the repository for.
   * @param {string} mainDir - The main directory name files placed in.
   */
  public static writeRepoFile(baseDir: string, modelName: string, mainDir: string): void {
    const fileName = FileHelper.join(baseDir, 'repositories', `${modelName}Repository.ts`);
    this.renderOut('repo-template', fileName, {modelName, dirname: mainDir});
    console.log('Repository generated:', fileName);
  }

  public static writeServerFile(baseDir: string, modelName: string, mainDir: string): void {
    this.renderOut('core/server', FileHelper.join(baseDir, `server.ts`), {model: modelName, dirname: mainDir});
  }
}
