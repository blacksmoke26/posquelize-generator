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
   * Converts a Date object into a timestamp string format 'YYYYMMDDHHmmss'.
   * Optionally adds a specified number of seconds to the date before conversion.
   *
   * @param date - The Date object to be converted. Can be null or defaults to current date if not provided.
   * @param addSeconds - Number of seconds to add to the date. Defaults to 0.
   * @returns The formatted timestamp string (e.g., "20231005144800").
   *
   * @example
   * ```typescript
   * const date = new Date('2023-10-05T14:48:00.000Z');
   * const formatted = DateTimeHelper.getTimestamp(date);
   * console.log(formatted); // "20231005144800"
   *
   * const withAddedSeconds = DateTimeHelper.getTimestamp(date, 30);
   * console.log(withAddedSeconds); // "20231005144830"
   * ```
   */
  public static getTimestamp(date: Date | null = new Date, addSeconds: number = 0): string {
    const newDate = new Date((date || new Date).getTime() + addSeconds * 1000);
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const hours = String(newDate.getHours()).padStart(2, '0');
    const minutes = String(newDate.getMinutes()).padStart(2, '0');
    const seconds = String(newDate.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Converts a timestamp string in 'YYYYMMDDHHmmss' format into a JavaScript Date object.
   *
   * @param timestamp - The timestamp string to be converted (e.g., "20231005144800").
   * @returns A Date object representing the timestamp.
   *
   * @example
   * ```typescript
   * const timestamp = "20231005144800";
   * const date = DateTimeHelper.fromTimestamp(timestamp);
   * console.log(date); // Date object representing October 5, 2023, 14:48:00
   * ```
   */
  public static fromTimestamp(timestamp: string): Date {
    if (!/^\d{14}$/.test(timestamp)) {
      throw new Error('Invalid timestamp format. Expected "YYYYMMDDHHmmss".');
    }

    const year = parseInt(timestamp.slice(0, 4), 10);
    const month = parseInt(timestamp.slice(4, 6), 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(timestamp.slice(6, 8), 10);
    const hours = parseInt(timestamp.slice(8, 10), 10);
    const minutes = parseInt(timestamp.slice(10, 12), 10);
    const seconds = parseInt(timestamp.slice(12, 14), 10);

    return new Date(year, month, day, hours, minutes, seconds);
  }
}
