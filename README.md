# Posquelize: PostgreSQL to Sequelize Generator

Automatically generate [SequelizeJS](https://sequelize.org/) minimal application via the command line.

## Overview

Posquelize is a powerful CLI tool that automates the generation of Sequelize applications from PostgreSQL databases. It connects directly to your PostgreSQL instance, analyzes the database schema, and produces production-ready TypeScript boilerplate with comprehensive type definitions.

## Key Features

### Core Functionality

- ✅ **Complete Model Generation**: Automatically creates Sequelize models, repositories, and TypeScript type definitions
- 🔄 **Comprehensive Migration Support**: Generates migrations for tables, functions, domains, views, triggers, indexes, and foreign keys
- 📊 **Advanced Type Support**: Handles custom/user-defined types (UDT) with automatic conversions
- ⚡ **Visual Documentation**: Creates database ERD diagrams in DBML format
- 🚀 **Selective Generation**: Filter by specific schemas or tables for targeted code generation
- 🔍 **Smart Relationship Detection**: Automatically identifies and configures table relationships and associations
- 📝 **Rich Type Definitions**: Generates TypeScript interfaces, enums, and JSONB prototypes
- 🎯 **Production-Ready Boilerplate**: Creates a minimal but complete application structure

### Developer Experience

- 🔐 **Secure Authentication**: Interactive password prompts to avoid sensitive data in command history
- 📁 **Flexible Output**: Configurable output directory and Sequelize directory structure
- 🧹 **Clean Generation**: Automatic directory cleanup with `--clean` option
- 🎨 **Template Customization**: Support for custom output templates

## Quick Start

### Installation

```bash
npm install -g posquelize
```

### Basic Usage

```bash
posquelize -h localhost -u postgres -d myapp_db -x --clean
```

## Configuration Options

### Required Parameters

| Option | Description | Example |
|--------|-------------|---------|
| 🗄️ `-d, --database <name>` | Target database name | `myapp_db` |
| 👤 `-u, --user <username>` | Database username | `postgres` |
| 🔐 `-x, --password <password>` | Database password (or omit for prompt) | `mypassword` |

### Optional Parameters

| Option                      | Description                                                   | Default    |
|-----------------------------|---------------------------------------------------------------|------------|
| 🔌 `-p, --port <port>`      | Database connection port                                      | `5432`     |
| 📁 `-o, --output <directory>` | Output directory path                                         | `./myapp`  |
| 📂 `-n, --dirname <directory>` | Sequelize subdirectory name                                   | `database` |
| 🧹 `--clean`                | Clean output directory before generation                      | `false`    |
| 🏗️ `--schemas <schemas>`   | Specific schemas to process (comma-separated)                 | `all`      |
| 📋 `--tables <tables>`      | Specific tables to generate (comma-separated)                 | `all`      |
| 📊 `--no-diagram`        | Skip [DBML](https://dbml.dbdiagram.io/) ER diagram generation | `false`    |
| 📋 `--no-migrations`     | Skip migration files generation                               | `false`    |
| 📦 `--no-repositories`   | Skip repository files generation                              | `false`    |

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

## Generated Project Structure

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

## Security Best Practices

**⚠️ Security Alert**: Never include passwords directly in command-line arguments or scripts. Posquelize provides an interactive password prompt when the `-x` flag is used without a value, ensuring credentials don't appear in shell history or process lists.

## Generated Output Details

The tool generates a complete application structure with:

- **TypeScript Models**: Fully typed models with validations
- **Migration Scripts**: Version-controlled database schema changes
- **Type Definitions**: Comprehensive TypeScript interfaces and types
- **Relationship Maps**: Automatically configured associations
- **Repository Pattern**: Abstraction layer for data access

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
- **Alternative Editor**: [Zed AI](https://zed.dev/) with AI assistance
- **AI Tools**: [Qwen](https://qwen.ai/home), Ollama ([GLM 4.6](https://docs.z.ai/guides/llm/glm-4.6), Qwen 3 Coder)

## Acknowledgments

This project builds upon concepts and implementations from [Sequelize Models Generator](https://github.com/blacksmoke26/sequelize-models-generator), with significant enhancements for TypeScript support and application generation.

## Inspirations

This project draws inspiration from innovative tools in the Sequelize ecosystem:

- **[Sequelize UI](https://sequelizeui.app/)** - A comprehensive web-based solution for generating TypeScript Sequelize code with flexible database configurations and customizable outputs.

- **[Sequelize-Auto](https://github.com/sequelize/sequelize-auto)** - A command-line utility that automates the creation of Sequelize models by analyzing existing database structures.

## License

Posquelize is released under the MIT License. See LICENSE file for details.
