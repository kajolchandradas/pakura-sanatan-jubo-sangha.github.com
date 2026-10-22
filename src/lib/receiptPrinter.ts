import { Receipt, AppSettings, Language } from '../types';

/**
 * Converts numbers into Bengali words (টাকা মাত্র)
 */
export function amountToBengaliWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'শূন্য টাকা মাত্র';

  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teens = [
    'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ',
  ];
  const tens = [
    '', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই',
  ];

  // Specific 2-digit mapping for Bengali numbers 1-99
  const bengaliNumbers: Record<number, string> = {
    1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়', 10: 'দশ',
    11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ', 15: 'পনেরো', 16: 'ষোলো', 17: 'সতেরো', 18: 'আঠারো', 19: 'উনিশ', 20: 'বিশ',
    21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আঠাশ', 29: 'উনত্রিশ', 30: 'ত্রিশ',
    31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ', 40: 'চল্লিশ',
    41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ', 50: 'পঞ্চাশ',
    51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'উনষাট', 60: 'ষাট',
    61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর', 70: 'সত্তর',
    71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'উনাশি', 80: 'আশি',
    81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'আটাশি', 89: 'ঊননব্বই', 90: 'নব্বই',
    91: 'একানব্বই', 92: 'বিরানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
  };

  const convertTwoDigits = (n: number): string => {
    if (n === 0) return '';
    if (bengaliNumbers[n]) return bengaliNumbers[n];
    return String(n);
  };

  let intPart = Math.floor(num);
  let words = '';

  // Crores (কোটি)
  if (intPart >= 10000000) {
    const crore = Math.floor(intPart / 10000000);
    words += convertTwoDigits(crore) + ' কোটি ';
    intPart %= 10000000;
  }

  // Lakhs (লাখ)
  if (intPart >= 100000) {
    const lakh = Math.floor(intPart / 100000);
    words += convertTwoDigits(lakh) + ' লাখ ';
    intPart %= 100000;
  }

  // Thousands (হাজার)
  if (intPart >= 1000) {
    const thousand = Math.floor(intPart / 1000);
    words += convertTwoDigits(thousand) + ' হাজার ';
    intPart %= 1000;
  }

  // Hundreds (শত)
  if (intPart >= 100) {
    const hundred = Math.floor(intPart / 100);
    words += (hundred === 1 ? 'একশত ' : convertTwoDigits(hundred) + ' শত ');
    intPart %= 100;
  }

  // Remaining 1-99
  if (intPart > 0) {
    words += convertTwoDigits(intPart) + ' ';
  }

  return words.trim() + ' টাকা মাত্র';
}

/**
 * Converts numbers into English words
 */
export function amountToEnglishWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'Zero Taka Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : ' ');
      }
    }
    return str;
  };

  return inWords(Math.floor(num)).trim() + ' Taka Only';
}

/**
 * Generates an isolated, ultra-clean HTML page for printing an official Money Receipt.
 */
