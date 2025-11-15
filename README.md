# Posquelize: PostgreSQL to Sequelize Generator

Automatically generate [SequelizeJS](https://sequelize.org/) minimal application via the command line.

## Overview

Posquelize is a powerful CLI tool that automates the generation of Sequelize applications from PostgreSQL databases. It connects directly to your PostgreSQL instance, analyzes the database schema, and produces production-ready TypeScript boilerplate with comprehensive type definitions.

## Key Features

### Core Functionality

- ✅ **Complete Model Generation**: Creates Sequelize models,
  repositories, and TypeScript type definitions
- 🔄 **Comprehensive Migration Support**: Generates migrations for
  tables, functions, domains, views, triggers, indexes, and keys
- 📊 **Advanced Type Support**: Handles custom user-defined types
  with automatic conversions
- ⚡ **Visual Documentation**: Creates database ER diagrams in DBML
- 🚀 **Selective Generation**: Filter by schemas or tables for
  targeted code generation
- 🔍 **Smart Relationship Detection**: Identifies and configures
  table relationships and associations
- 📝 **Rich Type Definitions**: Generates TypeScript interfaces,
  enums, and JSONB prototypes
- 🎯 **Production-Ready Boilerplate**: Creates minimal but complete
  application structure
- 🛠️ **Enhanced Model Options**: Configurable model properties
  including timestamps, paranoid mode
- 🔧 **Advanced Migration Control**: Granular control over migration
  generation with selective inclusion/exclusion options
- 📋 **JSON Schema Support**: Generates JSON schemas for validation
  and API documentation
- 🏗️ **Composite Type Handling**: Support for PostgreSQL composite
  types with automatic TypeScript interface generation

### Developer Experience

- 🔐 **Secure Authentication**: Interactive password prompts to avoid
  sensitive data in command history
- 📁 **Flexible Output**: Configurable output directory and
  Sequelize directory structure
- 🧹 **Clean Generation**: Automatic directory cleanup with `--clean`
- 🎨 **Template Customization**: Support for custom output templates *(upcoming)*
- ⚙️ **Configuration Files**: Advanced configuration via
  posquelize.config.js for complex setups
- 🚀 **Programmatic API**: Full TypeScript API for integration into
  build pipelines and custom tools

## Quick Start

### Installation

```bash
npm install -g posquelize
```

### Basic Usage

```bash
posquelize -h localhost -u postgres -d myapp_db -x
```

For advanced usage and a complete list of all available options, run:

```bash
posquelize --help
```

## Configuration Options

### Required Parameters

| Option                         | Description                            | Example      |
|--------------------------------|----------------------------------------|--------------|
| 🗄️ `-d, --database <name>`    | Target database name                   | `myapp_db`   |
| 👤 `-u, --user <username>`     | Database username                      | `postgres`   |
| 🔐 `-x, --password <password>` | Database password (or omit for prompt) | `mypassword` |

### Optional Parameters

| Option                         | Description                                                            | Default     |
|--------------------------------|------------------------------------------------------------------------|-------------|
| 🌐 `-h, --host <address>`      | IP/Hostname for the database                                           | `localhost` |
| 🔌 `-p, --port <port>`         | Database connection port                                               | `5432`      |
| 📑 `-c, --config`              | Load `posquelize.config.js` configuration file from current directory. | `false`     |
| 📁 `-o, --output <directory>`  | Output directory path                                                  | `./myapp`   |
| 📂 `-n, --dirname <directory>` | Sequelize subdirectory name                                            | `database`  |
| 🧹 `--clean`                   | Clean output directory before generation                               | `false`     |
| 🏗️ `--schemas <schemas>`      | Specific schemas to process (comma-separated)                          | -           |
| 📋 `--tables <tables>`         | Specific tables to generate (comma-separated)                          | -           |
| 📊 `--no-diagram`              | Skip [DBML](https://dbml.dbdiagram.io/) ER diagram generation          | `false`     |
| 📋 `--no-migrations`           | Skip migration files generation                                        | `false`     |
| 📦 `--no-repositories`         | Skip repository files generation                                       | `false`     |
| 🏷️ `--no-enums`               | Use alternative types (`literal` / `union`) instead of `enum`          | `false`     |
| 📋 `--no-null-type`            | Omit `null` in type declaration for nullable column                    | `false`     |

## Usage Examples

### Interactive Password Prompt

```bash
posquelize -h localhost -u postgres -d myapp_db -x
```

### Schema-Specific Generation

```bash
posquelize -h localhost -u postgres -d myapp_db -x --schemas public,auth
```

### Table-Specific Generation

```bash
posquelize -h localhost -u postgres -d myapp_db -x --tables users,posts,comments
```

### Custom Output with Clean Build

```bash
posquelize -h localhost -u postgres -d myapp_db -x -o ./my-sequelize-app --clean
```

## Security Best Practices

**⚠️ Security Alert**: Never include passwords directly in command-line arguments or scripts. Posquelize provides an interactive password prompt when the `-x` flag is used without a value, ensuring credentials don't appear in shell history or process lists.

## Generated Project Structure

The tool generates a complete application structure with:

- **TypeScript Models**: Fully typed models with validations
- **Migration Scripts**: Version-controlled database schema changes
- **Type Definitions**: Comprehensive TypeScript interfaces and types
- **Relationship Maps**: Automatically configured associations
- **Repository Pattern**: Abstraction layer for data access

```text
myapp/
│   📄 .env                  # Environment variables
│   📄 .gitignore            # Git ignore rules
│   ⚙️ .sequelizerc          # Sequelize configuration
│   📦 package.json          # Dependencies and scripts
│   📖 README.md             # Project documentation
│   ⚙️ tsconfig.json         # TypeScript configuration
└───src/
    │   🚀 server.ts         # Application entry point
    └───database/            # Sequelize directory
        │    🔗 instance.ts  # Database connection
        ├───base/            # Base classes
        │    📝 ModelBase.ts
        │    📝 RepositoryBase.ts
        ├───config/          # Configuration files
        │    ⚙️ config.js
        ├───diagrams/        # Database documentation
        │    📊 database.dbml
        │    📖 README.md
        ├───migrations/      # Database migrations
        ├───models/          # Generated models
        ├───repositories/    # Generated repositories
        ├───seeders/         # Database seeders
        └───typings/         # Type definitions
             📝 models.d.ts
```

## Configuration File
To use a configuration file for more complex setups:

1. Create a `posquelize.config.js` file in your project's root directory.

   **Note**: If a config file doesn't exist, will be created in the current directory.
2. Configure your options using the JavaScript configuration object.
3. Run the generator with the `--use-config`.

```bash
posquelize --use-config
```

#### Available configuration via `posquelize.config.js` file:

```javascript
module.exports = {
  connection: {             // Database connection configuration
    host: 'localhost',      // Host name / IP
    username: 'postgres',   // Username for database
    password: '<password>', // The password
    database: 'test_db',    // The database name
    port: 5432,             // The port to connect
  },

  outputDir: __dirname + '/my_app', // Output directory
  cleanRootDir: true,       // Clean output directory before generation
  dirname: 'db',            // Sequelize subdirectory name

  schemas: [/*'public'*/],  // Specific schemas to process
  tables:  [/*'tags', 'products'*/], // Specific tables to generate

  // Migration configuration
  migrations: {
    indexes: true,    // Generate index migrations
    seeders: true,    // Generate seeder files
    functions: true,  // Generate function migrations
    domains: true,    // Generate domain migrations
    composites: true, // Generate composite type migrations
    tables: true,     // Generate table migrations
    views: true,      // Generate view migrations
    triggers: true,   // Generate trigger migrations
    foreignKeys: true // Generate foreign key migrations
  },

  diagram: false,       // Skip DBML diagram generation
  repositories: false,  // Skip repository file generation

  generator: {
    model: {
      addNullTypeForNullable: true, // Controls whether nullable typed property
      replaceEnumsWithTypes: false, // Replace enum with String Union types
    },
    // Configurable enums for table columns, (generate enums instead of plain value)
    enums: [{
      path: 'public.products.status', // schemaName.tableName.columnName
      values: {active: 10, inactive: 5, deleted: 0, suspended: 3}, // key:value map
      defaultValue: 10, // Default value to be set in init -> options -> column definition
    }, {
      path: 'public.products.visibility',
      values: ['public', 'private'], // list of values
      // defaultValue: 'private', // Default Value is set in DDL
    }],
  },
};
```

## Programmatic API

The Posquelize programmatic API allows you to integrate database generation directly into your TypeScript/JavaScript applications. This provides greater flexibility and automation capabilities compared to using the CLI alone.

### Basic Usage

```ts
import { PosquelizeGenerator } from 'posquelize';

// Define your PostgreSQL connection string
// Format: postgresql://<user>:<pass>@<host>:<port>/<database>
const connectionString = 'postgresql://user:pass@localhost:5432/test_db';

// Initialize the generator with connection string and output path
const posquelize = PosquelizeGenerator.create(connectionString, __dirname + '/myapp', {
  cleanRootDir: true, // Clean output directory before generation

  // other configuration goes here
});

// Execute the generation process
await posquelize.generate();
```

### Advanced Configuration

The programmatic API supports all configuration options available in the CLI tool, allowing for fine-grained control over the generation process:

```ts
import { PosquelizeGenerator, GeneratorOptions } from 'posquelize';

const options: GeneratorOptions = {
  cleanRootDir: true,
  dirname: 'database',
  schemas: ['public', 'auth'],
  tables: ['users', 'posts', 'comments'],
  migrations: {
    tables: true,
    foreignKeys: true,
    indexes: false
  },
  diagram: false,
  repositories: true
};

const posquelize = PosquelizeGenerator.create(connectionString, './output', options);

await posquelize.generate();
```

### Error Handling

Always wrap the generation process in try-catch blocks to handle potential connection or generation errors:

```ts
try {
  await posquelize.generate();
  console.log('Database generation completed successfully!');
} catch (error) {
  console.error('Generation failed:', error.message);
  // Handle error appropriately for your application
}
```

## Contributing to Posquelize

1. Fork the project repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Implement your changes with proper testing
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Submit a Pull Request for review

## Tech Stack & Tools

- **Machine**: Legion Pro 7 [16IAX10H](https://psref.lenovo.com/Detail/Legion_Pro_7_16IAX10H?M=83F50050PS)
- **Development Environment**: Windows 11
- **Primary IDE**: JetBrains PhpStorm
- **Alternative Editor**: [Zed](https://zed.dev/) with AI assistance
- **AI Tools**: [Qwen](https://qwen.ai/home), [Ollama](http://ollama.com) ([GLM 4.6](https://docs.z.ai/guides/llm/glm-4.6), Qwen 3 Coder)

## Acknowledgments

This project builds upon concepts and implementations from [Sequelize Models Generator](https://github.com/blacksmoke26/sequelize-models-generator), with significant enhancements for TypeScript support and application generation.

## Inspirations

This project draws inspiration from innovative tools in the Sequelize ecosystem:

- **[Sequelize UI](https://sequelizeui.app/)** - A comprehensive web-based solution for generating TypeScript Sequelize code with flexible database configurations and customizable outputs.

- **[Sequelize-Auto](https://github.com/sequelize/sequelize-auto)** - A command-line utility that automates the creation of Sequelize models by analyzing existing database structures.

## License

Posquelize is released under the MIT License. See LICENSE file for details.
