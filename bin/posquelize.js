#!/usr/bin/env node

/**
 * CLI interface for the Posquelize Generator.
 *
 * This script provides a command-line interface for generating Sequelize models
 * from a PostgreSQL database schema. It supports various configuration options
 * for customizing the generation process.
 */

const path = require('node:path');
const fs = require('node:fs');
const readline = require('readline');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

// classes
const { PosquelizeGenerator } = require('../index');

/**
 * Command line arguments configuration using yargs
 */
const argv = yargs(hideBin(process.argv))
  .parserConfiguration({
    'parse-numbers': false // disabled because of password field, other option can still be explicitly defined as number type
  })
  .usage(
    'Usage: posquelize -h <host> -d <database> -u <user> -x -o [/path/to/myapp]'
  )
  .option('host', {
    description: 'IP/Hostname for the database.',
    type: 'string',
    alias: 'h',
  })
  .option('database', {
    description: 'Database name.',
    type: 'string',
    alias: 'd',
  })
  .option('user', {
    description: 'Username for database.',
    type: 'string',
    alias: 'u',
  })
  .option('pass', {
    description: 'Password for database. If specified without providing a password, it will be requested interactively from the terminal.',
    alias: 'x',
  })
  .option('port', {
    description: 'Port number for database',
    type: 'number',
    alias: 'p'
  })
  .option('use-config', {
    description: 'Use the configuration file (posquelize.config.js)',
    type: 'boolean'
  })
  .option('output', {
    description: 'Relative directory to place the generated files.',
    type: 'string',
    alias: 'o'
  })
  .option('clean', {
    description: 'Clean/Remove the output directory before generation',
    type: 'boolean',
  })
  .option('dirname', {
    description: 'Sequelize directory name under `/src` directory.',
    type: 'string',
    alias: 'n'
  })
  .option('schemas', {
    description: 'Schemas name to be included only (separated by commas)',
    type: 'string',
  })
  .option('tables', {
    description: 'Tables name to be included only (separated by commas)',
    type: 'string',
  })
  .option('extract-templates', {
    description: 'Extract and copy templates into the current directory',
    type: 'boolean',
  })
  .option('no-diagram', {
    description: 'Do not generate ER diagram of the database.',
    type: 'boolean',
  })
  .option('no-migrations', {
    description: 'Do not generate the migration files.',
    type: 'boolean',
  })
  .option('no-repositories', {
    description: 'Do not generate the repository files.',
    type: 'boolean',
  })
  .option('no-enums', {
    description: 'Generate enum alternative (literals and unions)',
    type: 'boolean',
  })
  .option('no-null-type', {
    description: 'Omit null in type declaration for nullable column',
    type: 'boolean',
  })
  .option('dry-run', {
    description: 'Preview changes in terminal instead of writing on the disk',
    type: 'boolean',
    alias: 'dr',
  })
  .option('dry-run-diff', {
    description: 'Generate the detailed HTML comparison file showing changes without writing on the disk',
    type: 'boolean',
    alias: 'drd',
  })
  .option('case-model', {
    description: 'Set case of model names. Choose from:\n - c (camelCase)\n - l (lowercase)\n - o (original case)\n - p (PascalCase)\n - u (UPPER_CASE)',
    type: 'string',
    choices: ['c', 'l', 'o', 'p', 'u'],
    alias: 'cm'
  })
  .option('case-property', {
    description: 'Set case of property names. Choose from:\n - c (camelCase)\n - l (lowercase)\n - o (original case)\n - p (PascalCase)\n - u (UPPER_CASE)',
    type: 'string',
    choices: ['c', 'l', 'o', 'p', 'u'],
    alias: 'cp',
  })
  .option('case-file', {
    description: 'Set case of file names. Choose from:\n - c (camelCase)\n - l (lowercase)\n - o (original case)\n - p (PascalCase)\n - u (UPPER_CASE)\n - k (kebab-case)',
    type: 'string',
    choices: ['c', 'l', 'o', 'p', 'u', 'k'],
    alias: 'cf',
  })
  .option('singularize-model', {
    description: 'Set singularize model names. Choose from:\n - s (singularize)\n - p (pluralize)\n - o (original)',
    type: 'string',
    choices: ['s', 'p', 'o'],
    alias: 'sm',
  })
  .default({
    host: 'localhost',
    port: 5432,
    output: 'myapp',
    dirname: 'database',
    'case-model': 'p',
    'case-property': 'c',
    'case-file': 'p',
    'singularize-model': 's',
    clean: false,
  })
  .showHelpOnFail(true, 'Use --help for usage')
  .help()
  .parse();

