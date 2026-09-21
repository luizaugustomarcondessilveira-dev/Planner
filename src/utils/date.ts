/**
 * Date utility functions for local timezone handling in Atelier & Alento.
 * Prevents timezone offset issues caused by toISOString().
 */

/**
 * Returns YYYY-MM-DD string in local timezone
 */
export function toLocalDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD string into a local Date object (at 00:00:00 local time)
 */
export function parseLocalDateKey(dateStr: string): Date {
  if (!dateStr || !dateStr.includes('-')) {
    return new Date();
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(year, month, day);
}

/**
 * Returns ISO 8601 week number for a given date
 */
export function getISOWeekNumber(d: Date): number {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

export interface WeekDayInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  dayName: string; // Seg, Ter, Qua...
  isToday: boolean;
}

/**
 * Calculates the 7 days of the week (Monday to Sunday) for baseDate + weekOffset
 */
export function getWeekDates(baseDate: Date = new Date(), weekOffset: number = 0): WeekDayInfo[] {
  const todayStr = toLocalDateKey(new Date());
  
  // Clone base date
  const target = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  target.setDate(target.getDate() + weekOffset * 7);

  // Determine Monday of this week (0 is Sunday, 1 is Monday in JS getDay())
  const dayOfWeek = target.getDay(); // 0 (Sun) to 6 (Sat)
  // Distance to Monday: if Sunday (0), go back 6 days; if Monday (1), go back 0 days, etc.
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(target.getFullYear(), target.getMonth(), target.getDate() + diffToMonday);

  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const weekDays: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateStr = toLocalDateKey(current);
    weekDays.push({
      date: current,
      dateStr,
      dayNum: current.getDate(),
      dayName: dayNames[i],
      isToday: dateStr === todayStr,
    });
  }

  return weekDays;
}

/**
 * Formats Month and Year in pt-BR with first letter uppercase (e.g., "Outubro 2024")
 */
export function getMonthYearTitle(d: Date): string {
  const monthName = d.toLocaleDateString('pt-BR', { month: 'long' });
  const year = d.getFullYear();
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalizedMonth} ${year}`;
}

/**
 * Formats a date string into readable pt-BR text (e.g., "19 de Outubro")
 */
export function formatDateDisplay(dateStr: string): string {
  const d = parseLocalDateKey(dateStr);
  const day = d.getDate();
  const month = d.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${day} de ${capitalizedMonth}`;
}

/**
 * Formats a date string into short pt-BR text (e.g., "19/Out" or "19/10/2025")
 */
export function formatDateShortBR(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr || '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Calculates number of calendar days between today and the target date (positive = in future, negative = overdue, 0 = today)
 */
export function getDaysDiffFromToday(dateStr: string): number {
  if (!dateStr || !dateStr.includes('-')) return 0;
  const todayStr = toLocalDateKey(new Date());
  if (dateStr === todayStr) return 0;

  const [y1, m1, d1] = todayStr.split('-').map(Number);
  const [y2, m2, d2] = dateStr.split('-').map(Number);

  const dStart = new Date(y1, m1 - 1, d1).getTime();
  const dEnd = new Date(y2, m2 - 1, d2).getTime();

  return Math.round((dEnd - dStart) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates human readable age in pt-BR from YYYY-MM-DD (e.g., "3 anos", "8 meses", "1 ano e 2 meses")
 * If the input is a legacy free-text string (e.g. "3 aninhos"), returns that string directly.
 */
export function calculateAgeDisplay(birthDate?: string): string {
  if (!birthDate) return '';
  const trimmed = birthDate.trim();
  if (!trimmed) return '';

  // Check if valid YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed; // Return legacy free-text as-is
  }

  const [y, m, d] = trimmed.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0 && months <= 0) {
    return 'Recém-nascido(a)';
  }

  if (years === 0) {
    return months === 1 ? '1 mês' : `${months} meses`;
  }

  if (months === 0) {
    return years === 1 ? '1 ano' : `${years} anos`;
  }

  const yearPart = years === 1 ? '1 ano' : `${years} anos`;
  const monthPart = months === 1 ? '1 mês' : `${months} meses`;
  return `${yearPart} e ${monthPart}`;
}

