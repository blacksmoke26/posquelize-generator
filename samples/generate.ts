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

  const generator = new PosquelizeGenerator(connectionString, __dirname + '/myapp', {
    cleanRootDir: true,
    dirname: 'db',
  });

  await generator.generate();

  process.exit();
}

run();
