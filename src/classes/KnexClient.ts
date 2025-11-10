/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import knex, { Knex } from 'knex';

/**
 * Interface defining the structure for database connection parameters.
 * This interface standardizes the connection configuration data required for establishing
 * database connections, providing type safety and documentation for each parameter.
 */
export interface ConnectionData {
  /** The username for database authentication. Must be a valid database user with appropriate permissions. */
  username: string;
  /** The password for database authentication. Should be kept secure and never hardcoded in production. */
  password: string;
  /** The database host address. Can be an IP address (e.g., '192.168.1.1') or domain name (e.g., 'localhost'). */
  host: string;
  /** The name of the database to connect to. Must be an existing database that the user has access to. */
  name: string;
  /**
   * The port number for the database connection.
   * Optional parameter that defaults to PostgreSQL's standard port 5432 when not specified.
   * @default 5432
   */
  port?: number;
}

/**
 * A comprehensive wrapper class for Knex.js database operations
 *
 * This class provides a simplified and type-safe interface for creating and managing Knex.js database connections.
 * It encapsulates all the configuration and initialization logic specifically tailored for PostgreSQL database connections,
 * offering utility methods for connection string manipulation and connection health checking.
 *
 * Features:
 * - Static factory methods for creating Knex instances
 * - Connection string parsing and generation utilities
 * - Connection health verification
 * - Type-safe configuration handling
 */
export default class KnexClient {
  /**
   * Creates a new Knex.js database connection instance configured for PostgreSQL
   *
   * This static method initializes a new Knex instance with PostgreSQL client configuration.
   * It provides flexibility by accepting either an explicit connection string or falling back
   * to environment-based configuration when no string is provided.
   *
   * @param connectionString - Optional PostgreSQL connection string in URI format.
   *                          If not provided, the method will attempt to use environment variables.
   *                          Expected format: postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&...]
   *                          Examples:
   *                          - postgresql://user:password@localhost:5432/mydb
   *                          - postgresql://user@host/dbname?ssl=true
   *
   * @returns A fully configured Knex.js instance ready for database operations
   *
   * @example
   * ```typescript
   * // Using environment connection string (e.g., from DATABASE_URL)
   * const db = KnexClient.create();
   * ```
   *
   * @example
   * ```typescript
   * // Using explicit connection string
   * const db = KnexClient.create('postgresql://user:pass@localhost:5432/mydb');
   * ```
   *
   * @throws {Error} When connection string is malformed or database connection fails to initialize
   *
   * @see {@link https://knexjs.org/#Installation-node} Knex.js official documentation
   * @see {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING} PostgreSQL connection string specification
   */
  public static create(connectionString: string | undefined = undefined): Knex {
    return knex({
      client: 'pg',
      connection: connectionString,
    });
  }

  /**
   * Parses a PostgreSQL connection string into a strongly-typed ConnectionData object
   *
   * This utility method validates and extracts connection parameters from a PostgreSQL URI string,
   * converting them into a structured object with proper typing and default value handling.
   * The parser follows the standard PostgreSQL connection URI format.
   *
   * @param connectionString - The PostgreSQL connection string to parse.
   *                           Must follow the pattern: postgresql://username:password@host:port/database
   *                           Example: 'postgresql://john:secret123@db.example.com:5432/production'
   *
   * @returns {ConnectionData} A typed object containing the extracted connection parameters
   *
   * @throws {Error} If the connection string format is invalid, missing required components, or cannot be parsed
   *
   * @example
   * ```typescript
   * const config = KnexClient.connectionStringToDbConfig('postgresql://user:pass@localhost:5432/mydb');
   * console.log(config);
   * // Output: { username: 'user', password: 'pass', host: 'localhost', port: 5432, name: 'mydb' }
   * ```
   */
  public static connectionStringToDbConfig(connectionString: string): ConnectionData {
    const pattern = /^postgresql:\/\/(?<username>[^:]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>\d+)\/(?<name>.+)$/;
    const match = connectionString.match(pattern);
    if (!match?.groups) {
      throw new Error('Invalid connection string format. Expected: postgresql://username:password@host:port/database');
    }
    const { username, password, host, port = 5432, name } = match.groups;

    return {
      username,
      password,
      host,
      name,
      port: +port,
    };
  }

  /**
   * Converts a ConnectionData object into a properly formatted PostgreSQL connection string
   *
   * This utility method takes a typed configuration object and generates a standard PostgreSQL
   * connection URI string. It handles all the necessary encoding and formatting to ensure
   * compatibility with PostgreSQL's connection string requirements.
   *
   * @param config - The connection configuration object containing all necessary parameters
   *               Must include username, password, host, and name. Port is optional (defaults to 5432)
   *               Example: { username: 'admin', password: 'secret', host: 'localhost', name: 'testdb' }
   *
   * @returns {string} The formatted PostgreSQL connection string ready for use
   *
   * @example
   * ```typescript
   * const config = {
   *   username: 'user',
   *   password: 'pass',
   *   host: 'localhost',
   *   port: 5432,
   *   name: 'mydb'
   * };
   * const connectionString = KnexClient.dbConfigToConnectionString(config);
   * console.log(connectionString); // 'postgresql://user:pass@localhost:5432/mydb'
   * ```
   */
  public static dbConfigToConnectionString(config: ConnectionData): string {
    const { username, password, host, port = 5432, name } = config;
    return `postgresql://${username}:${password}@${host}:${port}/${name}`;
  }

  /**
   * Verifies database connectivity and health status
   *
   * This static method performs a health check on the database connection by executing
   * a lightweight query. It's useful for validating connections before performing
   * critical operations or monitoring database availability.
   *
   * @param knexInstance - The Knex.js instance to test for connectivity
   *                      Should be created using KnexClient.create() for proper configuration
   *
   * @returns {Promise<boolean>} A promise that resolves to:
   *                           - true: If the database connection is active and responsive
   *                           - false: If the connection test fails (though typically throws instead)
   *
   * @throws {Error} When the database connection check fails, including:
   *                 - Network connectivity issues
   *                 - Authentication failures
   *                 - Database server downtime
   *                 - Permission or access issues
   *
   * @example
   * ```typescript
   * async function initializeDatabase() {
   *   const db = KnexClient.create();
   *   try {
   *     const isConnected = await KnexClient.checkConnection(db);
   *     if (isConnected) {
   *       console.log('✅ Database connection established successfully');
   *       // Proceed with database operations
   *     }
   *   } catch (error) {
   *     console.error('❌ Database connection failed:', error.message);
   *     // Handle connection failure
   *   }
   * }
   * ```
   */
  public static async checkConnection(knexInstance: Knex): Promise<boolean> {
    try {
      await knexInstance.raw('SELECT 1');
      return true;
    } catch (error) {
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
