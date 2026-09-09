/**
 * Date utility tailored for Asia/Jakarta (UTC+7) business date handling
 */

export function getTodayJakarta(): string {
  // Format current date in Asia/Jakarta as YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Returns "YYYY-MM-DD"
}

export function getCurrentYearMonthJakarta(): string {
  const today = getTodayJakarta();
  return today.substring(0, 7); // Returns "YYYY-MM"
}

export function formatDateIndonesian(dateStr: string, options: { withDay?: boolean; shortMonth?: boolean } = {}): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const monthNamesFull = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const monthName = options.shortMonth ? monthNamesShort[month - 1] : monthNamesFull[month - 1];

  if (options.withDay) {
    const d = new Date(year, month - 1, day);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[d.getDay()];
    return `${dayName}, ${day} ${monthName} ${year}`;
  }

  return `${day} ${monthName} ${year}`;
}

export function formatMonthYearIndonesian(yearMonthStr: string): string {
  if (!yearMonthStr) return '-';
  const [yearStr, monthStr] = yearMonthStr.split('-');
  const month = parseInt(monthStr, 10);
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${monthNames[month - 1] || monthStr} ${yearStr}`;
}
