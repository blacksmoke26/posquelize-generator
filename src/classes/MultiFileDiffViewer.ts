/**
 * @fileoverview Comprehensive multi-file diff viewer that generates standalone HTML reports
 * with a compact, modern UI featuring dark/light mode support using improved colors.
 * Designed to work in NodeJS environment without browser dependencies.
 *
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @version 1.0.0
 */

import {join} from 'node:path';

import {html} from 'diff2html';
import {createPatch, diffLines} from 'diff';

// helpers
import NunjucksHelper from '~/helpers/NunjucksHelper';

// types
import type {AdvancedConfig, DiffOptions, DiffStatistics, FileComparison, ThemeOptions} from '~/typings/multi-diff';
import FileHelper from '~/helpers/FileHelper';

/**
 * A comprehensive multi-file diff viewer that generates standalone HTML reports
 * with customizable themes and modern UI features.
 *
 * Features:
 * - Side-by-side and unified diff views
 * - Dark/light theme support with GitHub-inspired color schemes
 * - Compact mode for space-efficient display
 * - Comprehensive diff statistics
 * - Customizable styling and branding
 * - Built on diff2html for reliable diff rendering
 *
 * @example
 * ```typescript
 * const viewer = new MultiFileDiffViewer({
 *   compactMode: true,
 *   theme: 'dark'
 * });
 *
 * const html = viewer.generateStandaloneHTML(template, [
 *   {
 *     oldPath: 'file1.txt',
 *     newPath: 'file1.txt',
 *     oldContent: 'Hello World',
 *     newContent: 'Hello Universe'
 *   }
 * ]);
 * ```
 */
export default class MultiFileDiffViewer {
  /** Theme configuration options for styling the diff viewer */
  private themeOptions: ThemeOptions;

  /** Advanced configuration options for customizing the viewer behavior */
  private advancedConfig: AdvancedConfig;

  /**
   * Creates a new MultiFileDiffViewer instance with customizable theme and advanced configurations.
   *
   * @param themeOptions - Optional theme configuration to override default styling
   * @param advancedConfig - Optional advanced configuration to customize behavior
   *
   * @example
   * ```typescript
   * // With default configuration
   * const viewer = new MultiFileDiffViewer();
   *
   * // With custom theme and configuration
   * const viewer = new MultiFileDiffViewer(
   *   { primaryColor: '#007acc', compactMode: true },
   *   { headerTitle: 'My Custom Report', showFileStats: false }
   * );
   * ```
   */
  constructor(themeOptions: Partial<ThemeOptions> = {}, advancedConfig: Partial<AdvancedConfig> = {}) {
    // Default theme options with GitHub-inspired color scheme
    this.themeOptions = {
      primaryColor: '#586069', // GitHub-like primary text color
      accentColor: '#0969da', // GitHub blue accent
      successColor: '#2da44e', // GitHub green for additions
      dangerColor: '#d1242f', // GitHub red for deletions
      warningColor: '#d29922', // GitHub yellow for modifications
      lightBg: '#f6f8fa', // GitHub light background
      darkBg: '#0d1117', // GitHub dark background
      borderRadius: '8px', // Modern rounded corners
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)', // Subtle shadow effect
      fontFamily: '\'Segoe UI\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Open Sans\', \'Helvetica Neue\', sans-serif',
      fontSizeScale: 1.0, // Default font scale
      ...themeOptions,
    };

