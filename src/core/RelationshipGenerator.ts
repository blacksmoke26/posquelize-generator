/**
 * @fileoverview Provides utilities for generating relationship aliases and Sequelize mixin declarations
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @version 1.0.0
 */

import pluralize, { singular } from 'pluralize';
import { camelCase, pascalCase } from 'change-case';

// helpers
import StringHelper from '~/helpers/StringHelper';

// utils
import { sp } from './ModelGenerator';
import { RelationshipType } from '~/classes/DbUtils';

// types
import type { Relationship } from '~/typings/utils';
import type { InitTemplateVars, ModelTemplateVars } from './ModelGenerator';

/**
 * Interface for filtering relationships during generation.
 * Used to control which relationships are included when generating Sequelize model associations.
 *
 * @interface GenerateRelationFilters
 *
 * @example
 * ```typescript
 * // Filter out specific schemas and tables
 * const filters: GenerateRelationFilters = {
 *   schemas: ['temp', 'archive'],
 *   tables: ['audit_log', 'temp_data']
 * };
 *
 * // Use with RelationshipGenerator.generateRelations()
 * RelationshipGenerator.generateRelations(relationships, templateVars, filters);
 * ```
 */
export interface GenerateRelationFilters {
  /** Array of schema names to exclude from relationship generation */
  schemas?: string[];
  /** Array of table names to exclude from relationship generation */
  tables?: string[];
}

/**
 * Abstract utility class for generating Sequelize relationship aliases and mixin declarations.
 * This class handles the creation of TypeScript declarations for various relationship types
 * including HasMany, BelongsTo, HasOne, and BelongsToMany relationships.
 *
 * The generated code includes:
 * - Property declarations for relationship instances
 * - Method declarations for relationship operations (get, set, add, remove, etc.)
 * - Type-safe mixin declarations using Sequelize's typing system
 *
 * @example
 * ```typescript
 * // Generate mixins for a HasMany relationship
 * const mixins = RelationshipGenerator.generateHasManyMixins('users', 'Post', 'User');
 *
 * // Create an alias for a BelongsTo relationship
 * const alias = RelationshipGenerator.createAlias(RelationshipType.BelongsTo, source, target);
 * ```
 */
export default abstract class RelationshipGenerator {
  /**
   * Generates a relationship alias name based on the relationship type and table/column information.
   * The alias follows Sequelize naming conventions and is used to uniquely identify relationships.
   *
   * @param type - The type of relationship (HasMany, BelongsTo, HasOne, or ManyToMany)
   * @param source - Source table information containing table name and column name
   * @param target - Target table information containing table name and column name
   * @param junction - Junction table information (required only for many-to-many relationships)
   * @returns A string representing the generated alias name
   *
   * @example
   * ```typescript
   * // For a HasMany relationship from posts to users
   * const alias = RelationshipGenerator.createAlias(
   *   RelationshipType.HasMany,
   *   { table: 'posts', column: 'userId' },
   *   { table: 'users', column: 'id' }
   * );
   * // Returns: 'postUser'
   * ```
   */
  public static createAlias(type: RelationshipType, source: Relationship['source'], target: Relationship['target'], junction?: Relationship['junction']): string {
    switch (type) {
      case RelationshipType.HasMany:
        return singular(StringHelper.toPropertyName(source.table)) + pluralize(StringHelper.omitId(source.column, true));
      case RelationshipType.BelongsTo:
        return singular(StringHelper.toPropertyName(target.table)) + StringHelper.omitId(target.column, true);
      case RelationshipType.HasOne:
        return singular(StringHelper.toPropertyName(source.table)) + StringHelper.omitId(source.column, true);
      case RelationshipType.ManyToMany:
        return camelCase(pascalCase(singular(junction?.table as string))) + pluralize(StringHelper.omitId(source.table, true)) + 'es';
      default:
        return '';
    }
  }

