/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Utility class for file operations.
 *
 * This class provides methods for reading and writing files.
 */
export default abstract class FileHelper {
  /**
   * Joins multiple path segments into a single normalized path.
   * @param join - Path segments to join.
   * @returns A normalized path string.
   * @example
   * ```typescript
   * const joinedPath = FileHelper.join('src', 'components', 'Button.tsx');
   * console.log(joinedPath); // Output: 'src/components/Button.tsx'
   * ```
   */
  public static join(...join: string[]): string {
    return path.normalize(path.join(...join));
  }

  /**
   * Saves a string to a file at the given path.
   *
   * If a file already exists at the specified path, it will be removed before writing.
   * The operation is performed synchronously and will block execution until complete.
   *
   * @param filePath The absolute or relative path where the file will be saved.
   * @param text The string content to write to the file.
   * @throws {Error} If there are permission issues or the path is invalid.
   * @example
   * ```typescript
   * FileHelper.saveTextToFile('./output.txt', 'Hello, World!');
   * ```
   */
  public static saveTextToFile(filePath: string, text: string): void {
    try {
      fs.rmSync(filePath);
    } catch {
      // do nothing
    }

    fs.writeFileSync(filePath, text, 'utf8');
  }

  /**
   * Reads the entire contents of a file at the given path.
   *
   * The file is read synchronously using UTF-8 encoding.
   * The operation will block execution until the file is completely read.
   *
   * @param filePath The absolute or relative path of the file to read.
   * @returns The complete contents of the file as a UTF-8 encoded string.
   * @throws {Error} If the file doesn't exist, cannot be read, or there are permission issues.
   * @example
   * ```typescript
   * const content = FileHelper.readFile('./data.json');
   * console.log(content);
   * ```
   */
  public static readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Reads a SQL file from the sqls directory.
   * @param filename The name of the SQL file to read.
   * @returns The contents of the SQL file as a string.
   * @example
   * ```typescript
   * const sqlContent = FileHelper.readSqlFile('query.sql');
   * console.log(sqlContent);
   * ```
   */
  public static readSqlFile(filename: string): string {
    return fs.readFileSync(this.join(this.dirname(__dirname, 1), 'sqls', filename), 'utf8');
  }

  /**
   * Gets the parent directory path of the given directory, optionally multiple levels up.
   * @param dir The starting directory path.
   * @param depth The number of parent directories to traverse up. Default is 1.
   * @returns The path of the parent directory at the specified depth.
   * @example
   * ```typescript
   * const parentDir = FileHelper.dirname('/home/user/project', 1);
   * console.log(parentDir); // Output: '/home/user'
   * ```
   */
  public static dirname(dir: string, depth: number = 1): string {
    let newDir = dir;

    for (let i = 0; i < depth; i++) {
      newDir = path.dirname(newDir);
    }

    return newDir;
  }
}