export function generateReceiptHTML(
  receipt: Receipt,
  settings?: Partial<AppSettings>,
  language: Language = 'bn'
): string {
  const isBn = language === 'bn';
  const orgName = settings?.societyName || 'পাকুড়া সনাতন যুব সংঘ';
  const subtitle = settings?.societySubtitle || 'সততা, একতা ও জনকল্যাণ • স্থাপিত: ২০২৫ খ্রি.';
  const recipientName = receipt.recipientName || receipt.name || 'সদস্য';
  const amountWords = isBn
    ? amountToBengaliWords(receipt.amount)
    : amountToEnglishWords(receipt.amount);

  const getTypeName = (type?: string) => {
    switch (type) {
      case 'contribution':
        return isBn ? 'মাসিক সঞ্চয় আমানত' : 'Monthly Savings Contribution';
      case 'loan_issue':
        return isBn ? 'ঋণ প্রদান / বিতরণ' : 'Loan Disbursement';
      case 'loan_payment':
        return isBn ? 'ঋণের কিস্তি / মুনাফা আদায়' : 'Loan Repayment';
      case 'income':
        return isBn ? 'সাধারণ আয় / অনুদান' : 'Income / Donation';
      default:
        return receipt.purpose || (isBn ? 'সাধারণ লেনদেন' : 'Transaction');
    }
  };

  const paymentMethodLabel =
    receipt.paymentMethod === 'cash'
      ? (isBn ? 'নগদ (Cash)' : 'Cash')
      : (isBn ? 'ব্যাংক হিসাব (Bank Transfer)' : 'Bank Transfer');

  return `<!DOCTYPE html>
<html lang="${isBn ? 'bn' : 'en'}">
<head>
  <meta charset="UTF-8">
  <title>Receipt-${receipt.receiptId} - ${orgName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Hind Siliguri', 'Plus Jakarta Sans', sans-serif;
      background: #ffffff;
      color: #0f172a;
      line-height: 1.5;
      padding: 20px;
    }

    .receipt-container {
      max-width: 680px;
      margin: 0 auto;
      border: 2px solid #b45309;
      border-radius: 16px;
      padding: 28px 32px;
      background: #ffffff;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    /* Inner watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-size: 72px;
      font-weight: 900;
      color: rgba(16, 185, 129, 0.07);
      text-transform: uppercase;
      letter-spacing: 6px;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
      border: 4px dashed rgba(16, 185, 129, 0.12);
      padding: 10px 40px;
      border-radius: 12px;
    }

    .header {
      text-align: center;
      padding-bottom: 16px;
      border-bottom: 2px dashed #f59e0b;
    }

    .header-invocation {
      font-size: 13px;
      font-weight: 700;
      color: #b45309;
      letter-spacing: 1px;
    }

    .header-title {
      font-size: 24px;
      font-weight: 800;
      color: #1e293b;
      margin-top: 4px;
    }

    .header-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    .voucher-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 16px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      color: #92400e;
      text-transform: uppercase;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }

    .receipt-id {
      font-family: monospace;
      font-weight: 800;
      color: #b45309;
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .details-table {
      width: 100%;
      margin-top: 16px;
      border-collapse: collapse;
      font-size: 13.5px;
    }

    .details-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
    }

    .details-table td.label {
      width: 38%;
      color: #64748b;
      font-weight: 600;
    }

    .details-table td.value {
      width: 62%;
      color: #0f172a;
      font-weight: 700;
    }

    .amount-box {
      margin-top: 20px;
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .amount-label {
      font-size: 13px;
      font-weight: 700;
      color: #166534;
    }

    .amount-value {
      font-size: 26px;
      font-weight: 900;
      color: #15803d;
    }

    .words-box {
      margin-top: 12px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 12.5px;
      color: #334155;
    }

    .words-box strong {
      color: #0f172a;
    }

    .footer-signatures {
      margin-top: 50px;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      text-align: center;
    }

    .sign-block {
      width: 170px;
    }

    .sign-line {
      border-top: 1.5px solid #64748b;
      padding-top: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }

    .sign-sub {
      font-size: 10.5px;
      color: #94a3b8;
    }

    .security-notice {
      margin-top: 30px;
      text-align: center;
      font-size: 10.5px;
      color: #94a3b8;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
    }

    @media print {
      body {
        padding: 0;
        background: #ffffff !important;
      }
      .receipt-container {
        box-shadow: none !important;
        border: 2px solid #333333 !important;
        margin: 0 auto;
        page-break-inside: avoid;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="watermark">${isBn ? 'পরিশোধিত' : 'PAID'}</div>

    <!-- Header -->
    <div class="header">
      <div class="header-invocation">🕉️ ওঁ শ্রী শ্রী গুরুবে নমঃ</div>
      <div class="header-title">${orgName}</div>
      <div class="header-subtitle">${subtitle}</div>
      <div class="voucher-badge">${isBn ? 'অফিসিয়াল ডিজিটাল মানি রিসিট' : 'Official Money Receipt Voucher'}</div>
    </div>

    <!-- Metadata -->
    <div class="meta-row">
      <div>
        <span>${isBn ? 'রশিদ নম্বর:' : 'Receipt No:'}</span>
        <span class="receipt-id">#${receipt.receiptId}</span>
      </div>
      <div>
        <span>${isBn ? 'জমার তারিখ:' : 'Date:'}</span>
        <strong>${receipt.date}</strong>
      </div>
    </div>

    <!-- Details Table -->
    <table class="details-table">
      <tr>
        <td class="label">${isBn ? 'প্রদানকারী / সদস্যের নাম:' : 'Received From / Name:'}</td>
        <td class="value">${recipientName}</td>
      </tr>
      ${receipt.phone ? `
      <tr>
        <td class="label">${isBn ? 'মোবাইল নম্বর:' : 'Phone Number:'}</td>
        <td class="value">${receipt.phone}</td>
      </tr>` : ''}
      <tr>
        <td class="label">${isBn ? 'লেনদেনের খাত / উদ্দেশ্য:' : 'Purpose / Category:'}</td>
        <td class="value">${getTypeName(receipt.type)}</td>
      </tr>
      ${receipt.purpose && receipt.purpose !== getTypeName(receipt.type) ? `
      <tr>
        <td class="label">${isBn ? 'বিস্তারিত বিবরণ:' : 'Details / Remarks:'}</td>
        <td class="value">${receipt.purpose}</td>
      </tr>` : ''}
      <tr>
        <td class="label">${isBn ? 'পরিশোধের মাধ্যম:' : 'Payment Method:'}</td>
        <td class="value">${paymentMethodLabel}</td>
      </tr>
      ${receipt.transactionId ? `
      <tr>
        <td class="label">${isBn ? 'লেজার ট্রানজেকশন আইডি:' : 'Ledger Ref ID:'}</td>
        <td class="value" style="font-family: monospace;">#${receipt.transactionId}</td>
      </tr>` : ''}
    </table>

    <!-- Amount Highlight Box -->
    <div class="amount-box">
      <div class="amount-label">${isBn ? 'গৃহীত মোট অর্থের পরিমাণ:' : 'Total Amount Paid:'}</div>
      <div class="amount-value">৳${receipt.amount.toLocaleString('en-IN')}</div>
    </div>

    <!-- Words Box -->
    <div class="words-box">
      <strong>${isBn ? 'কথায়:' : 'In Words:'}</strong> ${amountWords}
    </div>

    <!-- Signatures -->
    <div class="footer-signatures">
      <div class="sign-block">
        <div class="sign-line">${receipt.issuedBy || receipt.receivedBy || (isBn ? 'কোষাধ্যক্ষ' : 'Treasurer')}</div>
        <div class="sign-sub">${isBn ? 'আদায়কারীর স্বাক্ষর' : 'Collector Signature'}</div>
      </div>
      <div class="sign-block">
        <div class="sign-line">${isBn ? 'যুগ্ম সাধারণ সম্পাদক / সভাপতি' : 'President / Secretary'}</div>
        <div class="sign-sub">${isBn ? 'যাচাইকারী স্বাক্ষর' : 'Verified By'}</div>
      </div>
      <div class="sign-block">
        <div class="sign-line">${recipientName}</div>
        <div class="sign-sub">${isBn ? 'জমাকারীর স্বাক্ষর' : 'Depositor Signature'}</div>
      </div>
    </div>

    <!-- Security & Verification Footnote -->
    <div class="security-notice">
      ${isBn
        ? '✓ এটি একটি কম্পিউটার জেনারেটেড ডিজিটাল সত্যায়িত রশিদ • পাকুড়া সনাতন যুব সংঘের কেন্দ্রীয় লেজারে নিবন্ধিত'
        : '✓ Computer-generated official digital receipt • Authenticated in central society ledger'}
    </div>
  </div>

  <script>
    function triggerReceiptPrint() {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.warn('Receipt print auto-trigger failed:', e);
      }
    }
    if (document.readyState === 'complete') {
      setTimeout(triggerReceiptPrint, 200);
    } else {
      window.addEventListener('load', function() {
        setTimeout(triggerReceiptPrint, 200);
      });
    }
  </script>
</body>
</html>`;
}