  /**
   * Generates TypeScript mixin declarations for a HasMany relationship.
   * These declarations enable type-safe access to Sequelize's HasMany association methods.
   *
   * The generated mixins include:
   * - Property declaration for the relationship array
   * - Method declarations for getting, setting, adding, removing associations
   * - Methods for checking existence and counting associations
   *
   * @param alias - The alias name for the relationship
   * @param sourceModel - The name of the source model class
   * @param targetModel - The name of the target model class
   * @returns A string containing the formatted TypeScript mixin declarations
   *
   * @example
   * ```typescript
   * const mixins = RelationshipGenerator.generateHasManyMixins('users', 'Post', 'User');
   * // Returns:
   * // declare users?: Sequelize.NonAttribute<User>;
   * // declare getUsers: Sequelize.HasManyGetAssociationsMixin<User>;
   * // ... and more mixin declarations
   * ```
   */
  public static generateHasManyMixins(alias: string, sourceModel: string, targetModel: string): string {
    let mixins = '\n';
    mixins += sp(2, `// %s hasMany %s (as %s)\n`, sourceModel, targetModel, alias);
    mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, alias, targetModel);
    mixins += sp(2, `declare get%s: Sequelize.HasManyGetAssociationsMixin<%s>;\n`, pascalCase(alias), targetModel);
    mixins += sp(2, `declare set%s: Sequelize.HasManySetAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare add%s: Sequelize.HasManyAddAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare add%ses: Sequelize.HasManyAddAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare create%s: Sequelize.HasManyCreateAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
    mixins += sp(2, `declare remove%s: Sequelize.HasManyRemoveAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare remove%ses: Sequelize.HasManyRemoveAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare has%s: Sequelize.HasManyHasAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare has%ses: Sequelize.HasManyHasAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare count%s: Sequelize.HasManyCountAssociationsMixin;\n`, pascalCase(alias));
    return mixins;
  }

  /**
   * Generates TypeScript mixin declarations for a BelongsTo relationship.
   * These declarations provide type safety for Sequelize's BelongsTo association methods.
   *
   * The generated mixins include:
   * - Property declaration for the related model instance
   * - Method declarations for getting, setting, and creating the association
   *
   * @param alias - The alias name for the relationship
   * @param sourceModel - The name of the source model class
   * @param targetModel - The name of the target model class
   * @returns A string containing the formatted TypeScript mixin declarations
   *
   * @example
   * ```typescript
   * const mixins = RelationshipGenerator.generateBelongsToMixins('user', 'Post', 'User');
   * // Returns:
   * // declare user?: Sequelize.NonAttribute<User>;
   * // declare getUser: Sequelize.BelongsToGetAssociationMixin<User>;
   * // ... and more mixin declarations
   * ```
   */
  public static generateBelongsToMixins(alias: string, sourceModel: string, targetModel: string): string {
    let mixins = '\n';
    mixins += sp(2, `// %s belongsTo %s (as %s)\n`, sourceModel, targetModel, alias);
    mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, alias, targetModel);
    mixins += sp(2, `declare get%s: Sequelize.BelongsToGetAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
    mixins += sp(2, `declare set%s: Sequelize.BelongsToSetAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare create%s: Sequelize.BelongsToCreateAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
    return mixins;
  }

