import React, { useState, useEffect, useMemo } from 'react';
import { Language, SocietyRule } from '../types';
import { getUpcomingMeetingNotice } from '../lib/meetingNotice';
import { StorageService } from '../lib/storage';
import {
  Bell,
  Clock,
  CalendarClock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileText,
  Sparkles,
  Info,
} from 'lucide-react';

interface MeetingNoticeBannerProps {
  language: Language;
  rules?: SocietyRule[];
  onNavigate?: (tab: string) => void;
  className?: string;
}

interface NoticeTickerItem {
  id: string;
  badge: string;
  badgeColor: string;
  date?: string;
  title: string;
  details: string;
}

export const MeetingNoticeBanner: React.FC<MeetingNoticeBannerProps> = ({
  language,
  rules: propRules,
  onNavigate,
  className = '',
}) => {
  // Live ticking clock updated every second
  const [currentClock, setCurrentClock] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const meetingNotice = getUpcomingMeetingNotice(currentClock);
  const { countdown } = meetingNotice;

  // Retrieve active rules from props or storage
  const activeRules: SocietyRule[] = useMemo(() => {
    const list = propRules && propRules.length > 0 ? propRules : StorageService.getRules();
    return list.filter((r) => r.status !== 'archived');
  }, [propRules]);

  // Build sequential list of notices regarding Society Meeting Resolutions and the Rule Book
  const tickerItems: NoticeTickerItem[] = useMemo(() => {
    const items: NoticeTickerItem[] = [];

    // 1. Dynamic Society Meeting Resolutions from Database
    activeRules.forEach((rule) => {
      const cleanTitle = (rule.title || '').replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '');
      const cleanDetails = (rule.decisionDetails || '').replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '');
      items.push({
        id: rule.ruleId,
        badge: rule.resolutionNumber || (language === 'bn' ? 'রেজোলিউশন' : 'Resolution'),
        badgeColor: 'bg-purple-600 text-white',
        date: rule.meetingDate,
        title: cleanTitle,
        details: cleanDetails,
      });
    });

    // 2. Official Society Rule Book Permanent Bylaws (গঠনতন্ত্র ও স্থায়ী কার্যবিধি)
    if (language === 'bn') {
      items.push(
        {
          id: 'rulebook-meeting',
          badge: 'স্থায়ী সভার নিয়ম',
          badgeColor: 'bg-amber-600 text-white',
          title: 'মাসিক সাধারণ সভা সময়সূচি',
          details: 'প্রতি ইংরেজি মাসের ১ থেকে ১১ তারিখের মধ্যকার শেষ শুক্রবারে রাত ৮:০০ ঘটিকায় সমিতির মাসিক সাধারণ সভা অনুষ্ঠিত হয়। সকল সদস্যের উপস্থিতি আবশ্যক।',
        },
        {
          id: 'rulebook-savings',
          badge: 'গঠনতন্ত্র বিধি',
          badgeColor: 'bg-emerald-600 text-white',
          title: 'নিয়মিত মাসিক সঞ্চয় কিস্তি',
          details: 'সকল সক্রিয় সদস্যকে প্রতি মাসের নির্ধারিত তারিখের মধ্যে ১০০ টাকা মাসিক সঞ্চয় কিস্তি জমা প্রদান করতে হবে।',
        },
        {
          id: 'rulebook-loan',
          badge: 'ঋণ নীতিমালা',
          badgeColor: 'bg-rose-600 text-white',
          title: 'ঋণ বিতরণ ও ১০% মাসিক মুনাফা',
          details: 'সদস্যদের জরুরি প্রয়োজনে সমিতির সংরক্ষিত তহবিল থেকে ঋণ প্রদান করা হয়, যাতে মাসিক ১০% সরল মুনাফা হারে কিস্তি পরিশোধযোগ্য।',
        },
        {
          id: 'rulebook-transparency',
          badge: 'নিরাপত্তা ও স্বচ্ছতা',
          badgeColor: 'bg-blue-600 text-white',
          title: 'ডিজিটাল হিসাব ও গুগল শিট ব্যাকআপ',
          details: 'সমিতির প্রতিটি আর্থিক লেনদেনে ডিজিটাল রশিদ প্রদান এবং গুগল শিট ক্লাউড ডাটাবেজে রিয়েল-টাইম ব্যাকআপের মাধ্যমে শতভাগ স্বচ্ছতা বজায় রাখা হয়।',
        }
      );
    } else {
      items.push(
        {
          id: 'rulebook-meeting-en',
          badge: 'Meeting Bylaw',
          badgeColor: 'bg-amber-600 text-white',
          title: 'Monthly General Meeting Schedule',
          details: 'General meetings are held on the last Friday between the 1st and 11th of each month at 8:00 PM. Attendance is mandatory for all members.',
        },
        {
          id: 'rulebook-savings-en',
          badge: 'Savings Rule',
          badgeColor: 'bg-emerald-600 text-white',
          title: 'Regular Monthly Savings Deposit',
          details: 'All active members must deposit their regular monthly installment of ৳100 within the scheduled due date of each month.',
        },
        {
          id: 'rulebook-loan-en',
          badge: 'Loan Bylaw',
          badgeColor: 'bg-rose-600 text-white',
          title: 'Member Loan Service & 10% Profit',
          details: 'Loans are distributed to members for emergency needs with a 10% monthly flat profit, repayable in timely installments.',
        },
        {
          id: 'rulebook-transparency-en',
          badge: 'Transparency',
          badgeColor: 'bg-blue-600 text-white',
          title: 'Digital Records & Google Sheets Sync',
          details: 'Instant digital receipts and 14-tab Google Sheets cloud synchronization ensure 100% financial transparency.',
        }
      );
    }

    return items;
  }, [activeRules, language]);

  return (
    <div
      className={`rounded-2xl p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-purple-500/10 dark:from-amber-950/35 dark:via-slate-900/40 dark:to-purple-950/30 border border-amber-300/80 dark:border-amber-700/60 shadow-xs relative overflow-hidden space-y-2.5 ${className}`}
    >
      {/* Top Row: Streamlined Meeting Schedule & Compact Live Countdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Meeting Notice Label & Scheduled Date */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-2xs flex-shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
                {language === 'bn' ? 'সাধারণ সভা বিজ্ঞপ্তি' : 'General Meeting Notice'}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-tight flex items-center gap-1.5 flex-wrap">
              <span className="text-amber-700 dark:text-amber-400 font-extrabold underline decoration-amber-500/70 decoration-2">
                {language === 'bn' ? meetingNotice.dateStringBn : meetingNotice.dateStringEn}
              </span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                ({language === 'bn' ? '8:00 PM' : '8:00 PM'})
              </span>
            </h4>
          </div>
        </div>

        {/* Compact, Well-Proportioned Live Countdown (Adjusted size) */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto shrink-0">
          {/* Compact Monospace Countdown Chip */}
          <div className="px-2.5 py-1 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 shadow-2xs flex items-center gap-1 text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
            <CalendarClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {language === 'bn'
                ? `${countdown.daysFormattedBn} দিন : ${countdown.hoursFormattedBn} ঘ. : ${countdown.minutesFormattedBn} মি. : ${countdown.secondsFormattedBn} সে.`
                : `${countdown.daysFormattedEn}d : ${countdown.hoursFormattedEn}h : ${countdown.minutesFormattedEn}m : ${countdown.secondsFormattedEn}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Sequential Scrolling Ticker for Society Meeting Resolutions and the Rule Book */}
      <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/50 flex items-center gap-2 sm:gap-3 overflow-hidden text-xs">
        {/* Left Fixed Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/70 font-bold shrink-0 shadow-2xs text-[11px] sm:text-xs">
          <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{language === 'bn' ? 'সভার সিদ্ধান্ত' : 'Resolutions'}</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
        </div>

        {/* Marquee Track: Scrolls sequentially from right to left */}
        <div
          className="relative flex-1 overflow-hidden select-none cursor-pointer py-0.5"
          onClick={() => onNavigate && onNavigate('admin_rules')}
          title={language === 'bn' ? 'সকল সিদ্ধান্ত ও গঠনতন্ত্র দেখতে ক্লিক করুন (মাউস রাখলে স্ক্রল থামবে)' : 'Click to view all resolutions and bylaws (hover to pause)'}
        >
          {/* Subtle left & right gradient fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-amber-50/50 dark:from-slate-900/50 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-amber-50/50 dark:from-slate-900/50 to-transparent z-10" />

          {/* Marquee container with duplicated content for smooth infinite right-to-left loop */}
          <div className="animate-marquee-rtl flex items-center gap-6">
            {[...tickerItems, ...tickerItems].map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.badgeColor} shadow-2xs`}>
                  {item.badge}
                </span>

                {item.date && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    ({item.date})
                  </span>
                )}

                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {item.title}:
                </span>

                <span className="text-slate-600 dark:text-slate-300 font-normal">
                  {item.details}
                </span>

                <span className="text-amber-400 dark:text-amber-500 font-bold ml-2">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Action Button to navigate directly to Society Rules & Resolutions */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('admin_rules')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 dark:bg-slate-900/90 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 text-[11px] font-bold shrink-0 transition-colors shadow-2xs"
            title={language === 'bn' ? 'সকল সভার সিদ্ধান্ত ও গঠনতন্ত্র দেখুন' : 'View All Meeting Resolutions & Bylaws'}
          >
            <span>{language === 'bn' ? 'সকল নিয়ম' : 'View All'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
