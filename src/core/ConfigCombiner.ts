/**
 * Configuration utility class for merging multiple configuration objects.
 * Provides deep merge functionality while preserving nested structures and
 * handling property inheritance. Offers static methods for different merging scenarios.
 *
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import merge from 'deepmerge';

// objects
import CodeFile from '~/objects/CodeFile';

// types
import type {GenerateConfigFile, GeneratorOptions} from '~/typings/generator';

/**
 * Utility class that provides configuration merging capabilities using deep merge.
 * This class offers static methods to combine various configuration objects
 * while maintaining nested structures and resolving conflicts appropriately.
 */
export default abstract class ConfigCombiner {
  /**
   * Deeply merges multiple objects into a single combined object.
   * Utilizes the deepmerge library to handle nested object merging.
   * @param options - Array of objects to merge in order.
   * @returns A new object containing all merged properties with later objects overriding earlier ones.
   */
  public static mergeAll<T>(...options: Partial<T>[]): T {
    let combined = {} as T;

    for (const option of options) {
      combined = merge(combined, option);
    }

    return combined;
  }

  /**
   * Merges multiple generator options objects with default values.
   * @param options - Array of generator options to merge in order.
   * @returns A merged GeneratorOptions object combining all provided options.
   */
  public static withOptions(...options: Partial<GeneratorOptions>[]): GeneratorOptions {
    return this.mergeAll(
      {
        schemas: [],
        tables: [],
        dirname: 'database',
        cleanRootDir: false,
        diagram: true,
        migrations: {
          indexes: true,
          seeders: true,
          functions: true,
          domains: true,
          composites: true,
          tables: true,
          views: true,
          triggers: true,
          foreignKeys: true,
        },
        repositories: true,
        generator: {
          model: {
            addNullTypeForNullable: true,
            replaceEnumsWithTypes: false,
            naming: {
              model: 'pascal',
              file: 'pascal',
              property: 'camel',
              singularizeModel: 'singular',
            },
          },
          migration: {
            useCommonJs: false,
          },
          enums: [],
        },
        dryRun: false,
        dryRunDiff: false,
        templatesDir: '',
        beforeFileSave(_file: CodeFile): boolean {
          return true;
        },
      },
      ...options,
    );
  }

  /**
   * Merges multiple generate config file objects with default connection settings.
   * @param options - Array of generate config files to merge in order.
   * @returns A merged GenerateConfigFile object combining all provided configurations.
   */
  public static withFileOptions(...options: Partial<GenerateConfigFile>[]): GenerateConfigFile {
    return this.mergeAll({
      connection: {
        host: 'localhost',
        username: 'postgres',
        password: '',
        database: 'test_db',
        port: 5432,
      },
      outputDir: '',
    }, this.withOptions(), ...options);
  }
}