  /**
   * Generates TypeScript mixin declarations for a HasOne relationship.
   * These declarations enable type-safe access to Sequelize's HasOne association methods.
   *
   * The generated mixins include:
   * - Property declaration for the related model instance
   * - Method declarations for getting, setting, and creating the association
   *
   * @param alias - The alias name for the relationship
   * @param sourceModel - The name of the source model class
   * @param targetModel - The name of the target model class
   * @returns A string containing the formatted TypeScript mixin declarations
   *
   * @example
   * ```typescript
   * const mixins = RelationshipGenerator.generateHasOneMixins('profile', 'User', 'Profile');
   * // Returns:
   * // declare profile?: Sequelize.NonAttribute<Profile>;
   * // declare getProfile: Sequelize.HasOneGetAssociationMixin<Profile>;
   * // ... and more mixin declarations
   * ```
   */
  public static generateHasOneMixins(alias: string, sourceModel: string, targetModel: string): string {
    let mixins = '\n';
    mixins += sp(2, `// %s hasOne %s (as %s)\n`, sourceModel, targetModel, alias);
    mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, alias, targetModel);
    mixins += sp(2, `declare get%s: Sequelize.HasOneGetAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
    mixins += sp(2, `declare set%s: Sequelize.HasOneSetAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare create%s: Sequelize.HasOneCreateAssociationMixin<%s>;`, pascalCase(alias), targetModel);
    return mixins;
  }

  /**
   * Generates TypeScript mixin declarations for a BelongsToMany relationship.
   * These declarations provide type safety for Sequelize's BelongsToMany association methods.
   *
   * The generated mixins include:
   * - Property declaration for the related model array
   * - Method declarations for managing the many-to-many association
   * - Methods for checking existence and counting associations
   *
   * @param alias - The alias name for the relationship
   * @param sourceModel - The name of the source model class
   * @param targetModel - The name of the target model class
   * @returns A string containing the formatted TypeScript mixin declarations
   *
   * @example
   * ```typescript
   * const mixins = RelationshipGenerator.generateBelongsToManyMixins('roles', 'User', 'Role');
   * // Returns:
   * // declare roles?: Sequelize.NonAttribute<Role[]>;
   * // declare getRoles: Sequelize.BelongsToManyGetAssociationsMixin<Role>;
   * // ... and more mixin declarations
   * ```
   */
  public static generateBelongsToManyMixins(alias: string, sourceModel: string, targetModel: string): string {
    let mixins = '\n';
    mixins += sp(2, `// %s belongsToMany %s (as %s)\n`, sourceModel, targetModel, alias);
    mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s[]>;\n`, alias, targetModel);
    mixins += sp(2, `declare get%s: Sequelize.BelongsToManyGetAssociationsMixin<%s>;\n`, pascalCase(alias), targetModel);
    mixins += sp(2, `declare set%s: Sequelize.BelongsToManySetAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare add%s: Sequelize.BelongsToManyAddAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare add%ses: Sequelize.BelongsToManyAddAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare create%s: Sequelize.BelongsToManyCreateAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
    mixins += sp(2, `declare remove%s: Sequelize.BelongsToManyRemoveAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare remove%ses: Sequelize.BelongsToManyRemoveAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare has%s: Sequelize.BelongsToManyHasAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare has%ses: Sequelize.BelongsToManyHasAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
    mixins += sp(2, `declare count%s: Sequelize.BelongsToManyCountAssociationsMixin;\n`, pascalCase(alias));
    return mixins;
  }

  /**
   * Processes a single relationship configuration to generate mixin declarations and association declarations.
   * This method handles the creation of TypeScript declarations for a specific relationship type.
   *
   * @param relation - The relationship configuration object containing type, source, target, and junction information
   * @param alreadyAdded - Array of aliases that have already been processed to prevent duplicates
   * @returns An object containing:
   *   - mixins: String containing the generated mixin declarations
   *   - declaration: String containing the association declaration
   *
   * @example
   * ```typescript
   * const result = RelationshipGenerator.processAssociation(
   *   {
   *     type: RelationshipType.HasMany,
   *     source: { table: 'posts', column: 'userId' },
   *     target: { table: 'users', column: 'id' }
   *   },
   *   []
   * );
   * // Returns { mixins: '...', declaration: '...' }
   * ```
   */
  public static processAssociation(relation: Relationship, alreadyAdded: string[]): { mixins: string; declaration: string } {
    const { type, source, target, junction } = relation;
    const sourceModel = StringHelper.tableToModel(source.table);
    const targetModel = StringHelper.tableToModel(target.table);
    const alias = RelationshipGenerator.createAlias(type, source, target, junction);

    if (alreadyAdded.includes(alias)) return { mixins: '', declaration: '' };
    alreadyAdded.push(alias);

    const declaration = sp(4, '%s: Sequelize.Association<%s, %s>;\n', alias, sourceModel, targetModel);
    let mixins = '';

    switch (type) {
      case RelationshipType.HasMany:
        mixins = RelationshipGenerator.generateHasManyMixins(alias, sourceModel, targetModel);
        break;
      case RelationshipType.BelongsTo:
        mixins = RelationshipGenerator.generateBelongsToMixins(alias, sourceModel, targetModel);
        break;
      case RelationshipType.HasOne:
        mixins = RelationshipGenerator.generateHasOneMixins(alias, sourceModel, targetModel);
        break;
      case RelationshipType.ManyToMany:
        mixins = RelationshipGenerator.generateBelongsToManyMixins(alias, sourceModel, targetModel);
        break;
    }

    return { mixins, declaration };
  }

  /**
   * Generates complete association declarations and mixins for all model relationships.
   * This method processes an array of relationships and generates the necessary TypeScript
   * declarations for the model's associations, including both instance and static declarations.
   *
   * @param relations - Array of relationship configurations to process
   * @param modTplVars - Template variables object that will be modified with generated code
   * @param tableName - Name of the database table being processed
   *
   * @example
   * ```typescript
   * const templateVars = { associations: '' };
   * RelationshipGenerator.generateAssociations(
   *   [
   *     {
   *       type: RelationshipType.HasMany,
   *       source: { table: 'posts', column: 'userId' },
   *       target: { table: 'users', column: 'id' }
   *     }
   *   ],
   *   templateVars,
   *   'posts'
   * );
   * // templateVars.associations now contains the generated declarations
   * ```
   */
  public static generateAssociations(relations: Relationship[], modTplVars: ModelTemplateVars, tableName: string): void {
    if (!relations.length) return;

    let mixins: string = '';
    let declaration: string = '';
    const alreadyAdded: string[] = [];

    for (const relation of relations) {
      const result = RelationshipGenerator.processAssociation(relation, alreadyAdded);
      mixins += result.mixins;
      declaration += result.declaration;
    }

    modTplVars.associations += `\n${mixins}\n`;
    modTplVars.associations += sp(2, `/** Static associations defined for the %s model */\n`, StringHelper.tableToModel(tableName));
    modTplVars.associations += sp(2, `declare public static associations: {\n`);
    modTplVars.associations += declaration;
    modTplVars.associations += sp(2, `}`);
  }

  /**
   * Generates the Sequelize model initialization code for a BelongsTo relationship.
   * This creates the appropriate model.associate() call for the BelongsTo relationship.
   *
   * @param relationship - The relationship configuration object
   * @param initTplVars - Template variables object that will be modified with the generated initialization code
   *
   * @example
   * ```typescript
   * const templateVars = { associations: '' };
   * RelationshipGenerator.generateBelongsToRelation(
   *   {
   *     type: RelationshipType.BelongsTo,
   *     source: { table: 'posts', column: 'userId' },
   *     target: { table: 'users', column: 'id' }
   *   },
   *   templateVars
   * );
   * // templateVars.associations contains: User.belongsTo(Post, { as: 'user', foreignKey: 'userId' });
   * ```
   */
  public static generateBelongsToRelation(relationship: Relationship, initTplVars: InitTemplateVars): void {
    const { source, target } = relationship;
    const alias = RelationshipGenerator.createAlias(RelationshipType.BelongsTo, source, target);

    initTplVars.associations += sp(
      2,
      `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
      StringHelper.tableToModel(target.table),
      'belongsTo',
      StringHelper.tableToModel(source.table),
      alias,
      StringHelper.toPropertyName(target.column),
    );
  }

