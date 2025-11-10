## v0.0.1 - 2025-10-11

### Added
- **Complete Model Generation**: Automatic creation of Sequelize models, repositories, and TypeScript type definitions
- **Comprehensive Migration Support**: Generation of migrations for tables, functions, domains, views, triggers, indexes, and foreign keys
- **Advanced Type Support**: Handling of custom/user-defined types (UDT) with automatic conversions
- **Visual Documentation**: Database ERD diagrams in DBML format
- **Selective Generation**: Filtering by specific schemas or tables for targeted code generation
- **Smart Relationship Detection**: Automatic identification and configuration of table relationships
- **Rich Type Definitions**: TypeScript interfaces, enums, and JSONB prototypes
- **Production-Ready Boilerplate**: Minimal but complete application structure with `.env`, `tsconfig.json`, and Sequelize directory

### Changed
- **Configuration Options**:
    - New `--clean` flag for automatic output directory cleanup
    - Customizable output directory and Sequelize subdirectory name
- **Security**:
    - Interactive password prompt for secure authentication (replaces direct password input)
    - Enhanced security practices for credential handling

### Security
- **Security Best Practices**:
    - Never include passwords in command-line arguments; use interactive prompts for sensitive data
    - Prevents credentials from appearing in shell history or process lists

### Notable Enhancements
- **Developer Experience**:
    - Flexible output configuration
    - Template customization support
    - Improved relationship mapping and type inference
