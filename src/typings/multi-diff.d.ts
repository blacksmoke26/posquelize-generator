/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

/**
 * Represents a comparison between two files for diff generation.
 */
export interface FileComparison {
  /** Path to the original file */
  oldPath: string;
  /** Path to the new file */
  newPath: string;
  /** Content of the original file */
  oldContent: string;
  /** Content of the new file */
  newContent: string;
}

/**
 * Configuration options for diff generation and display.
 */
export interface DiffOptions {
  /** Output format: 'line-by-line' or 'side-by-side' */
  outputFormat?: 'line-by-line' | 'side-by-side';
  /** Whether to show the file list */
  showFiles?: boolean;
  /** Matching strategy: 'lines', 'words', or 'none' */
  matching?: 'lines' | 'words' | 'none';
  /** Maximum line length for highlighting */
  maxLineLengthHighlight?: number;
  /** Whether to render nothing when diff is empty */
  renderNothingWhenEmpty?: boolean;
  /** Theme preference: 'light', 'dark', or 'system' */
  theme?: 'light' | 'dark';
  /** Compact mode for reduced spacing and smaller elements */
  compactMode?: boolean;
}

/**
 * Theme configuration options for customizing the appearance.
 */
export interface ThemeOptions {
  /** Primary color for text and icons */
  primaryColor?: string;
  /** Accent color for interactive elements */
  accentColor?: string;
  /** Color for added lines and elements */
  successColor?: string;
  /** Color for removed lines and elements */
  dangerColor?: string;
  /** Color for modified lines and elements */
  warningColor?: string;
  /** Background color for light mode */
  lightBg?: string;
  /** Background color for dark mode */
  darkBg?: string;
  /** Border radius for cards and containers */
  borderRadius?: string;
  /** Box shadow intensity */
  boxShadow?: string;
  /** Font family for the entire interface */
  fontFamily?: string;
  /** Font size scaling factor */
  fontSizeScale?: number;
}

/**
 * Statistics about the diff comparison.
 */
export interface DiffStatistics {
  /** Total number of files compared */
  totalFiles: number;
  /** Total number of lines added */
  totalAdded: number;
  /** Total number of lines removed */
  totalRemoved: number;
  /** Total number of lines modified */
  totalModified: number;
  /** Number of files with changes */
  filesWithChanges: number;
}

/**
 * Advanced configuration for the diff viewer.
 */
export interface AdvancedConfig {
  /** Custom header title */
  headerTitle?: string;
  /** Custom footer text */
  footerText?: string;
  /** Whether to show file icons */
  showFileIcons?: boolean;
  /** Whether to show summary statistics */
  showSummary?: boolean;
  /** Whether to show file statistics */
  showFileStats?: boolean;
  /** Custom CSS to inject */
  customCSS?: string;
  /** Custom JavaScript to inject */
  customJS?: string;
}
