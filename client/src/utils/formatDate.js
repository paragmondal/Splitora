import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isToday,
  isValid,
  parseISO,
} from "date-fns";

const toDate = (value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string") return parseISO(value);
  return new Date(value);
};

const safeDate = (value) => {
  const date = toDate(value);
  return isValid(date) ? date : null;
};

export function formatDate(date) {
  const parsedDate = safeDate(date);
  if (!parsedDate) return "-";
  return format(parsedDate, "dd MMM yyyy");
}

export function formatRelative(date) {
  const parsedDate = safeDate(date);
  if (!parsedDate) return "-";

  if (isToday(parsedDate)) {
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  }

  const daysDiff = differenceInCalendarDays(new Date(), parsedDate);
  if (daysDiff === 1) {
    return "yesterday";
  }

  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

export function formatMonth(date) {
  const parsedDate = safeDate(date);
  if (!parsedDate) return "-";
  return format(parsedDate, "MMMM yyyy");
}

export default formatDate;
