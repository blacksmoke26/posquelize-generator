# Posquelize: PostgreSQL to Sequelize Generator

Automatically generate [SequelizeJS](https://sequelize.org/) minimal application via the command line.

## Overview

Posquelize is a powerful CLI tool that automates the generation of Sequelize applications from PostgreSQL databases. It connects directly to your PostgreSQL instance, analyzes the database schema, and produces production-ready TypeScript boilerplate with comprehensive type definitions.

## Key Features

### Core Functionality

- ✅ **Complete Model Generation**: Creates Sequelize models,
  repositories, and TypeScript type definitions
- 🔄 **Comprehensive Migration Support**: Generates migrations for
  tables, functions, domains, views, triggers, indexes, and keys in EcmaScript or CommonJS format.
- 📊 **Advanced Type Support**: Handles custom user-defined types
  with automatic conversions
- 📚 **Multi-Schema Support**: Seamlessly handle multiple database
  schemas with efficient processing and organization.
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
- 📋 **JSON/JSONB Support**: Automatically detects and generates TypeScript interfaces from
  column defaults or values, ensuring proper type safety for structured data.
- 🏗️ **Composite Type Handling**: Support for PostgreSQL composite
  types with automatic TypeScript interface generation
- 🏷️ **Flexible Naming Conventions**: Configurable case conversion for models
  (camelCase, PascalCase, etc.), properties, and file names
- 🔤 **Singularization Control**: Options to singularize, pluralize, or preserve original model names
- 📊 **Selective Component Generation**: Fine-grained control over generating diagrams,
  migrations, repositories, and enums

### Developer Experience

- 🔐 **Secure Authentication**: Interactive password prompts to avoid sensitive data in command history
- 📁 **Flexible Output**: Configurable output directory and Sequelize directory structure
- 🧹 **Clean Generation**: Automatic directory cleanup with `--clean`
- 🎨 **Template Customization**: Extract and customize built-in templates for tailored code generation
- ⚙️ **Configuration Files**: Advanced configuration via `posquelize.config.js` for complex setups
- 🚀 **Programmatic API**: Full TypeScript API for integration into build pipelines and custom tools
- 🧪 **Dry Run Mode**: Preview generation changes without modifying files with `--dry-run`
- 🔄 **Dry Run Interactive Mode**: Generate detailed HTML comparison showing changes 
  between existing and generated files with `--dry-run-diff`

## Quick Start

### Installation

```bash
npm install -g posquelize   # for NPM
pnpm add -g posquelize      # for PNPM
yarn global add posquelize  # for Yarn
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

| Option                         | Description                                                              | Default     |
|--------------------------------|--------------------------------------------------------------------------|-------------|
| 🌐 `-h, --host <address>`      | IP/Hostname for the database                                             | `localhost` |
| 🔌 `-p, --port <port>`         | Database connection port                                                 | `5432`      |
| 📁 `-o, --output <directory>`  | Output directory path                                                    | `./myapp`   |
| 📂 `-n, --dirname <directory>` | Sequelize subdirectory name                                              | `database`  |
| ⚙️ `--use-config`              | Load `posquelize.config.js` configuration file from current directory.   | -    |
| 📚 `--schemas <schemas>`       | Specific schemas to process (comma-separated)                            | -           |
| 📋 `--tables <tables>`         | Specific tables to generate (comma-separated)                            | -           |
| 🧹 `--clean`                   | Clean output directory before generation                                 | -     |
| 📊 `--no-diagram`              | Skip [DBML](https://dbml.dbdiagram.io/) ER diagram generation            | -     |
| 📋 `--no-migrations`           | Skip migration files generation                                          | -     |
| 📦 `--no-repositories`         | Skip repository files generation                                         | -     |
| 🏷️ `--no-enums`               | Use alternative types (`literal` / `union`) instead of `enum`            | -     |
| 📋 `--no-null-type`            | Omit `null` in type declaration for nullable column                      | -     |
| 🎨 `--extract-templates`       | Extract template files into the current directory for customization | -     |
| 🧪 `--dr, --dry-run`         | Preview generation changes without modifying files | -     |
| 🔄 `--drd, --dry-run-diff`       | Generate detailed HTML comparison showing changes between existing and generated files | -     |
| 📝 `--cm, --case-model <type>`         | Set case of model names (`c`=camelCase, `l`=lowercase, `o`=original, `p`=PascalCase, `u`=UPPER_CASE) | `p` |
| 🏷️ `--cp, --case-property <type>`      | Set case of property names (`c`=camelCase, `l`=lowercase, `o`=original, `p`=PascalCase, `u`=UPPER_CASE) | `c` |
| 📁 `--cf, --case-file <type>`           | Set case of file names (`c`=camelCase, `l`=lowercase, `o`=original, `p`=PascalCase, `u`=UPPER_CASE, `k`=kebab-case) | `p` |
| 🔤 `--sm, --singularize-model <type>`   | Set singularize model names (`s`=singularize, `p`=pluralize, `o`=original) | `s` |

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

### Dry Run Preview

```bash
posquelize -h localhost -u postgres -d myapp_db -x --dry-run
```

### Dry Run with HTML Diff

```bash
posquelize -h localhost -u postgres -d myapp_db -x --dry-run-diff
```
### Custom Naming Conventions

```bash
# Generate models with camelCase names, properties, and files
posquelize -h localhost -u postgres -d myapp_db -x --case-model c --case-property c --case-file c

# Generate models with original case for names, lowercase properties, and kebab-case files
posquelize -h localhost -u postgres -d myapp_db -x --case-model o --case-property l --case-file k

# Generate models with UPPER_CASE names but PascalCase properties
posquelize -h localhost -u postgres -d myapp_db -x --case-model u --case-property p

# Generate models with pluralized names (keep original table names)
posquelize -h localhost -u postgres -d myapp_db -x --singularize-model p

# Generate models with singular names (default behavior)
posquelize -h localhost -u postgres -d myapp_db -x --singularize-model s

# Generate models preserving original table names
posquelize -h localhost -u postgres -d myapp_db -x --singularize-model o
```

### Advanced Naming Examples

```bash
# Full naming convention overhaul for a specific style guide
posquelize -h localhost -u postgres -d myapp_db -x --cm c --cp c --cf k --sm s --schemas public,auth

# Enterprise naming convention (PascalCase models, camelCase properties, PascalCase files)
posquelize -h localhost -u postgres -d myapp_db -x --cm p --cp c --cf p --sm s --clean

# Database-first approach (preserve all original cases and names) with dry-run mode
posquelize -h localhost -u postgres -d myapp_db -x --cm o --cp o --cf o --sm o --dry-run
```

### Configuration File Examples

#### Basic Configuration

```bash
# Create a basic config file and use it
posquelize --use-config

# Override the config options with the predefined flags (-* or --*)
posquelize --use-config --dry-run-diff

# The command will create posquelize.config.js if it doesn't exist
# You can then edit the file with your settings

# Generate with custom config file path
posquelize --use-config -c /path/to/custom.config.js
```

#### Template Customization Workflow

```bash
# Step 1: Extract templates to current directory
posquelize --extract-templates

# Step 2: Customize the templates in ./templates/ directory
# Edit the template files as needed

# Step 3: Use config file to specify custom templates
posquelize --use-config

# In posquelize.config.js, specify:
// templatesDir: __dirname + '/templates'
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
<output-directory>/
│   📄 .env                                          # Environment variables
│   📄 .gitignore                                    # Git ignore rules
│   ⚙️ .sequelizerc                                  # Sequelize configuration
│   📦 package.json                                  # Dependencies and scripts
│   📖 README.md                                     # Project documentation
│   ⚙️ tsconfig.json                                 # TypeScript configuration
└───src/
    │   🚀 server.ts                                 # Application entry point
    └───<sequelize-directory>/                        # Default to `database`
        │    🔗 instance.ts                          # Database connection
        ├───base/                                     # Base classes
        │   ├── 📝 ModelBase.ts
        │   └── 📝 RepositoryBase.ts
        ├───config/                                  # Configuration files
        │   └── ⚙️ config.js
        ├───diagrams/                                # Database documentation
        │   ├── 📊 database.dbml
        │   └── 📖 README.md
        ├── models/                                  # Sequelize model files
        │   ├── 📝 User.ts
        │   ├── 📝 Post.ts
        │   └── ...                                  # Generated model files
        ├── migrations/                              # Sequelize migration files
        │   ├── 📝 20251101000000-create-users.js
        │   ├── 📝 20251101000001-create-posts.js
        │   └── ...                                  # Generated migration files
        ├── repositories/                            # Repository pattern implementations
        │   ├── 📝 UserRepository.ts
        │   ├── 📝 PostRepository.ts
        │   └── ...                                  # Generated repository files
        ├───seeders/                                 # Database seeders
        └───typings/                                 # TypeScript type definitions
            └──📝 models.d.ts
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
    migration: {
      /**
       * Determines whether migration files should be generated using CommonJS module
       * syntax instead of ECMAScript modules (ESM)
       */
      useCommonJs: true,
    },
    model: {
      addNullTypeForNullable: true, // Controls whether nullable typed property
      replaceEnumsWithTypes: false, // Replace enum with String Union types
      /**
       * Configuration options for naming conventions used in code generation.
       * Controls how models, properties, and files are named to match
       * specific project coding standards and preferences.
       */
      naming: {
        // Naming convention for model names
        model: 'pascal',
        // Naming convention for property names
        property: 'camel',
        // Naming convention for file names
        file: 'pascal',
        // Model singularization
        singularizeModel: 'singular',
      },
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
  
  // Path to directory containing custom templates for code generation
  templatesDir: __dirname + '/templates',
  
  // Preview of changes without actually writing files to disk.
  dryRun: true,
  
  // Interactive HTML comparison of changes without actually writing files to disk.
  dryRunDiff: true,
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

## Development Setup

```bash
git clone https://github.com/blacksmoke26/posquelize.git
cd posquelize
npm install
# Edit the connection string in 'samples/generate.ts', and run
npm run dev
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

Posquelize is released under the MIT License.

## Copyright ©️

Developed with ❤️ by [Junaid Atari](https://github.com/blacksmoke26)