/**
 * @fileoverview Provides utilities for generating relationship aliases and Sequelize mixin declarations.
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @version 1.0.0
 */

import pluralize, {singular} from 'pluralize';

// helpers
import StringHelper from '~/helpers/StringHelper';

// formatters
import ModelFormatter from '~/formatters/ModelFormatter';

// utils
import {sp} from './ModelGenerator';
import {RelationshipType} from '~/classes/DbUtils';

// types
import type {Relationship} from '~/typings/utils';
import type {InitTemplateVars, ModelTemplateVars} from './ModelGenerator';
import type {GeneratorOptions} from '~/typings/generator';

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
 * // Use with this.generateRelations()
 * this.generateRelations(relationships, templateVars, filters);
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
 * const mixins = this.generateHasManyMixins('users', 'Post', 'User');
 *
 * // Create an alias for a BelongsTo relationship
 * const alias = this.createAlias(RelationshipType.BelongsTo, source, target);
 * ```
 */
export default class RelationshipGenerator {
  /** The formatter instance used for naming conventions in generated relationships */
  protected formatter: ModelFormatter;

  /**
   * Creates a new RelationshipGenerator instance.
   *
   * @param options - Generator options controlling the output format and behavior
   */
  constructor(public options: GeneratorOptions) {
    this.formatter = ModelFormatter.create(this.options);
  }

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
   * const alias = this.createAlias(
   *   RelationshipType.HasMany,
   *   { table: 'posts', column: 'userId' },
   *   { table: 'users', column: 'id' }
   * );
   * // Returns: 'postUser'
   * ```
   */
  public createAlias(type: RelationshipType, source: Relationship['source'], target: Relationship['target'], junction?: Relationship['junction']): string {
    if (type === RelationshipType.HasMany) {
      return this.formatter.getPropertyName(
        this.formatter.getModelName(source.table) + '_' + this.formatter.getPropertyName(pluralize(StringHelper.omitId(source.column))),
      );
      //return singular(StringHelper.toPropertyName(source.table)) + pluralize(StringHelper.omitId(source.column, true));
    } else if (type === RelationshipType.BelongsTo) {
      return this.formatter.getPropertyName(
        this.formatter.getModelName(target.table) + '_' + StringHelper.omitId(target.column),
      );
      //return singular(StringHelper.toPropertyName(target.table)) + StringHelper.omitId(target.column, true);
    } else if (type === RelationshipType.HasOne) {
      return this.formatter.getPropertyName(
        this.formatter.getModelName(source.table) + '_' + StringHelper.omitId(source.column),
      );
      //return singular(StringHelper.toPropertyName(source.table)) + StringHelper.omitId(source.column, true);
    } else if (type === RelationshipType.ManyToMany) {
      return this.formatter.getPropertyName(
        singular(junction?.table as string) + '_' + pluralize(StringHelper.omitId(source.table)) + 'es',
      );
      //return camelCase(pascalCase(singular(junction?.table as string))) + pluralize(StringHelper.omitId(source.table, true)) + 'es';
    } else {
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
   * const mixins = this.generateHasManyMixins('users', 'Post', 'User');
   * // Returns:
   * // declare users?: Sequelize.NonAttribute<User>;
   * // declare getUsers: Sequelize.HasManyGetAssociationsMixin<User>;
   * // ... and more mixin declarations
   * ```
   */
  public generateHasManyMixins(alias: string, sourceModel: string, targetModel: string): string {
    let mixins = '\n';
    mixins += sp(2, `// %s hasMany %s (as %s)\n`, sourceModel, targetModel, this.formatter.getPropertyName(alias));
    mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, this.formatter.getPropertyName(alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.HasManyGetAssociationsMixin<%s>;\n`, this.formatter.getPropertyName('get_' + alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.HasManySetAssociationsMixin<%s, %s>;\n`, this.formatter.getPropertyName('set_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.HasManyAddAssociationMixin<%s, %s>;\n`, this.formatter.getPropertyName('add_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %ses: Sequelize.HasManyAddAssociationsMixin<%s, %s>;\n`, this.formatter.getPropertyName('add_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.HasManyCreateAssociationMixin<%s>;\n`, this.formatter.getPropertyName('create_' + alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.HasManyRemoveAssociationMixin<%s, %s>;\n`, this.formatter.getPropertyName('remove_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %ses: Sequelize.HasManyRemoveAssociationsMixin<%s, %s>;\n`, this.formatter.getPropertyName('remove_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.HasManyHasAssociationMixin<%s, %s>;\n`, this.formatter.getPropertyName('has_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %ses: Sequelize.HasManyHasAssociationsMixin<%s, %s>;\n`, this.formatter.getPropertyName('has_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.HasManyCountAssociationsMixin;\n`, this.formatter.getPropertyName('count_' + alias));
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
   * const mixins = this.generateBelongsToMixins('user', 'Post', 'User');
   * // Returns:
   * // declare user?: Sequelize.NonAttribute<User>;
   * // declare getUser: Sequelize.BelongsToGetAssociationMixin<User>;
   * // ... and more mixin declarations
   * ```
   */
  public generateBelongsToMixins(alias: string, sourceModel: string, targetModel: string): string {
    let mixins = '\n';
    mixins += sp(2, `// %s belongsTo %s (as %s)\n`, sourceModel, targetModel, this.formatter.getPropertyName(alias));
    mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, this.formatter.getPropertyName(alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.BelongsToGetAssociationMixin<%s>;\n`, this.formatter.getPropertyName('get_' + alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.BelongsToSetAssociationMixin<%s, %s>;\n`, this.formatter.getPropertyName('set_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.BelongsToCreateAssociationMixin<%s>;\n`, this.formatter.getPropertyName('create_' + alias), targetModel);
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
   * const mixins = this.generateHasOneMixins('profile', 'User', 'Profile');
   * // Returns:
   * // declare profile?: Sequelize.NonAttribute<Profile>;
   * // declare getProfile: Sequelize.HasOneGetAssociationMixin<Profile>;
   * // ... and more mixin declarations
   * ```
   */
  public generateHasOneMixins(alias: string, sourceModel: string, targetModel: string): string {
    let mixins = '\n';
    mixins += sp(2, `// %s hasOne %s (as %s)\n`, sourceModel, targetModel, this.formatter.getPropertyName(alias));
    mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, this.formatter.getPropertyName(alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.HasOneGetAssociationMixin<%s>;\n`, this.formatter.getPropertyName('get_' + alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.HasOneSetAssociationMixin<%s, %s>;\n`, this.formatter.getPropertyName('set_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.HasOneCreateAssociationMixin<%s>;`, this.formatter.getPropertyName('create_' + alias), targetModel);
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
   * const mixins = this.generateBelongsToManyMixins('roles', 'User', 'Role');
   * // Returns:
   * // declare roles?: Sequelize.NonAttribute<Role[]>;
   * // declare getRoles: Sequelize.BelongsToManyGetAssociationsMixin<Role>;
   * // ... and more mixin declarations
   * ```
   */
  public generateBelongsToManyMixins(alias: string, sourceModel: string, targetModel: string): string {
    let mixins = '\n';
    mixins += sp(2, `// %s belongsToMany %s (as %s)\n`, sourceModel, targetModel, this.formatter.getPropertyName(alias));
    mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s[]>;\n`, this.formatter.getPropertyName(alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.BelongsToManyGetAssociationsMixin<%s>;\n`, this.formatter.getPropertyName('get_' + alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.BelongsToManySetAssociationsMixin<%s, %s>;\n`, this.formatter.getPropertyName('set_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.BelongsToManyAddAssociationMixin<%s, %s>;\n`, this.formatter.getPropertyName('add_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %ses: Sequelize.BelongsToManyAddAssociationsMixin<%s, %s>;\n`, this.formatter.getPropertyName('add_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.BelongsToManyCreateAssociationMixin<%s>;\n`, this.formatter.getPropertyName('create_' + alias), targetModel);
    mixins += sp(2, `declare %s: Sequelize.BelongsToManyRemoveAssociationMixin<%s, %s>;\n`, this.formatter.getPropertyName('remove_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %ses: Sequelize.BelongsToManyRemoveAssociationsMixin<%s, %s>;\n`, this.formatter.getPropertyName('remove_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.BelongsToManyHasAssociationMixin<%s, %s>;\n`, this.formatter.getPropertyName('has_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %ses: Sequelize.BelongsToManyHasAssociationsMixin<%s, %s>;\n`, this.formatter.getPropertyName('has_' + alias), targetModel, 'number');
    mixins += sp(2, `declare %s: Sequelize.BelongsToManyCountAssociationsMixin;\n`, this.formatter.getPropertyName('count_' + alias));
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
   * const result = this.processAssociation(
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
  public processAssociation(relation: Relationship, alreadyAdded: string[]): { mixins: string; declaration: string } {
    const {type, source, target, junction} = relation;
    const sourceModel = this.formatter.getModelName(source.table);
    const targetModel = this.formatter.getModelName(target.table);
    const alias = this.createAlias(type, source, target, junction);

    if (alreadyAdded.includes(alias)) return {mixins: '', declaration: ''};
    alreadyAdded.push(alias);

    const declaration = sp(4, '%s: Sequelize.Association<%s, %s>;\n', this.formatter.getPropertyName(alias), sourceModel, targetModel);
    let mixins = '';

    switch (type) {
      case RelationshipType.HasMany:
        mixins = this.generateHasManyMixins(alias, sourceModel, targetModel);
        break;
      case RelationshipType.BelongsTo:
        mixins = this.generateBelongsToMixins(alias, sourceModel, targetModel);
        break;
      case RelationshipType.HasOne:
        mixins = this.generateHasOneMixins(alias, sourceModel, targetModel);
        break;
      case RelationshipType.ManyToMany:
        mixins = this.generateBelongsToManyMixins(alias, sourceModel, targetModel);
        break;
    }

    return {mixins, declaration};
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
   * this.generateAssociations(
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
  public generateAssociations(relations: Relationship[], modTplVars: ModelTemplateVars, tableName: string): void {
    if (!relations.length) return;

    let mixins: string = '';
    let declaration: string = '';
    const alreadyAdded: string[] = [];

    for (const relation of relations) {
      const result = this.processAssociation(relation, alreadyAdded);
      mixins += result.mixins;
      declaration += result.declaration;
    }

    modTplVars.associations += `\n${mixins}\n`;
    modTplVars.associations += sp(2, `/** Static associations defined for the %s model */\n`, this.formatter.getModelName(tableName));
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
   * this.generateBelongsToRelation(
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
  public generateBelongsToRelation(relationship: Relationship, initTplVars: InitTemplateVars): void {
    const {source, target} = relationship;
    const alias = this.createAlias(RelationshipType.BelongsTo, source, target);

    initTplVars.associations += sp(
      2,
      `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
      this.formatter.getModelName(target.table),
      'belongsTo',
      this.formatter.getModelName(source.table),
      alias,
      this.formatter.getPropertyName(target.column),
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
   * this.generateHasOneRelation(
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
  public generateHasOneRelation(relationship: Relationship, initTplVars: InitTemplateVars): void {
    const {source, target} = relationship;
    const alias = this.createAlias(RelationshipType.HasOne, source, target);

    initTplVars.associations += sp(
      2,
      `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
      this.formatter.getModelName(target.table),
      'hasOne',
      this.formatter.getModelName(source.table),
      alias,
      this.formatter.getPropertyName(source.column),
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
   * this.generateHasManyRelation(
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
  public generateHasManyRelation(relationship: Relationship, initTplVars: InitTemplateVars): void {
    const {source, target} = relationship;
    const alias = this.createAlias(RelationshipType.HasMany, source, target);

    initTplVars.associations += sp(
      2,
      `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
      this.formatter.getModelName(target.table),
      'hasMany',
      this.formatter.getModelName(source.table),
      alias,
      this.formatter.getPropertyName(source.column),
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
   * this.generateBelongsToManyRelation(
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
  public generateBelongsToManyRelation(relationship: Relationship, initTplVars: InitTemplateVars): void {
    const {source, target, junction} = relationship;
    const alias = this.createAlias(RelationshipType.ManyToMany, source, target, junction);

    initTplVars.associations += sp(
      2,
      `%s.%s(%s, { as: '%s', through: %s, foreignKey: '%s', otherKey: '%s' });\n`,
      this.formatter.getModelName(source.table),
      'belongsToMany',
      this.formatter.getModelName(target.table),
      alias,
      this.formatter.getModelName(junction.table as string),
      this.formatter.getPropertyName(this.formatter.getModelName(source.table) + '_' + source.column),
      this.formatter.getPropertyName(this.formatter.getModelName(target.table) + '_' + source.column),
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
   * this.generateRelations(
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
  public generateRelations(relationships: Relationship[], initTplVars: InitTemplateVars, filters: GenerateRelationFilters = {}): void {
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
          this.generateBelongsToRelation(relationship, initTplVars);
          break;
        case RelationshipType.HasOne:
          this.generateHasOneRelation(relationship, initTplVars);
          break;
        case RelationshipType.HasMany:
          this.generateHasManyRelation(relationship, initTplVars);
          break;
        case RelationshipType.ManyToMany:
          this.generateBelongsToManyRelation(relationship, initTplVars);
          break;
      }
    }

    // Clean up trailing whitespace in generated template variables
    initTplVars.importClasses = initTplVars.importClasses.trimEnd();
    initTplVars.importTypes = initTplVars.importTypes.trimEnd();
    initTplVars.exportClasses = initTplVars.exportClasses.trimEnd();
  }
}
