/**
 * Resolves the correct effective Date object for a Lost or Found item based on its status and report type.
 * @param {Object} item - The Lost or Found item document.
 * @returns {Date|null} - The resolved Date object or null if unavailable/invalid.
 */
export const getReportEffectiveDate = (item) => {
  if (!item) return null;
  const isLost = item.reportType === 'Lost' || item.reporterRollNo === 'self_lost';
  const status = (item.status || 'pending').toLowerCase();
  
  let rawDate;
  if (!isLost) {
    // Found Item
    if (status === 'verified' || status === 'claimed') {
      rawDate = item.verifiedAt;
    } else {
      rawDate = item.reportedDate || item.createdAt;
    }
  } else {
    // Lost Item
    rawDate = item.createdAt || item.dateLost || item.reportedDate;
  }
  
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
};

/**
 * Formats the effective report date using consistent local formatting.
 * Supports passing either the item object or a raw date value.
 * @param {Object|string|Date} itemOrDate - The item object or a raw date string/Date.
 * @param {Object} options - Date formatting options.
 * @returns {string} - Formatted date string or "Date unavailable".
 */
export const formatReportDate = (itemOrDate, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!itemOrDate) return "Date unavailable";
  
  let dateObj;
  const isItem = typeof itemOrDate === 'object' && itemOrDate !== null && ('itemName' in itemOrDate || 'status' in itemOrDate || 'reportType' in itemOrDate || 'reporterRollNo' in itemOrDate);
  
  if (isItem) {
    dateObj = getReportEffectiveDate(itemOrDate);
  } else {
    dateObj = new Date(itemOrDate);
  }
  
  if (!dateObj || isNaN(dateObj.getTime())) return "Date unavailable";
  return dateObj.toLocaleDateString(undefined, options);
};

/**
 * Resolves the status badge configuration for a report item.
 * @param {Object} item - The report item.
 * @returns {Object} - Status badge with text, bg, dot color, and icon.
 */
export const getStatusBadge = (item) => {
  if (!item) return { text: 'Unknown', bg: 'bg-slate-50 text-slate-500', dot: 'bg-slate-400', icon: '❓' };
  
  const isLost = item.reportType === 'Lost' || item.reporterRollNo === 'self_lost';
  const status = (item.status || 'pending').toLowerCase();
  
  if (isLost) {
    if (status === 'claimed') {
      return {
        text: 'Claimed',
        bg: 'bg-green-50 border-green-200 text-green-700',
        dot: 'bg-green-500',
        icon: '✅'
      };
    }
    if (status === 'verified') {
      return {
        text: 'Ready for Collection',
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        dot: 'bg-indigo-500',
        icon: '✨'
      };
    }
    if (status === 'match-found') {
      return {
        text: '✨ Match Found',
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        dot: 'bg-indigo-500',
        icon: '✨'
      };
    }
    return {
      text: 'Pending Verification',
      bg: 'bg-amber-50 border-amber-250 text-amber-700',
      dot: 'bg-amber-500',
      icon: '🟡'
    };
  } else {
    // Found Item
    if (status === 'verified' || status === 'claimed') {
      return {
        text: 'Handed Over to Security Office',
        bg: 'bg-emerald-50 border-emerald-250 text-emerald-700',
        dot: 'bg-emerald-500',
        icon: '🟢'
      };
    }
    return {
      text: 'Pending Handover',
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      dot: 'bg-amber-500',
      icon: '🟡'
    };
  }
};
