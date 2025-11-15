/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @description A class responsible for handling configuration files and generating PosquelizeGenerator instances.
 *
 * @example
 * ```typescript
 * const handler = new ConfigHandler('path/to/config.ts');
 * await handler.load();
 * const generator = handler.createGenerator();
 * ```
 */

// classes
import KnexClient from '~/classes/KnexClient';
import ConfigCombiner from '~/core/ConfigCombiner';
import PosquelizeGenerator from '~/core/PosquelizeGenerator';

// helpers
import FileHelper from '~/helpers/FileHelper';

// types
import type { GenerateConfigFile } from '~/typings/generator';

/**
 * Handles configuration loading and generator creation for Posquelize.
 *
 * @class ConfigHandler
 * @description Manages configuration file loading, option merging, and creation of PosquelizeGenerator instances.
 *
 * @since 0.0.2
 */
export default class ConfigHandler {
  /**
   * The merged configuration object.
   * @private
   */
  private config: GenerateConfigFile | undefined;

  /**
   * Creates an instance of ConfigHandler.
   * @param {string} configFile - The name of the configuration file.
   * @constructor
   */
  constructor(public readonly configFile: string) {}

  /**
   * Loads the configuration file asynchronously.
   * @returns {Promise<boolean>} - Returns true if the configuration file is loaded successfully, otherwise false.
   * @async
   * @throws {Error} When configuration file cannot be loaded or parsed
   */
  public async load(): Promise<boolean> {
    try {
      const module = await import(this.configFile);
      this.config = module.default as GenerateConfigFile;
    } catch (e: any) {
      console.error(`Failed to load configuration file: ${e.message}`);
      return false;
    }

    return true;
  }

  /**
   * Merges default configuration with loaded configuration.
   * @private
   * @returns {GenerateConfigFile} - The merged configuration object
   */
  private getOptions(): GenerateConfigFile {
    return ConfigCombiner.withFileOptions({
      outputDir: FileHelper.join(FileHelper.dirname(this.configFile), 'myapp'),
    }, this?.config ?? {});
  }

  /**
   * Creates a new instance of PosquelizeGenerator with merged configuration.
   * @returns {PosquelizeGenerator} - The generated PosquelizeGenerator instance
   * @throws {Error} When database connection configuration is invalid
   */
  public createGenerator(): PosquelizeGenerator {
    const { host, username, password, database, port } = this.getOptions().connection;

    const connectionSting = KnexClient.dbConfigToConnectionString({
      host,
      name: database,
      password,
      port,
      username,
    });

    return PosquelizeGenerator.create(connectionSting, this.getOptions().outputDir!, this.getOptions());
  }
}
