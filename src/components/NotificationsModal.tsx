import React, { useState } from 'react';
import { Language, UserAccount } from '../types';
import { EnrichedNotification } from '../lib/notifications';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  PiggyBank,
  CheckCheck,
  Search,
  ExternalLink,
  Clock,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EnrichedNotification[];
  currentUser: UserAccount;
  language: Language;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUser,
  language,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateTab,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'payment' | 'meeting' | 'rule'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filterCategory !== 'all' && n.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleActionClick = (notif: EnrichedNotification) => {
    onMarkAsRead(notif.id);
    if (notif.actionTab) {
      onNavigateTab(notif.actionTab);
      onClose();
    }
  };

  const getNotificationIcon = (category: string, type: string) => {
    switch (category) {
      case 'payment':
        return <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'rule':
        return <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return type === 'alert' ? (
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        ) : (
          <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === 'bn' ? 'সকল নোটিফিকেশন কেন্দ্র' : 'Notification Center'}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    {unreadCount} {language === 'bn' ? 'টি অপঠিত' : 'unread'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'bn'
                  ? 'মাসিক চাঁদা, সাধারণ সভা, সভার রেজোলিউশন ও ঘোষণা'
                  : 'Monthly dues, general meetings, bylaws, and notices'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/60 flex items-center gap-1 cursor-pointer transition-colors"
                title={language === 'bn' ? 'সব পঠিত হিসেবে চিহ্নিত করুন' : 'Mark all as read'}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'bn' ? 'সব পঠিত' : 'Mark all read'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-850 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: 'all', label: language === 'bn' ? 'সকল' : 'All' },
              { id: 'payment', label: language === 'bn' ? 'চাঁদা ও সঞ্চয়' : 'Payments' },
              { id: 'meeting', label: language === 'bn' ? 'সাধারণ সভা' : 'Meetings' },
              { id: 'rule', label: language === 'bn' ? 'নিয়মাবলী' : 'Rules' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCategory(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'খুঁজুন...' : 'Search notices...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? 'কোনো নোটিফিকেশন পাওয়া যায়নি' : 'No notifications found'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'bn' ? 'নতুন নোটিফিকেশন এলে এখানে প্রদর্শিত হবে।' : 'New notices will appear here.'}
              </p>
            </div>
          ) : (
            filtered.map((n) => {
              return (
                <div
                  key={n.id}
                  className={`p-3.5 sm:p-4 rounded-2xl transition-all mb-2 flex items-start gap-3.5 ${
                    n.isRead
                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      : 'bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getNotificationIcon(n.category, n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] gap-2">
                      <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>{n.createdAt.split('T')[0]}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(n.id)}
                            className="text-slate-400 hover:text-indigo-600 text-[10px] font-medium cursor-pointer"
                          >
                            {language === 'bn' ? 'পঠিত চিহ্নিত করুন' : 'Mark as read'}
                          </button>
                        )}

                        {n.actionTab && (
                          <button
                            type="button"
                            onClick={() => handleActionClick(n)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <span>{n.actionLabel || (language === 'bn' ? 'দেখুন' : 'View')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-center">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
