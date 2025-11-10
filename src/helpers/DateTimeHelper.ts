/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

/**
 * A helper class for handling date and time operations.
 *
 * This class provides utility methods for converting and formatting dates.
 * All methods are static and do not require instantiation.
 *
 * @example
 * ```typescript
 * const isoString = DateTimeHelper.fromDate(new Date());
 * console.log(isoString); // e.g., "2023-10-05T14:48:00.000Z"
 * ```
 */
export default abstract class DateTimeHelper {
  /**
   * Converts a Date object into an ISO 8601 string representation.
   *
   * @param date - The Date object to be converted.
   * @returns The ISO 8601 formatted string (e.g., "2023-10-05T14:48:00.000Z").
   *
   * @example
   * ```typescript
   * const date = new Date('2023-10-05T14:48:00.000Z');
   * const isoString = DateTimeHelper.fromDate(date);
   * console.log(isoString); // "2023-10-05T14:48:00.000Z"
   * ```
   */
  public static fromDate(date: Date): string {
    return date.toISOString();
  }
}