function printHeader (...l) {
  console.log(`\n\n██████╗  ██████╗ ███████╗ ██████╗ ██╗   ██╗███████╗██╗     ██╗███████╗███████╗
██╔══██╗██╔═══██╗██╔════╝██╔═══██╗██║   ██║██╔════╝██║     ██║╚══███╔╝██╔════╝
██████╔╝██║   ██║███████╗██║   ██║██║   ██║█████╗  ██║     ██║  ███╔╝ █████╗
██╔═══╝ ██║   ██║╚════██║██║▄▄ ██║██║   ██║██╔══╝  ██║     ██║ ███╔╝  ██╔══╝
██║     ╚██████╔╝███████║╚██████╔╝╚██████╔╝███████╗███████╗██║███████╗███████╗
╚═╝      ╚═════╝ ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚══════╝╚══════╝╚═╝╚══════╝╚══════╝\n`);

  console.log(...l);
}

/**
 * Reads password from stdin without echoing the characters
 * @returns {Promise<string>} The password entered by the user
 */
async function readPassword () {
  let rl = readline.createInterface({
    input: process.stdin,
    terminal: true
  });

  process.stdout.write('Password: ');
  let pwd = await new Promise(resolve => rl.question('', pwd => resolve(pwd)));
  rl.close();
  process.stdout.write('\n');

  return pwd;
}

function toCaseType (alias) {
  switch (alias) {
    case 'c':
      return 'camel';
    case 'l':
      return 'lower_snake';
    case 'p':
      return 'pascal';
    case 'u':
      return 'upper_snake';
    case 'k':
      return 'kebab';
    default:
      return 'original';
  }
}

function toSigularize (alias) {
  switch (alias) {
    case 's':
      return 'singular';
    case 'p':
      return 'plural';
    default:
      return 'original';
  }
}

/**
 * Main execution function
 */
(async function () {
  printHeader();

  if (Object.hasOwn(argv, 'extract-templates')) {
    const destDir = path.normalize(process.cwd() + '/templates');
    const srcDir = path.normalize(__dirname + '/../lib/templates');

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);

    try {
      fs.cpSync(srcDir, destDir, { recursive: true });
      console.log('Notice: Templates has been copied to `/templates` directory.');
    } catch (e) {
      console.log('Failed to copy templates due to ' + e.message);
    }
    return;
  }

  const dir = !argv.noWrite && (argv.output || path.resolve(process.cwd() + '/myapp'));

  /** @type {import('../index').GeneratorOptions}  */
  const config = {
    cleanRootDir: argv.clean,
    dirname: argv.dirname,
    schemas: String(argv.schemas || '').split(',').filter(Boolean),
    tables: String(argv.tables || '').split(',').filter(Boolean),
    generator: {
      model: {
        naming: {
          model: toCaseType(argv['case-model']),
          property: toCaseType(argv['case-property']),
          file: toCaseType(argv['case-file']),
          singularizeModel: toSigularize(argv['singularize-model']),
        },
      },
    },
    dryRun: Object.hasOwn(argv, 'dry-run'),
    dryRunDiff: Object.hasOwn(argv, 'dry-run-diff'),
  };

  if (config.dryRunDiff) {
    config.dryRun = true;
  }

  if (Object.hasOwn(argv, 'no-diagram')) {
    config.diagram = false;
  }

  if (Object.hasOwn(argv, 'no-migrations')) {
    config.migrations = false;
  }

  if (Object.hasOwn(argv, 'no-repositories')) {
    config.repositories = false;
  }

  if (Object.hasOwn(argv, 'no-enums')) {
    config.generator.model.replaceEnumsWithTypes = true;
  }

  if (Object.hasOwn(argv, 'no-null-type')) {
    config.generator.model.addNullTypeForNullable = false;
  }

  if (Object.hasOwn(argv, 'use-config')) {
    const generator = await PosquelizeGenerator.createWithConfig(process.cwd(), { ...config, outputDir: dir });
    if (!generator) return;

    await generator.generate();
    process.exit(1);
  }

  if (!argv['user'] || !argv['database'] || !argv['pass']) {
    console.error('Missing required arguments. Use --help for usage information.');
    process.exit(1);
  }

  let password;
  if (typeof argv.pass === 'boolean' && argv.pass) {
    password = await readPassword();
  } else if (typeof argv.pass === 'string') {
    console.warn('Warning: using a password on the command line interface can be insecure.');
    password = argv.pass;
  }

  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // do nothing
  }

  const connectionString = `postgresql://${argv.user}:${password}@${argv.host}:${argv.port}/${argv.database}`;

  const generator = new PosquelizeGenerator(connectionString, dir, config);
  await generator.generate();

  process.exit(1);

}()).catch(err => {
  if (err.stack) {
    console.error(err.stack);
  } else if (err.message) {
    console.error(err.message);
  } else {
    console.error(err);
  }
  process.exitCode = 1;
});
