/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import fs from 'node:fs';

import {diffChars} from 'diff';

// helpers
import FileHelper from '~/helpers/FileHelper';

// types
import type {GeneratorOptions} from '~/typings/generator';
import type {FileComparison} from '~/typings/multi-diff';

/**
 * Represents a code file with a filename, content, and optional generation options.
 * Provides functionality to read, compare, and save code files with support for dry-run mode.
 */
export default class CodeFile {
  /**
   * Creates an instance of CodeFile.
   * @param filename - The name of the file.
   * @param content - The content of the file.
   * @param options - Optional generator settings.
   */
  constructor(protected readonly filename: string, protected readonly content: string, protected readonly options: GeneratorOptions = {}) {
  }

  /**
   * Gets a comparison object containing the old and new content paths and content.
   * @returns An object containing file comparison data.
   */
  public getComparison(): Readonly<FileComparison> {
    return {
      newContent: this.getNewContent(),
      oldContent: this.getOldContent(),
      newPath: this.getFilename(),
      oldPath: this.getFilename(),
    };
  }

  /**
   * Retrieves the original content of the file if it exists on disk.
   * If the file doesn't exist, returns the provided default content.
   * @param defaultContent - The content to return if the file doesn't exist (defaults to empty string).
   * @returns The file's original content as a string, or the default content if the file doesn't exist.
   */
  public getOldContent(defaultContent: string = ''): string {
    return fs.existsSync(this.filename)
      ? fs.readFileSync(this.filename, {encoding: 'utf-8'})
      : defaultContent;
  }

  /**
   * Retrieves the new/current content that would be written to the file.
   * @returns The new content as a string.
   */
  public getNewContent(): string {
    return this.content;
  }

  /**
   * Retrieves the filename associated with this CodeFile instance.
   * @returns The filename as a string.
   */
  public getFilename(rootDir: string | null = null): string {
    return rootDir ? this.filename.replace(rootDir, '') : this.filename;
  }

  /**
   * Draws a formatted table around the given text content.
   * The table adjusts its width based on the longest line in the text.
   * @param text - The text content to display within the table.
   */
  public drawTable(text: string): void {
    const lines = text.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    const padding = 2;
    const totalWidth = maxLength + (padding * 2);

    // Top border
    console.log('┌' + '─'.repeat(totalWidth) + '┐');

    // Content lines
    lines.forEach(line => {
      const paddedLine = line.padEnd(maxLength, ' ');
      console.log('│' + ' '.repeat(padding) + paddedLine + ' '.repeat(padding) + '│');
    });

    // Bottom border
    console.log('└' + '─'.repeat(totalWidth) + '┘');
  }

  /**
   * Displays a character-by-character diff between the existing file and current content.
   * Uses color coding to highlight additions (green) and deletions (red).
   * Outputs the diff to the console with a formatted header showing the filename.
   */
  public diff(): void {
    const changes = diffChars(this.getOldContent(), this.content);

    this.drawTable('File: ' + this.filename);

    let output = '';
    changes.forEach(part => {
      // Use ANSI escape codes for colors
      let colorCode = '';
      if (part.added) {
        colorCode = '\x1b[32m'; // Green for additions
      } else if (part.removed) {
        colorCode = '\x1b[31m'; // Red for deletions
      } else {
        colorCode = '\x1b[39m'; // Default color for common parts
      }

      output += colorCode + part.value;
    });

    // Add reset code and log the complete output
    console.log(output + '\x1b[0m');
  }

  /**
   * Saves the file to disk or displays a diff if dry-run mode is enabled.
   * In dry-run mode, it calls the diff() method instead of saving.
   * @returns void
   */
  public save(): void {
    if (typeof this.options.beforeFileSave === 'function') {
      const result = this.options.beforeFileSave(this);
      if (!result) return;
    }

    if (this.options?.dryRunDiff) return;

    if (this.options?.dryRun) {
      this.diff();
      return;
    }

    FileHelper.saveTextToFile(this.filename, this.content);
  }
}