    // Default advanced configuration with sensible defaults
    this.advancedConfig = {
      headerTitle: '📝 Multi-File Diff Report', // Default report title
      footerText: 'Generated with 💻 diff2html', // Default footer text
      showFileIcons: true, // Display file type icons
      showSummary: true, // Show summary statistics
      showFileStats: true, // Show per-file statistics
      customCSS: '', // Additional custom CSS
      customJS: '', // Additional custom JavaScript
      ...advancedConfig,
    };
  }

  /**
   * Generates a complete standalone HTML report for multiple file comparisons.
   *
   * This method processes all file comparisons, generates diff content, calculates statistics,
   * and renders everything into a single HTML file using the provided template.
   *
   * @param template - Nunjucks template string for rendering the HTML report
   * @param fileComparisons - Array of file comparison objects containing old and new content
   * @param options - Configuration options for diff generation and display
   * @returns Complete HTML string as a standalone report ready for saving or serving
   *
   * @example
   * ```typescript
   * const html = viewer.generateStandaloneHTML(
   *   fs.readFileSync('template.njk', 'utf8'),
   *   [
   *     {
   *       oldPath: 'src/app.ts',
   *       newPath: 'src/app.ts',
   *       oldContent: 'console.log("Hello");',
   *       newContent: 'console.log("Hello World");'
   *     }
   *   ],
   *   {
   *     outputFormat: 'side-by-side',
   *     theme: 'dark',
   *     compactMode: true
   *   }
   * );
   * ```
   */
  public generateStandaloneHTML(
    template: string,
    fileComparisons: FileComparison[],
    options: DiffOptions = {},
  ): string {
    // Default options for diff generation
    const defaultOptions: DiffOptions = {
      outputFormat: 'side-by-side', // Side-by-side comparison view
      showFiles: true, // Display file list
      matching: 'lines', // Line-based matching
      maxLineLengthHighlight: 10000, // Maximum line length for highlighting
      renderNothingWhenEmpty: false, // Always render something
      theme: 'light', // Default light theme
      compactMode: false, // Standard mode by default
    };

    const mergedOptions = {...defaultOptions, ...options};
    const unifiedDiff = this.generatePatches(fileComparisons);
    const stats = this.calculateStatistics(fileComparisons);

    // Generate diff HTML using diff2html
    const diffHtml = html(unifiedDiff, {
      outputFormat: mergedOptions.outputFormat,
      drawFileList: mergedOptions.showFiles,
      matching: mergedOptions.matching,
      renderNothingWhenEmpty: mergedOptions.renderNothingWhenEmpty,
      diffStyle: 'word', // Word-level diff highlighting
      //diffMaxLineLength: 100, // Maximum line length display
      //maxLineLengthHighlight: 200, // Maximum line length for syntax highlighting
    });

    // Create and return the complete HTML document
    return this.createStandaloneHTML(template, diffHtml, fileComparisons.length, stats, mergedOptions);
  }

  /**
   * Generates unified diff patches for all provided file comparisons.
   *
   * This private method creates unified diff format patches for each file comparison,
   * which are then used by diff2html to generate the visual diff display.
   *
   * @private
   * @param fileComparisons - Array of file comparison objects
   * @returns Unified diff string containing patches for all files
   */
  private generatePatches(fileComparisons: FileComparison[]): string {
    let unifiedDiff = '';

    // Generate a patch for each file comparison
    for (const file of fileComparisons) {
      const patch = createPatch(
        file.newPath, // New file path for the patch header
        file.oldContent, // Original file content
        file.newContent, // Modified file content
        `a/${file.oldPath}`, // Original file path in diff
        `b/${file.newPath}`, // Modified file path in diff
      );
      unifiedDiff += patch + '\n';
    }

    return unifiedDiff;
  }

  /**
   * Calculates comprehensive statistics for all file comparisons.
   *
   * This private method analyzes the diff between old and new content for each file
   * to compute metrics like added lines, removed lines, and modified lines.
   *
   * @private
   * @param fileComparisons - Array of file comparison objects
   * @returns Statistics object containing various diff metrics
   */
  private calculateStatistics(fileComparisons: FileComparison[]): DiffStatistics {
    let added = 0;
    let removed = 0;
    let modified = 0;
    let filesWithChanges = 0;

    // Analyze each file comparison
    for (const file of fileComparisons) {
      if (file.oldContent !== file.newContent) {
        filesWithChanges++;
        const diff = diffLines(file.oldContent, file.newContent);

        // Count added and removed lines
        for (const part of diff) {
          const lineCount = part.value.split('\n').filter(line => line.trim() !== '').length;

          if (part.added) {
            added += lineCount;
          } else if (part.removed) {
            removed += lineCount;
          }
        }
      }
    }

    // Estimate modified lines as the minimum of added and removed
    modified = Math.min(added, removed);

    return {
      totalFiles: fileComparisons.length,
      totalAdded: added,
      totalRemoved: removed,
      totalModified: modified,
      filesWithChanges,
    };
  }

  /**
   * Creates the complete standalone HTML document with all styling, scripts, and content.
   *
   * This private method renders the Nunjucks template with all necessary data,
   * including theme options, statistics, and the generated diff content.
   *
   * @private
   * @param template - Nunjucks template string for rendering
   * @param diffContent - HTML content generated by diff2html
   * @param fileCount - Number of files being compared
   * @param stats - Diff statistics object
   * @param options - Merged diff options affecting display
   * @returns Complete HTML string ready for output
   */
  private createStandaloneHTML(
    template: string,
    diffContent: string,
    fileCount: number,
    stats: DiffStatistics,
    options: DiffOptions,
  ): string {
    const compactClass = options.compactMode ? 'compact-mode' : '';
    const fontSizeScale = this.themeOptions.fontSizeScale || 1.0;
    const fontFamily = this.themeOptions.fontFamily || '\'Segoe UI\', sans-serif';
    const theme = options.theme || 'light';

    // Prepare comprehensive template data
    const templateData = {
      headerTitle: this.advancedConfig.headerTitle,
      theme: theme,
      compactClass: compactClass,
      showSummary: this.advancedConfig.showSummary,
      stats: stats,
      fileCount: fileCount,
      diffContent: diffContent,
      footerText: this.advancedConfig.footerText,
      currentDate: new Date().toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}),
      customCSS: this.advancedConfig.customCSS || '',
      customJS: this.advancedConfig.customJS || '',
      // Theme configuration options
      primaryColor: this.themeOptions.primaryColor,
      accentColor: this.themeOptions.accentColor,
      successColor: this.themeOptions.successColor,
      dangerColor: this.themeOptions.dangerColor,
      warningColor: this.themeOptions.warningColor,
      lightBg: this.themeOptions.lightBg,
      darkBg: this.themeOptions.darkBg,
      borderRadius: this.themeOptions.borderRadius,
      boxShadow: this.themeOptions.boxShadow,
      fontFamily: fontFamily,
      fontSizeScale: fontSizeScale,
      compactMode: options.compactMode,
    };

    // Render the template using Nunjucks
    return NunjucksHelper.renderString(template, templateData);
  }

  /**
   * Updates the theme configuration for the viewer.
   *
   * This method allows runtime modification of theme options such as colors,
   * fonts, and other visual properties. Changes will affect subsequent HTML generation.
   *
   * @param themeOptions - Partial theme options to merge with existing configuration
   *
   * @example
   * ```typescript
   * viewer.updateTheme({
   *   primaryColor: '#ff6b6b',
   *   compactMode: true
   * });
   * ```
   */
  public updateTheme(themeOptions: Partial<ThemeOptions>): void {
    this.themeOptions = {...this.themeOptions, ...themeOptions};
  }

  /**
   * Updates the advanced configuration for the viewer.
   *
   * This method allows runtime modification of advanced options such as
   * header/footer text, feature toggles, and custom CSS/JS.
   *
   * @param advancedConfig - Partial advanced configuration to merge with existing settings
   *
   * @example
   * ```typescript
   * viewer.updateAdvancedConfig({
   *   headerTitle: 'Company Diff Report',
   *   showFileStats: false,
   *   customCSS: '.custom { color: red; }'
   * });
   * ```
   */
  public updateAdvancedConfig(advancedConfig: Partial<AdvancedConfig>): void {
    this.advancedConfig = {...this.advancedConfig, ...advancedConfig};
  }

  /**
   * Generates a dynamic filename based on the current timestamp and configuration.
   *
   * This method creates a filename in the format: 'diff_YYYY-MM-DD_HH-mm-ss.html'
   * which is useful for uniquely identifying and organizing diff reports.
   *
   * @param extension - Optional file extension (defaults to 'html')
   * @param prefix - Optional filename prefix (defaults to 'diff')
   * @returns Generated filename string with timestamp
   *
   * @example
   * ```typescript
   * const filename = viewer.generateFilename(); // e.g., 'diff_2025-01-15_14-30-25.html'
   * const customName = viewer.generateFilename('txt', 'report'); // e.g., 'report_2025-01-15_14-30-25.txt'
   * ```
   */
  public generateFilename(extension: string = 'html', prefix: string = 'diff'): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
    return `${prefix}_${date}_${time}.${extension}`;
  }

  /**
   * Writes the generated HTML diff report to a file.
   *
   * This method generates a standalone HTML report and writes it to the filesystem
   * using a dynamically generated filename.
   *
   * @param template - Nunjucks template string for rendering the HTML report
   * @param fileComparisons - Array of file comparison objects
   * @param options - Configuration options for diff generation
   * @param outputDir - Optional output directory (defaults to current directory)
   * @returns Promise resolving to the full path of the written file
   *
   * @example
   * ```typescript
   * const filePath = await viewer.writeFile(
   *   template,
   *   fileComparisons,
   *   { theme: 'dark', compactMode: true },
   *   './reports'
   * );
   * console.log(`Report saved to: ${filePath}`);
   * ```
   */
  public writeFile(
    template: string,
    fileComparisons: FileComparison[],
    options: DiffOptions = {},
    outputDir: string = '.',
  ): string {

    const html = this.generateStandaloneHTML(template, fileComparisons, options);
    const filename = this.generateFilename();
    const filePath = join(outputDir, filename);

    FileHelper.saveTextToFile(filePath, html)
    return filePath;
  }
}
