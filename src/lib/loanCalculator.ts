import { Loan } from '../types';

export interface MonthBreakdownItem {
  periodLabelBn: string;
  periodLabelEn: string;
  startDate: string;
  endDate: string;
  daysInMonth: number;
  daysElapsed: number;
  isFullMonth: boolean;
  profit: number;
}

export interface LoanCalculationResult {
  daysElapsed: number;
  fullMonths: number;
  remainingDays: number;
  durationTextBn: string;
  durationTextEn: string;
  totalAccruedProfit: number;
  unpaidProfit: number;
  accruedProfit: number; // Unpaid profit (for backward compatibility)
  totalDueNow: number;
  monthBreakdown: MonthBreakdownItem[];
}

const BENGALI_MONTH_NAMES = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const ENGLISH_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Checks whether a given year is a leap year (accounting for 4-year cycle and century rules)
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns exact days in a specific calendar month (e.g. 28/29 for Feb, 30 for Apr, 31 for Jan)
 * @param year Full year (e.g. 2026)
 * @param monthIndex 0-indexed month (0 = Jan, 1 = Feb, ... 11 = Dec)
 */
export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Computes next anchor date exactly 1 calendar month later, clamping day of month if target month has fewer days
 * (e.g. Jan 31 -> Feb 28 in non-leap year or Feb 29 in leap year).
 */
function getNextMonthAnchor(baseDate: Date, monthsToAdd: number): Date {
  const origDay = baseDate.getDate();
  const baseYear = baseDate.getFullYear();
  const totalMonths = baseDate.getMonth() + monthsToAdd;
  const targetYear = baseYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const daysInTargetMonth = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(origDay, daysInTargetMonth);
  return new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
}

/**
 * Formats date into YYYY-MM-DD
 */
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates loan durations based on the specific number of days in each month
 * (28/29 for Feb with leap years, 30 or 31 days), with any remaining period
 * calculated simply by the number of days.
 */