/**
 * Bulletproof receipt printing using a dedicated hidden iframe.
 * If iframe printing fails or is restricted, falls back gracefully to window.print().
 */
export function printReceiptDirectly(
  receipt: Receipt,
  settings?: Partial<AppSettings>,
  language: Language = 'bn'
): void {
  try {
    const html = generateReceiptHTML(receipt, settings, language);

    // Create an isolated iframe rendered offscreen with actual dimensions
    const iframeId = 'receipt-print-iframe';
    const existingIframe = document.getElementById(iframeId);
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    // CRITICAL: Do NOT use visibility: hidden or width: 0, height: 0,
    // which browsers suppress from printing. Instead use off-screen positioning.
    iframe.style.position = 'fixed';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      let hasPrinted = false;
      const doPrint = () => {
        if (hasPrinted) return;
        hasPrinted = true;
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } else {
            window.print();
          }
        } catch (err) {
          console.warn('Iframe print failed, falling back to window.print():', err);
          window.print();
        }
      };

      // Ensure cleanup after print
      if (iframe.contentWindow) {
        iframe.contentWindow.onafterprint = () => {
          setTimeout(() => {
            const el = document.getElementById(iframeId);
            if (el) el.remove();
          }, 1000);
        };
      }

      // Allow fonts and styles to compute, then print
      setTimeout(doPrint, 300);
      return;
    }
  } catch (err) {
    console.warn('Iframe print setup failed, falling back to window.print():', err);
  }

  // Graceful fallback for all environments
  window.print();
}