  /**
   * Generates the Sequelize model initialization code for a HasOne relationship.
   * This creates the appropriate model.associate() call for the HasOne relationship.
   *
   * @param relationship - The relationship configuration object
   * @param initTplVars - Template variables object that will be modified with the generated initialization code
   *
   * @example
   * ```typescript
   * const templateVars = { associations: '' };
   * RelationshipGenerator.generateHasOneRelation(
   *   {
   *     type: RelationshipType.HasOne,
   *     source: { table: 'users', column: 'profileId' },
   *     target: { table: 'profiles', column: 'id' }
   *   },
   *   templateVars
   * );
   * // templateVars.associations contains: Profile.hasOne(User, { as: 'profile', foreignKey: 'profileId' });
   * ```
   */
  public static generateHasOneRelation(relationship: Relationship, initTplVars: InitTemplateVars): void {
    const { source, target } = relationship;
    const alias = RelationshipGenerator.createAlias(RelationshipType.HasOne, source, target);

    initTplVars.associations += sp(
      2,
      `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
      StringHelper.tableToModel(target.table),
      'hasOne',
      StringHelper.tableToModel(source.table),
      alias,
      StringHelper.toPropertyName(source.column),
    );
  }

  /**
   * Generates the Sequelize model initialization code for a HasMany relationship.
   * This creates the appropriate model.associate() call for the HasMany relationship.
   *
   * @param relationship - The relationship configuration object
   * @param initTplVars - Template variables object that will be modified with the generated initialization code
   *
   * @example
   * ```typescript
   * const templateVars = { associations: '' };
   * RelationshipGenerator.generateHasManyRelation(
   *   {
   *     type: RelationshipType.HasMany,
   *     source: { table: 'users', column: 'id' },
   *     target: { table: 'posts', column: 'userId' }
   *   },
   *   templateVars
   * );
   * // templateVars.associations contains: Post.hasMany(User, { as: 'posts', foreignKey: 'id' });
   * ```
   */
  public static generateHasManyRelation(relationship: Relationship, initTplVars: InitTemplateVars): void {
    const { source, target } = relationship;
    const alias = RelationshipGenerator.createAlias(RelationshipType.HasMany, source, target);

    initTplVars.associations += sp(
      2,
      `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
      StringHelper.tableToModel(target.table),
      'hasMany',
      StringHelper.tableToModel(source.table),
      alias,
      StringHelper.toPropertyName(source.column),
    );
  }