export function calculateAccurateLoanDurationAndProfit(
  loan: Loan,
  asOfDateStr: string = new Date().toISOString().split('T')[0]
): LoanCalculationResult {
  if (loan.remainingPrincipal <= 0 || loan.status === 'paid') {
    return {
      daysElapsed: 0,
      fullMonths: 0,
      remainingDays: 0,
      durationTextBn: '০ দিন (পরিশোধিত)',
      durationTextEn: '0 days (Paid off)',
      totalAccruedProfit: 0,
      unpaidProfit: 0,
      accruedProfit: 0,
      totalDueNow: 0,
      monthBreakdown: [],
    };
  }

  const startParts = (loan.loanDate || asOfDateStr).split('-').map(Number);
  const endParts = asOfDateStr.split('-').map(Number);

  const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0);
  const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2], 0, 0, 0, 0);

  if (endDate.getTime() <= startDate.getTime()) {
    return {
      daysElapsed: 0,
      fullMonths: 0,
      remainingDays: 0,
      durationTextBn: '০ দিন',
      durationTextEn: '0 days',
      totalAccruedProfit: 0,
      unpaidProfit: 0,
      accruedProfit: 0,
      totalDueNow: loan.remainingPrincipal,
      monthBreakdown: [],
    };
  }

  const monthlyRateFraction = (loan.rate || 10) / 100;
  const principal = loan.remainingPrincipal;
  const monthBreakdown: MonthBreakdownItem[] = [];

  let fullMonths = 0;
  let currentAnchor = new Date(startDate);

  // 1. Advance full calendar months
  while (true) {
    const nextAnchor = getNextMonthAnchor(startDate, fullMonths + 1);
    if (nextAnchor.getTime() <= endDate.getTime()) {
      const stepDiffTime = nextAnchor.getTime() - currentAnchor.getTime();
      const stepDays = Math.max(1, Math.round(stepDiffTime / (1000 * 60 * 60 * 24)));
      const anchorMonth = currentAnchor.getMonth();
      const anchorYear = currentAnchor.getFullYear();
      const fullDaysInThisMonth = getDaysInMonth(anchorYear, anchorMonth);

      const stepProfit = Math.round(principal * monthlyRateFraction * 100) / 100;

      const mNameBn = BENGALI_MONTH_NAMES[anchorMonth];
      const mNameEn = ENGLISH_MONTH_NAMES[anchorMonth];
      const leapTextBn = anchorMonth === 1 && isLeapYear(anchorYear) ? ' (অধিবর্ষ/Leap Year ২৯ দিন)' : ` (${fullDaysInThisMonth} দিন)`;
      const leapTextEn = anchorMonth === 1 && isLeapYear(anchorYear) ? ' (Leap Year 29 days)' : ` (${fullDaysInThisMonth} days)`;

      monthBreakdown.push({
        periodLabelBn: `${mNameBn} ${anchorYear}${leapTextBn} - পূর্ণ মাস`,
        periodLabelEn: `${mNameEn} ${anchorYear}${leapTextEn} - Full Month`,
        startDate: formatDateKey(currentAnchor),
        endDate: formatDateKey(nextAnchor),
        daysInMonth: fullDaysInThisMonth,
        daysElapsed: stepDays,
        isFullMonth: true,
        profit: stepProfit,
      });

      fullMonths++;
      currentAnchor = nextAnchor;
    } else {
      break;
    }
  }

  // 2. Remaining period simply calculated by the number of days
  const remainingTime = endDate.getTime() - currentAnchor.getTime();
  const remainingDays = Math.max(0, Math.round(remainingTime / (1000 * 60 * 60 * 24)));

  let remainingProfit = 0;
  if (remainingDays > 0) {
    const ongoingMonth = currentAnchor.getMonth();
    const ongoingYear = currentAnchor.getFullYear();
    const daysInOngoingMonth = getDaysInMonth(ongoingYear, ongoingMonth);

    // Rate proportional to the exact number of days in this month
    const dailyProfit = (principal * monthlyRateFraction) / daysInOngoingMonth;
    remainingProfit = Math.round(dailyProfit * remainingDays * 100) / 100;

    const mNameBn = BENGALI_MONTH_NAMES[ongoingMonth];
    const mNameEn = ENGLISH_MONTH_NAMES[ongoingMonth];
    const leapTextBn = ongoingMonth === 1 && isLeapYear(ongoingYear) ? ' (অধিবর্ষ ২৯ দিন)' : ` (${daysInOngoingMonth} দিন)`;
    const leapTextEn = ongoingMonth === 1 && isLeapYear(ongoingYear) ? ' (Leap Year 29d)' : ` (${daysInOngoingMonth}d)`;

    monthBreakdown.push({
      periodLabelBn: `${mNameBn} ${ongoingYear}${leapTextBn} - অবশিষ্ট ${remainingDays} দিন`,
      periodLabelEn: `${mNameEn} ${ongoingYear}${leapTextEn} - Remaining ${remainingDays} days`,
      startDate: formatDateKey(currentAnchor),
      endDate: formatDateKey(endDate),
      daysInMonth: daysInOngoingMonth,
      daysElapsed: remainingDays,
      isFullMonth: false,
      profit: remainingProfit,
    });
  }

  // Total days elapsed from loanDate to asOfDate
  const totalDaysElapsed = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Sum total accrued profit across all full months + remaining days
  const fullMonthsProfit = fullMonths * (principal * monthlyRateFraction);
  const totalAccruedProfit = Math.round((fullMonthsProfit + remainingProfit) * 100) / 100;

  // Net unpaid profit accounting for any previously recorded profit payments
  const unpaidProfit = Math.max(0, Math.round((totalAccruedProfit - (loan.totalProfitPaid || 0)) * 100) / 100);
  const totalDueNow = Math.round((loan.remainingPrincipal + unpaidProfit) * 100) / 100;

  // Build human-readable duration strings
  let durationTextBn = '';
  let durationTextEn = '';

  if (fullMonths > 0 && remainingDays > 0) {
    durationTextBn = `${fullMonths} মাস ${remainingDays} দিন (মোট ${totalDaysElapsed} দিন)`;
    durationTextEn = `${fullMonths} Month${fullMonths > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''} (Total ${totalDaysElapsed} days)`;
  } else if (fullMonths > 0) {
    durationTextBn = `${fullMonths} পূর্ণ মাস (মোট ${totalDaysElapsed} দিন)`;
    durationTextEn = `${fullMonths} Full Month${fullMonths > 1 ? 's' : ''} (${totalDaysElapsed} days)`;
  } else {
    const ongoingMonth = startDate.getMonth();
    const daysInMonth = getDaysInMonth(startDate.getFullYear(), ongoingMonth);
    durationTextBn = `${remainingDays} দিন (${BENGALI_MONTH_NAMES[ongoingMonth]} মাসের ${daysInMonth} দিনের ভিত্তিতে)`;
    durationTextEn = `${remainingDays} Days (based on ${daysInMonth} days in ${ENGLISH_MONTH_NAMES[ongoingMonth]})`;
  }

  return {
    daysElapsed: totalDaysElapsed,
    fullMonths,
    remainingDays,
    durationTextBn,
    durationTextEn,
    totalAccruedProfit,
    unpaidProfit,
    accruedProfit: unpaidProfit,
    totalDueNow,
    monthBreakdown,
  };
}
