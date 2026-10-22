import React, { useState } from 'react';
import {
  Member,
  MemberWithdrawal,
  PaymentMethod,
  UserAccount,
  Language,
  Receipt,
  DashboardMetrics,
  WithdrawalSource,
} from '../types';
import { getTranslation } from '../lib/translations';
import {
  WalletCards,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Check,
  ReceiptText,
  Search,
  Filter,
  ArrowUpRight,
  Building2,
  Banknote,
  Coins,
  PiggyBank,
  User,
  Phone,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Copy,
  Info,
  Smartphone,
} from 'lucide-react';

interface WithdrawalsManagementViewProps {
  withdrawals: MemberWithdrawal[];
  members: Member[];
  metrics: DashboardMetrics;
  currentUser: UserAccount;
  language: Language;
  onApproveWithdrawal: (params: {
    withdrawalId: string;
    paymentMethod: PaymentMethod;
    adminNotes?: string;
  }) => void;
  onRejectWithdrawal: (params: {
    withdrawalId: string;
    rejectionReason: string;
  }) => void;
  onDirectWithdrawal: (params: {
    memberSystemId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    source: WithdrawalSource;
    reason?: string;
  }) => void;
  onViewReceipt: (receiptId: string) => void;
  maxWithdrawalPercentage?: number;
  minReserveBalance?: number;
}

