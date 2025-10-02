/**
 * Formats a date string into a human-readable time ago format
 * @param dateString - ISO date string or Date object
 * @returns Formatted time ago string (Today, Yesterday, 2d ago, 1w ago, 3w ago, 2m ago, etc.)
 */
export function timeAgo(dateString: string | Date): string {
  const now = new Date();
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Unknown';
  }

  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  // Less than an hour
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  // Less than a day
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  // Today
  if (diffInDays === 0) {
    return 'Today';
  }

  // Yesterday
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  // Less than a week (but not today or yesterday)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);

  // Less than a month (4 weeks)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);

  // Less than a year (12 months)
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);

  // 1 year or more
  return `${diffInYears}y ago`;
}
