/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 *
 * @fileoverview This script generates TypeScript models, repositories, and associated files
 * based on database schema information. It connects to a database using Knex, fetches
 * schema details, and generates corresponding TypeScript files with proper types,
 * relationships, and configurations.
 */

// clients
import { PosquelizeGenerator } from '../src/index';

/**
 * Main function to orchestrate the scaffold generation process.
 * Connects to the database, fetches schema information, and generates
 * models, repositories, and configuration files.
 */
async function run(): Promise<void> {
  // postgresql://<user>:<pass>@<host>:<port>/<database>
  const connectionString = 'postgresql://user:pass@localhost:5432/mydb';

  const generator = PosquelizeGenerator.create(connectionString, __dirname + '/myapp', {
    cleanRootDir: true,
    dirname: 'db',
    //schemas: ['public'],
    //tables: ['products'],
    generator: {
      model: {
        //addNullTypeForNullable: false,
        //replaceEnumsWithTypes: true,
      },
      /*enums: [{
        path: 'public.products.status',
        values: {active: 10, inactive: 5, deleted: 0, suspended: 3},
        defaultValue: 10,
      }, {
        path: 'public.products.visibility',
        values: ['public', 'private'],
        // defaultValue: 'private', // Default Value is set in DDL
      }],*/
    },
    //repositories: false,
    //diagram: false,
    /*migrations: {
      indexes: true,
      seeders: true,
      functions: true,
      domains: true,
      composites: true,
      tables: true,
      views: true,
      triggers: true,
      foreignKeys: true,
    },*/
    //migrations: false, // or
  });

  await generator.generate();

  process.exit();
}

run();