export const WithdrawalsManagementView: React.FC<WithdrawalsManagementViewProps> = ({
  withdrawals = [],
  members = [],
  metrics,
  currentUser,
  language,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onDirectWithdrawal,
  onViewReceipt,
  maxWithdrawalPercentage = 70,
  minReserveBalance = 500,
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'direct' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'profit' | 'savings'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Approval Modal State
  const [approvingWithdrawal, setApprovingWithdrawal] = useState<MemberWithdrawal | null>(null);
  const [approvalMethod, setApprovalMethod] = useState<PaymentMethod>('cash');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Rejection Modal State
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<MemberWithdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Direct Admin Withdrawal State
  const [directMemberId, setDirectMemberId] = useState<string>(members[0]?.systemId || '');
  const [directSource, setDirectSource] = useState<WithdrawalSource>('profit');
  const [directAmount, setDirectAmount] = useState<number | string>('');
  const [directMethod, setDirectMethod] = useState<PaymentMethod>('cash');
  const [directReason, setDirectReason] = useState('');
  const [directSuccess, setDirectSuccess] = useState<string | null>(null);
  const [directError, setDirectError] = useState<string | null>(null);

  // Filtered Lists
  const pendingRequests = withdrawals.filter((w) => w.status === 'pending');
  const completedWithdrawals = withdrawals.filter((w) => w.status === 'completed');
  const rejectedRequests = withdrawals.filter((w) => w.status === 'rejected');

  // Stats Calculations
  const totalPendingAmount = pendingRequests.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalProfitWithdrawn = completedWithdrawals
    .filter((w) => w.source === 'profit')
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalSavingsWithdrawn = completedWithdrawals
    .filter((w) => w.source !== 'profit')
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const grandTotalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

  // Selected Member for Direct Withdrawal
  const selectedDirectMember = members.find((m) => m.systemId === directMemberId) || members[0];
  const directMemberProfit = selectedDirectMember?.profitShareBalance || 0;
  const directMemberSavings = selectedDirectMember?.currentBalance || 0;
  const directMemberMaxSavings = Math.max(
    0,
    Math.min(
      Math.floor((directMemberSavings * maxWithdrawalPercentage) / 100),
      Math.max(0, directMemberSavings - minReserveBalance)
    )
  );

  const directMaxAllowed =
    directSource === 'profit'
      ? directMemberProfit
      : directSource === 'savings'
      ? directMemberMaxSavings
      : directMemberProfit + directMemberMaxSavings;

  const handleCopyAccount = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenApprove = (w: MemberWithdrawal) => {
    setApprovingWithdrawal(w);
    setApprovalMethod((w.paymentMethod === 'bank' ? 'bank' : 'cash') as PaymentMethod);
    setApprovalNotes('');
    setApprovalError(null);
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingWithdrawal) return;

    const available = approvalMethod === 'bank' ? metrics.bankBalance : metrics.cashBalance;
    if (available < approvingWithdrawal.amount) {
      setApprovalError(
        language === 'bn'
          ? `সমিতির ${approvalMethod === 'bank' ? 'ব্যাংক' : 'ক্যাশ'} তহবিলে পর্যাপ্ত অর্থ নেই (বর্তমান ব্যালেন্স: ৳${available.toLocaleString()})`
          : `Insufficient funds in ${approvalMethod}`
      );
      return;
    }

    onApproveWithdrawal({
      withdrawalId: approvingWithdrawal.withdrawalId,
      paymentMethod: approvalMethod,
      adminNotes: approvalNotes.trim() || undefined,
    });

    setApprovingWithdrawal(null);
  };

  const handleOpenReject = (w: MemberWithdrawal) => {
    setRejectingWithdrawal(w);
    setRejectionReason('');
    setRejectionError(null);
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingWithdrawal) return;
    if (!rejectionReason.trim()) {
      setRejectionError(language === 'bn' ? 'আবেদন বাতিলের কারণ উল্লেখ করুন।' : 'Please specify a reason.');
      return;
    }

    onRejectWithdrawal({
      withdrawalId: rejectingWithdrawal.withdrawalId,
      rejectionReason: rejectionReason.trim(),
    });

    setRejectingWithdrawal(null);
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError(null);
    setDirectSuccess(null);

    const amt = Number(directAmount);
    if (!amt || amt <= 0) {
      setDirectError(language === 'bn' ? 'সঠিক টাকার পরিমাণ দিন।' : 'Enter a valid amount.');
      return;
    }

    if (amt > directMaxAllowed) {
      setDirectError(
        language === 'bn'
          ? `সর্বোচ্চ অনুমোদিত সীমা ৳${directMaxAllowed.toLocaleString()} টাকা।`
          : `Maximum allowed amount is ৳${directMaxAllowed.toLocaleString()}.`
      );
      return;
    }

    const available = directMethod === 'bank' ? metrics.bankBalance : metrics.cashBalance;
    if (available < amt) {
      setDirectError(
        language === 'bn'
          ? `সমিতির ${directMethod === 'bank' ? 'ব্যাংক' : 'ক্যাশ'} তহবিলে পর্যাপ্ত অর্থ নেই (বর্তমান স্থিতি: ৳${available.toLocaleString()})`
          : `Insufficient funds in treasury.`
      );
      return;
    }

    onDirectWithdrawal({
      memberSystemId: selectedDirectMember.systemId,
      amount: amt,
      paymentMethod: directMethod,
      source: directSource,
      reason: directReason.trim() || undefined,
    });

    setDirectSuccess(
      language === 'bn'
        ? `সদস্য ${selectedDirectMember.name}-কে ৳${amt.toLocaleString()} সফলভাবে পরিশোধ করা হয়েছে এবং ভাউচার রসিদ তৈরি হয়েছে!`
        : `Successfully disbursed ৳${amt.toLocaleString()} to ${selectedDirectMember.name}!`
    );
    setDirectAmount('');
    setDirectReason('');
    setTimeout(() => setDirectSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-800 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-xs font-semibold uppercase tracking-wider">
              <WalletCards className="w-4 h-4" />
              <span>{language === 'bn' ? 'তহবিল ও লভ্যাংশ উত্তোলন কেন্দ্র' : 'Withdrawals & Profit Center'}</span>
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                  {pendingRequests.length} {language === 'bn' ? 'টি নতুন আবেদন' : 'Pending'}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight text-white">
              {language === 'bn' ? 'সদস্য তহবিল ও মুনাফা উত্তোলন প্রশাসন' : 'Member Withdrawals & Dividend Management'}
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 mt-1 max-w-2xl leading-relaxed">
              {language === 'bn'
                ? 'সাধারণ সদস্যদের জমাকৃত সঞ্চয় তহবিল এবং অর্জিত ঋণ মুনাফা লভ্যাংশ উত্তোলন আবেদনসমূহ পর্যালোচনা, অনুমোদন, সরাসরি ক্যাশ/ব্যাংক পরিশোধ ও ডিজিটাল ভাউচার তৈরি।'
                : 'Review member withdrawal requests from savings and accumulated loan profit dividends, approve disbursements and generate official vouchers.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('direct')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-purple-900 hover:bg-purple-50 shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <PlusCircle className="w-4 h-4 text-purple-700" />
              <span>{language === 'bn' ? 'সরাসরি নতুন উত্তোলন প্রদান' : 'Direct Admin Payout'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Requests */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/30 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {language === 'bn' ? 'অপেক্ষমাণ আবেদন' : 'Pending Requests'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-300 font-bold text-xs">
              {pendingRequests.length}
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ৳{totalPendingAmount.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'bn' ? `${pendingRequests.length} জন সদস্যের আবেদন অপেক্ষমাণ` : `${pendingRequests.length} requests awaiting review`}
            </p>
          </div>
        </div>

        {/* Card 2: Total Profit Dividends Withdrawn */}
        <div
          onClick={() => {
            setActiveTab('history');
            setSourceFilter('profit');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'history' && sourceFilter === 'profit'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/30 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              {language === 'bn' ? 'উত্তোলিত মুনাফা (লভ্যাংশ)' : 'Profit Dividends Paid'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
              ৳{totalProfitWithdrawn.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'bn' ? 'সদস্যদের প্রদানকৃত অর্জিত ঋণ মুনাফা' : 'Distributed loan profits withdrawn'}
            </p>
          </div>
        </div>

        {/* Card 3: Total Principal Savings Withdrawn */}
        <div
          onClick={() => {
            setActiveTab('history');
            setSourceFilter('savings');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'history' && sourceFilter === 'savings'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 ring-2 ring-blue-400/30 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              {language === 'bn' ? 'উত্তোলিত মূল সঞ্চয়' : 'Savings Capital Paid'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
              ৳{totalSavingsWithdrawn.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'bn' ? 'সদস্যদের উত্তোলিত মূল মাসিক সঞ্চয়' : 'Principal monthly savings withdrawn'}
            </p>
          </div>
        </div>

        {/* Card 4: Liquid Treasury Available */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {language === 'bn' ? 'সমিতির তরল তহবিল' : 'Treasury Liquidity'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ৳{(metrics.cashBalance + metrics.bankBalance).toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ক্যাশ: ৳{metrics.cashBalance.toLocaleString()} | ব্যাংক: ৳{metrics.bankBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{language === 'bn' ? 'অপেক্ষমাণ আবেদন' : 'Pending Requests'}</span>
            {pendingRequests.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'pending' ? 'bg-amber-800 text-white' : 'bg-rose-500 text-white'
              }`}>
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>{language === 'bn' ? 'পরিশোধিত খতিয়ান ও রসিদ' : 'Completed Register'}</span>
            <span className="text-[11px] opacity-80">({completedWithdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'bn' ? 'সরাসরি নতুন উত্তোলন' : 'Direct Admin Payout'}</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
            <span>{language === 'bn' ? 'বাতিলকৃত আবেদন' : 'Rejected Requests'}</span>
            <span className="text-[11px] opacity-80">({rejectedRequests.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{language === 'bn' ? 'সদস্যদের অপেক্ষমাণ উত্তোলন আবেদনসমূহ' : 'Pending Member Withdrawal Requests'}</span>
            </h3>
            <span className="text-xs text-slate-500">
              {language === 'bn' ? `মোট ${pendingRequests.length}টি আবেদন অপেক্ষমাণ` : `${pendingRequests.length} pending`}
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-14 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3 opacity-80" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {language === 'bn' ? 'বর্তমানে কোনো অপেক্ষমাণ উত্তোলন আবেদন নেই' : 'No Pending Withdrawal Requests'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {language === 'bn'
                  ? 'কোনো সদস্য তাদের অ্যাকাউন্ট থেকে সঞ্চয় বা অর্জিত মুনাফা উত্তোলনের আবেদন জমা দিলে তা অবিলম্বে এখানে প্রদর্শিত হবে।'
                  : 'When members submit withdrawal requests for savings or profit, they will appear here for review and payment.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => {
                const memberRecord = members.find((m) => m.systemId === req.memberSystemId);
                const isProfit = req.source === 'profit';
                const memberProfitBal = memberRecord?.profitShareBalance || 0;
                const memberSavingsBal = memberRecord?.currentBalance || 0;

                return (
                  <div
                    key={req.withdrawalId}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-900/60 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    {/* Top Tag & ID */}
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>{language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</span>
                          </span>

                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                            isProfit
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          }`}>
                            {isProfit ? <Coins className="w-3 h-3" /> : <PiggyBank className="w-3 h-3" />}
                            <span>{isProfit ? (language === 'bn' ? 'সঞ্চিত মুনাফা' : 'Profit') : (language === 'bn' ? 'মূল সঞ্চয়' : 'Savings')}</span>
                          </span>
                        </div>

                        <span className="font-mono text-[11px] text-slate-400">
                          #{req.withdrawalId}
                        </span>
                      </div>

                      {/* Member Info & Requested Amount */}
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-base text-slate-900 dark:text-white">
                            <User className="w-4 h-4 text-purple-600" />
                            <span>{req.memberName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{req.memberPhone || memberRecord?.phone || 'নম্বর নেই'}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            {language === 'bn' ? 'আবেদনের পরিমাণ' : 'Requested'}
                          </span>
                          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                            ৳{req.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Current Member Balance Snapshot Box */}
                      <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'বর্তমান মুনাফা লভ্যাংশ:' : 'Profit Balance:'}</span>
                          <span className="font-bold text-purple-700 dark:text-purple-300 text-sm">
                            ৳{memberProfitBal.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'মোট সঞ্চয় ব্যালেন্স:' : 'Savings Balance:'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            ৳{memberSavingsBal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Desired Payout Method & Account */}
                      <div className="mt-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-1.5">
                            {req.paymentMethod === 'bkash' || req.paymentMethod === 'nagad' || req.paymentMethod === 'rocket' ? (
                              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                            ) : req.paymentMethod === 'bank' ? (
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Banknote className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span>{language === 'bn' ? 'প্রার্থিত পরিশোধ মাধ্যম:' : 'Payment Method:'}</span>
                          </span>
                          <span className="font-black text-blue-900 dark:text-blue-100 uppercase">
                            {req.paymentMethod}
                          </span>
                        </div>

                        {req.payoutAccount && (
                          <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 dark:border-blue-900/60">
                            <span className="text-[11px] text-blue-800 dark:text-blue-300">{language === 'bn' ? 'প্রাপক অ্যাকাউন্ট/মোবাইল:' : 'Account/Phone:'}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-950 dark:text-blue-100">{req.payoutAccount}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyAccount(req.payoutAccount!, req.withdrawalId)}
                                className="p-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 cursor-pointer"
                                title="কপি করুন"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {copiedId === req.withdrawalId && (
                                <span className="text-[10px] text-emerald-600 font-bold">কপি হয়েছে!</span>
                              )}
                            </div>
                          </div>
                        )}

                        {req.reason && (
                          <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-300 italic">
                            💬 &ldquo;{req.reason}&rdquo;
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 pt-0.5">
                          📅 {language === 'bn' ? 'আবেদনের তারিখ:' : 'Requested:'} {req.date} {req.requestedAt ? `(${new Date(req.requestedAt).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US')})` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReject(req)}
                        className="px-3 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'বাতিল' : 'Reject'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenApprove(req)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{language === 'bn' ? 'অনুমোদন ও পরিশোধ করুন' : 'Approve & Disburse'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPLETED REGISTER & VOUCHERS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'bn' ? 'সদস্যের নাম বা ফোন দিয়ে খুঁজুন...' : 'Search by member...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">{language === 'bn' ? 'উৎস ফিল্টার:' : 'Filter:'}</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setSourceFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    sourceFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'bn' ? 'সকল' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter('profit')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    sourceFilter === 'profit'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-purple-600 dark:text-purple-400 hover:text-purple-800'
                  }`}
                >
                  {language === 'bn' ? 'সঞ্চিত মুনাফা' : 'Profit'}
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter('savings')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    sourceFilter === 'savings'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-blue-600 dark:text-blue-400 hover:text-blue-800'
                  }`}
                >
                  {language === 'bn' ? 'মূল সঞ্চয়' : 'Savings'}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <th className="p-3.5">{language === 'bn' ? 'উত্তোলন আইডি' : 'ID'}</th>
                    <th className="p-3.5">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                    <th className="p-3.5">{language === 'bn' ? 'সদস্যের নাম' : 'Member'}</th>
                    <th className="p-3.5">{language === 'bn' ? 'তহবিল উৎস' : 'Source'}</th>
                    <th className="p-3.5 text-right">{language === 'bn' ? 'পরিশোধিত অর্থ' : 'Amount'}</th>
                    <th className="p-3.5 text-center">{language === 'bn' ? 'মাধ্যম' : 'Method'}</th>
                    <th className="p-3.5">{language === 'bn' ? 'প্রক্রিয়াকারী' : 'Processed By'}</th>
                    <th className="p-3.5 text-center">{language === 'bn' ? 'ডিজিটাল রসিদ' : 'Voucher'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {completedWithdrawals
                    .filter((w) => {
                      const matchesSearch =
                        w.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (w.memberPhone && w.memberPhone.includes(searchQuery));
                      const matchesSource =
                        sourceFilter === 'all'
                          ? true
                          : sourceFilter === 'profit'
                          ? w.source === 'profit'
                          : w.source !== 'profit';
                      return matchesSearch && matchesSource;
                    })
                    .map((w) => {
                      const isProfit = w.source === 'profit';
                      return (
                        <tr key={w.withdrawalId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3.5 font-mono text-slate-500">#{w.withdrawalId}</td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{w.date}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 dark:text-white block">{w.memberName}</span>
                            <span className="text-[10px] text-slate-400">{w.memberPhone || ''}</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isProfit
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              {isProfit ? (language === 'bn' ? '💎 সঞ্চিত মুনাফা' : 'Profit') : (language === 'bn' ? '🏦 মূল সঞ্চয়' : 'Savings')}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                            ৳{w.amount.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                              {w.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400 text-[11px]">
                            {w.processedBy || 'অ্যাডমিন'}
                          </td>
                          <td className="p-3.5 text-center">
                            {w.receiptId ? (
                              <button
                                type="button"
                                onClick={() => onViewReceipt(w.receiptId!)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <ReceiptText className="w-3 h-3 text-amber-600" />
                                <span>{language === 'bn' ? 'রশিদ দেখুন' : 'Receipt'}</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {completedWithdrawals.length === 0 && (
              <div className="py-12 text-center text-slate-400 p-6">
                <ReceiptText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold">{language === 'bn' ? 'এখনো কোনো উত্তোলন সম্পন্ন হয়নি' : 'No completed withdrawals yet'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT ADMIN WITHDRAWAL (NO PREVIOUS REQUEST NEEDED) */}
      {activeTab === 'direct' && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {language === 'bn' ? 'সরাসরি সদস্য উত্তোলন ও লভ্যাংশ পরিশোধ' : 'Direct Member Payout'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'যেকোনো সদস্যের সঞ্চয় বা অর্জিত মুনাফা থেকে তাৎক্ষণিক অর্থ পরিশোধ ও রসিদ তৈরি' : 'Instant payout from member savings or profit share'}
              </p>
            </div>
          </div>

          {directSuccess && (
            <div className="my-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{directSuccess}</span>
            </div>
          )}

          {directError && (
            <div className="my-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{directError}</span>
            </div>
          )}

          <form onSubmit={handleDirectSubmit} className="mt-4 space-y-4">
            {/* Member Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'bn' ? 'সদস্য নির্বাচন করুন:' : 'Select Member:'}
              </label>
              <select
                value={directMemberId}
                onChange={(e) => setDirectMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              >
                {members.map((m) => (
                  <option key={m.systemId} value={m.systemId}>
                    {m.name} ({m.phone}) - মুনাফা: ৳{(m.profitShareBalance || 0).toLocaleString()} | সঞ্চয়: ৳{(m.currentBalance || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Fund Source Choice */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {language === 'bn' ? 'উত্তোলনের তহবিল উৎস:' : 'Withdrawal Fund Source:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirectSource('profit')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    directSource === 'profit'
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-purple-700 dark:text-purple-300">
                    <Coins className="w-4 h-4" />
                    <span>{language === 'bn' ? 'সঞ্চিত মুনাফা (লভ্যাংশ)' : 'Accumulated Profit'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {language === 'bn' ? `বর্তমান স্থিতি: ৳${directMemberProfit.toLocaleString()} (১০০% উত্তোলনযোগ্য)` : `Available: ৳${directMemberProfit.toLocaleString()}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDirectSource('savings')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    directSource === 'savings'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-700 dark:text-blue-300">
                    <PiggyBank className="w-4 h-4" />
                    <span>{language === 'bn' ? 'মূল মাসিক সঞ্চয়' : 'Savings Capital'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {language === 'bn' ? `উত্তোলনযোগ্য: ৳${directMemberMaxSavings.toLocaleString()} (৭০% লিমিট)` : `Withdrawable: ৳${directMemberMaxSavings.toLocaleString()}`}
                  </span>
                </button>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">{language === 'bn' ? 'এই উৎস থেকে সর্বোচ্চ উত্তোলনযোগ্য' : 'Max Withdrawable'}</span>
                <span className="text-xl font-black text-purple-700 dark:text-purple-300">
                  ৳{directMaxAllowed.toLocaleString()}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <div>ক্যাশ তহবিল: ৳{metrics.cashBalance.toLocaleString()}</div>
                <div>ব্যাংক তহবিল: ৳{metrics.bankBalance.toLocaleString()}</div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'bn' ? 'উত্তোলনের পরিমাণ (৳):' : 'Amount (৳):'}
                </label>
                <span className="text-[11px] text-slate-400">
                  ১ থেকে ৳{directMaxAllowed.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min="1"
                max={directMaxAllowed}
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: 5000' : 'e.g. 5000'}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />

              {directMaxAllowed > 0 && (
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[25, 50, 75, 100].map((pct) => {
                    const calc = Math.floor((directMaxAllowed * pct) / 100);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDirectAmount(calc)}
                        className="py-1 px-1.5 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition-all cursor-pointer text-center"
                      >
                        {pct}% (৳{calc.toLocaleString()})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {language === 'bn' ? 'অর্থ পরিশোধের মাধ্যম:' : 'Payment Treasury Source:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirectMethod('cash')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    directMethod === 'cash'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold">{language === 'bn' ? 'নগদ ক্যাশ' : 'Cash'}</div>
                    <span className="text-[10px] text-slate-400">স্থিতি: ৳{metrics.cashBalance.toLocaleString()}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDirectMethod('bank')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    directMethod === 'bank'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-xs font-bold">{language === 'bn' ? 'ব্যাংক একাউন্ট' : 'Bank'}</div>
                    <span className="text-[10px] text-slate-400">স্থিতি: ৳{metrics.bankBalance.toLocaleString()}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'উত্তোলনের কারণ বা বিবরণ:' : 'Purpose / Note:'}
              </label>
              <input
                type="text"
                value={directReason}
                onChange={(e) => setDirectReason(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: জরুরি প্রয়োজন, উৎসব খরচ' : 'e.g. Festival need, Medical'}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={directMaxAllowed <= 0}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                  directMaxAllowed > 0
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer shadow-purple-600/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'bn' ? 'উত্তোলন প্রদান সম্পন্ন করুন ও রসিদ তৈরি করুন' : 'Confirm Payout & Issue Voucher'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: REJECTED REQUESTS */}
      {activeTab === 'rejected' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600" />
              <span>{language === 'bn' ? 'বাতিলকৃত উত্তোলন আবেদনসমূহের রেকর্ড' : 'Rejected Withdrawal Requests Record'}</span>
            </h3>
          </div>

          {rejectedRequests.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-slate-400">
              <p className="text-sm font-semibold">{language === 'bn' ? 'কোনো বাতিলকৃত আবেদন নেই' : 'No rejected requests'}</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <th className="p-3.5">{language === 'bn' ? 'আইডি' : 'ID'}</th>
                    <th className="p-3.5">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                    <th className="p-3.5">{language === 'bn' ? 'সদস্য' : 'Member'}</th>
                    <th className="p-3.5">{language === 'bn' ? 'উৎস' : 'Source'}</th>
                    <th className="p-3.5 text-right">{language === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}</th>
                    <th className="p-3.5">{language === 'bn' ? 'বাতিলের কারণ' : 'Rejection Reason'}</th>
                    <th className="p-3.5">{language === 'bn' ? 'বাতিলকারী' : 'Rejected By'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {rejectedRequests.map((r) => (
                    <tr key={r.withdrawalId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-mono text-slate-500">#{r.withdrawalId}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{r.date}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{r.memberName}</td>
                      <td className="p-3.5 text-[11px]">{r.source === 'profit' ? 'সঞ্চিত মুনাফা' : 'মূল সঞ্চয়'}</td>
                      <td className="p-3.5 text-right font-black text-slate-500">৳{r.amount.toLocaleString()}</td>
                      <td className="p-3.5 text-rose-600 dark:text-rose-400 font-medium">{r.rejectionReason || 'প্রশাসনিক সিদ্ধান্তে বাতিল'}</td>
                      <td className="p-3.5 text-slate-500 text-[11px]">{r.processedBy || 'অ্যাডমিন'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: APPROVE & DISBURSE WITHDRAWAL */}
      {approvingWithdrawal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === 'bn' ? 'উত্তোলন অনুমোদন ও অর্থ পরিশোধ' : 'Approve & Disburse'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingWithdrawal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {approvalError && (
              <div className="my-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{approvalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmApproval} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'সদস্যের নাম:' : 'Member:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{approvingWithdrawal.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'তহবিলের উৎস:' : 'Fund Source:'}</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    {approvingWithdrawal.source === 'profit' ? '💎 সঞ্চিত মুনাফা (লভ্যাংশ)' : '🏦 মূল সঞ্চয় তহবিল'}
                  </span>
                </div>
                {approvingWithdrawal.payoutAccount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{language === 'bn' ? 'প্রাপক অ্যাকাউন্ট:' : 'Target Account:'}</span>
                    <span className="font-mono font-bold text-blue-600">{approvingWithdrawal.payoutAccount}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{language === 'bn' ? 'পরিশোধের পরিমাণ:' : 'Payable Amount:'}</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-base">
                    ৳{approvingWithdrawal.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payout Treasury Source */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {language === 'bn' ? 'সমিতির পরিশোধিত কোষাগার:' : 'Disburse From Treasury:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalMethod('cash')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      approvalMethod === 'cash'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-xs font-bold">{language === 'bn' ? 'নগদ ক্যাশ' : 'Cash'}</div>
                      <span className="text-[10px] text-slate-400">স্থিতি: ৳{metrics.cashBalance.toLocaleString()}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApprovalMethod('bank')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      approvalMethod === 'bank'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="text-xs font-bold">{language === 'bn' ? 'ব্যাংক একাউন্ট' : 'Bank'}</div>
                      <span className="text-[10px] text-slate-400">স্থিতি: ৳{metrics.bankBalance.toLocaleString()}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'পরিশোধ সংক্রান্ত নোট (ঐচ্ছিক):' : 'Disbursement Note (Optional):'}
                </label>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: বিকাশে পাঠানো হয়েছে / চেকের মাধ্যমে' : 'e.g. Sent via bKash / Cheque'}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingWithdrawal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'bn' ? 'নিশ্চিত ও পরিশোধ করুন' : 'Confirm & Disburse'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT WITHDRAWAL */}
      {rejectingWithdrawal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600">
                <X className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === 'bn' ? 'উত্তোলন আবেদন বাতিল' : 'Reject Withdrawal Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingWithdrawal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rejectionError && (
              <div className="my-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rejectionError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRejection} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                <div>
                  <span className="text-slate-400">{language === 'bn' ? 'আবেদনকারী:' : 'Member:'} </span>
                  <span className="font-bold text-slate-900 dark:text-white">{rejectingWithdrawal.memberName}</span>
                </div>
                <div>
                  <span className="text-slate-400">{language === 'bn' ? 'টাকার পরিমাণ:' : 'Amount:'} </span>
                  <span className="font-bold text-rose-600">৳{rejectingWithdrawal.amount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {language === 'bn' ? 'বাতিলের কারণ লিখুন (সদস্যকে জানানো হবে):' : 'Rejection Reason (will be shown to member):'}
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: অপর্যাপ্ত রিজার্ভ তহবিল / ভুল অ্যাকাউন্ট নম্বর' : 'e.g. Insufficient reserves / invalid account'}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingWithdrawal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'bn' ? 'ফিরে যান' : 'Back'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>{language === 'bn' ? 'বাতিল নিশ্চিত করুন' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
