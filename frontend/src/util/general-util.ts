/**
 * Formats a given Date object into a locale-specific string representation.
 *
 * @param date - The Date object to format.
 * @returns A string representing the formatted date and time according to the user's locale.
 */
export function formatDate(date: Date) {
    return new Date(date).toLocaleString();
}