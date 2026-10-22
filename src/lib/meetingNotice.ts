export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  daysFormattedBn: string;
  hoursFormattedBn: string;
  minutesFormattedBn: string;
  secondsFormattedBn: string;
  daysFormattedEn: string;
  hoursFormattedEn: string;
  minutesFormattedEn: string;
  secondsFormattedEn: string;
}

export interface MeetingNoticeInfo {
  ruleTextBn: string;
  ruleTextEn: string;
  meetingDate: Date;
  dateStringBn: string;
  dateStringEn: string;
  timeStringBn: string;
  timeStringEn: string;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  isToday: boolean;
  statusTextBn: string;
  statusTextEn: string;
  countdown: CountdownTime;
}

const BENGALI_MONTHS = [
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

const ENGLISH_MONTHS = [
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

export function toBengaliDigits(val: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, (digit) => bnDigits[Number(digit)]);
}

/**
 * Finds the last Friday falling between the 1st and the 11th of a given month
 * (Meeting time: 8:00 PM / 20:00)
 */
export function getLastFridayBetween1stAnd11th(year: number, monthIndex: number): Date {
  let fridayDay = 1;
  // Friday is day 5 (0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat)
  for (let d = 1; d <= 11; d++) {
    const candidate = new Date(year, monthIndex, d, 20, 0, 0, 0);
    if (candidate.getDay() === 5) {
      fridayDay = d;
    }
  }
  return new Date(year, monthIndex, fridayDay, 20, 0, 0, 0);
}

/**
 * Computes upcoming meeting date, countdown (days, hours, minutes, seconds), and notice texts.
 * Once 8:00 PM passes on the meeting day, the target immediately switches to the following month's meeting.
 */
export function getUpcomingMeetingNotice(now: Date = new Date()): MeetingNoticeInfo {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Meeting date for the current calendar month (at 8:00 PM / 20:00:00)
  const thisMonthMeeting = getLastFridayBetween1stAnd11th(currentYear, currentMonth);

  let targetMeeting: Date;
  // If the current time is strictly before 8:00 PM on this month's meeting date:
  if (now.getTime() < thisMonthMeeting.getTime()) {
    targetMeeting = thisMonthMeeting;
  } else {
    // Once 8 PM passes, the countdown for the following month's meeting begins:
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    targetMeeting = getLastFridayBetween1stAnd11th(nextYear, nextMonth);
  }

  const isToday =
    now.getFullYear() === targetMeeting.getFullYear() &&
    now.getMonth() === targetMeeting.getMonth() &&
    now.getDate() === targetMeeting.getDate();

  // Calculate live remaining difference in ms
  const diffMs = Math.max(0, targetMeeting.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  const countdown: CountdownTime = {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    daysFormattedBn: toBengaliDigits(pad(days)),
    hoursFormattedBn: toBengaliDigits(pad(hours)),
    minutesFormattedBn: toBengaliDigits(pad(minutes)),
    secondsFormattedBn: toBengaliDigits(pad(seconds)),
    daysFormattedEn: pad(days),
    hoursFormattedEn: pad(hours),
    minutesFormattedEn: pad(minutes),
    secondsFormattedEn: pad(seconds),
  };

  const day = targetMeeting.getDate();
  const monthIdx = targetMeeting.getMonth();
  const year = targetMeeting.getFullYear();

  const dateStringBn = `${day} ${BENGALI_MONTHS[monthIdx]} ${year} (শুক্রবার)`;
  const dateStringEn = `Friday, ${day} ${ENGLISH_MONTHS[monthIdx]} ${year}`;
  const timeStringBn = 'রাত ৮:০০ ঘটিকা';
  const timeStringEn = '8:00 PM';

  const statusTextBn = isToday
    ? `আজ রাত ৮:০০ টায় সাধারণ সভা! আর ${toBengaliDigits(hours)} ঘণ্টা ${toBengaliDigits(minutes)} মিনিট বাকি`
    : days === 1
    ? `আগামীকাল রাত ৮:০০ টায় সভা! আর ১ দিন ${toBengaliDigits(hours)} ঘণ্টা বাকি`
    : `আর ${toBengaliDigits(days)} দিন ${toBengaliDigits(hours)} ঘণ্টা বাকি`;

  const statusTextEn = isToday
    ? `Tonight at 8:00 PM! ${hours}h ${minutes}m left`
    : days === 1
    ? `Tomorrow at 8:00 PM! 1 day ${hours}h left`
    : `${days} days ${hours}h left`;

  return {
    ruleTextBn:
      'আমাদের সাধারণ সভা প্রতি মাসের ১ তারিখ থেকে ১১ তারিখের মধ্যবর্তী শেষ শুক্রবার রাত ৮:০০ টায় অনুষ্ঠিত হয়।',
    ruleTextEn:
      'Our meetings are held at 8:00 PM on the last Friday falling between the 1st and the 11th of the month.',
    meetingDate: targetMeeting,
    dateStringBn,
    dateStringEn,
    timeStringBn,
    timeStringEn,
    daysRemaining: days,
    hoursRemaining: hours,
    minutesRemaining: minutes,
    secondsRemaining: seconds,
    isToday,
    statusTextBn,
    statusTextEn,
    countdown,
  };
}