  /**
   * Generates the Sequelize model initialization code for a BelongsToMany relationship.
   * This creates the appropriate model.associate() call with the junction table configuration.
   *
   * @param relationship - The relationship configuration object containing junction table information
   * @param initTplVars - Template variables object that will be modified with the generated initialization code
   *
   * @example
   * ```typescript
   * const templateVars = { associations: '' };
   * RelationshipGenerator.generateBelongsToManyRelation(
   *   {
   *     type: RelationshipType.ManyToMany,
   *     source: { table: 'users', column: 'id' },
   *     target: { table: 'roles', column: 'id' },
   *     junction: { table: 'user_roles' }
   *   },
   *   templateVars
   * );
   * // templateVars.associations contains: User.belongsToMany(Role, { as: 'userRoles', through: UserRole, foreignKey: 'userId', otherKey: 'roleId' });
   * ```
   */
  public static generateBelongsToManyRelation(relationship: Relationship, initTplVars: InitTemplateVars): void {
    const { source, target, junction } = relationship;
    const alias = RelationshipGenerator.createAlias(RelationshipType.ManyToMany, source, target, junction);

    initTplVars.associations += sp(
      2,
      `%s.%s(%s, { as: '%s', through: %s, foreignKey: '%s', otherKey: '%s' });\n`,
      StringHelper.tableToModel(source.table),
      'belongsToMany',
      StringHelper.tableToModel(target.table),
      alias,
      StringHelper.tableToModel(junction.table as string),
      singular(source.table) + pascalCase(source.column),
      singular(target.table) + pascalCase(source.column),
    );
  }

  /**
   * Generates the complete model relationships/associations configuration code.
   * This method processes all relationships and generates the appropriate Sequelize model
   * initialization code, including imports, exports, and association definitions.
   *
   * Supports filtering relationships by schema and table names to selectively generate
   * associations based on the provided filters.
   *
   * @param relationships - Array of relationship configurations to process
   * @param initTplVars - Template variables object that will be modified with all generated code
   * @param filters - Optional filters to control which relationships to generate
   * @param filters.schemas - Array of schema names to exclude from generation
   * @param filters.tables - Array of table names to exclude from generation
   *
   * @example
   * ```typescript
   * const templateVars = {
   *   associations: '',
   *   importClasses: '',
   *   importTypes: '',
   *   exportClasses: ''
   * };
   * RelationshipGenerator.generateRelations(
   *   [
   *     {
   *       type: RelationshipType.HasMany,
   *       source: { table: 'users', column: 'id' },
   *       target: { table: 'posts', column: 'userId' }
   *     }
   *   ],
   *   templateVars
   * );
   * // templateVars now contains all the generated relationship code
   * ```
   */
  public static generateRelations(relationships: Relationship[], initTplVars: InitTemplateVars, filters: GenerateRelationFilters = {}): void {
    // Initialize filters for schemas and tables
    const schemasFilter = filters?.schemas ?? [];
    const tablesFilter = filters?.tables ?? [];

    const hasSchemasFilter = schemasFilter.length > 0;
    const hasTablesFilter = tablesFilter.length > 0;

    // Process each relationship, applying filters and generating appropriate code
    for (const relationship of relationships) {
      // Skip relationships that doesn't match the schema filter
      if (hasSchemasFilter && (!schemasFilter.includes(relationship.source.schema) || !schemasFilter.includes(relationship.target.schema))) continue;

      // Skip relationships that doesn't match the table filter
      if (hasTablesFilter && (!tablesFilter.includes(relationship.source.table) || !tablesFilter.includes(relationship.target.table))) continue;

      // Generate code based on relationship type
      switch (relationship.type) {
        case RelationshipType.BelongsTo:
          RelationshipGenerator.generateBelongsToRelation(relationship, initTplVars);
          break;
        case RelationshipType.HasOne:
          RelationshipGenerator.generateHasOneRelation(relationship, initTplVars);
          break;
        case RelationshipType.HasMany:
          RelationshipGenerator.generateHasManyRelation(relationship, initTplVars);
          break;
        case RelationshipType.ManyToMany:
          RelationshipGenerator.generateBelongsToManyRelation(relationship, initTplVars);
          break;
      }
    }

    // Clean up trailing whitespace in generated template variables
    initTplVars.importClasses = initTplVars.importClasses.trimEnd();
    initTplVars.importTypes = initTplVars.importTypes.trimEnd();
    initTplVars.exportClasses = initTplVars.exportClasses.trimEnd();
  }
}
