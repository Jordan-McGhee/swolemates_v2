/**
 * Formats a given Date object into various string representations.
 *
 * @param date - The Date object to format.
 * @param format - The format type: "full" | "date" | "shortTime" | "relative"
 * @returns A string representing the formatted date/time.
 */
export function formatDate(
    date: Date,
    format: "full" | "date" | "shortTime" | "relative" = "full"
): string {
    const d = new Date(date);

    // "Aug 7, 2025"
    if (format === "date") {
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    // "Aug 7, 9:36 PM"
    if (format === "shortTime") {
        return d.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    }

    if (format === "relative") {
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);

        if (diffWeek >= 1) return `${diffWeek}w ago`;
        if (diffDay >= 1) return `${diffDay}d ago`;
        if (diffHour >= 1) return `${diffHour}h ago`;
        if (diffMin >= 1) return `${diffMin}m ago`;
        return "just now";
    }

    // Default: full locale string
    return d.toLocaleString();
}