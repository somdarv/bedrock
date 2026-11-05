/**
 * How an online signature reads on a contract. The time zone is fixed, so the page and the PDF
 * say the same thing wherever the signer is, and the server and the browser agree.
 */
const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Accra",
});

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Africa/Accra",
});

/** 5 November 2026 */
export function acceptedDay(iso: string): string {
  return DAY.format(new Date(iso));
}

/** 5 November 2026, 14:32 GMT */
export function acceptedWhen(iso: string): string {
  const at = new Date(iso);
  return `${DAY.format(at)}, ${TIME.format(at)} GMT`;
}

/** 233241234567 reads as +233 24 123 4567. Any other country's number keeps its digits. */
export function phoneWords(digits: string): string {
  const ghana = digits.match(/^233(\d{2})(\d{3})(\d{4})$/);
  return ghana ? `+233 ${ghana[1]} ${ghana[2]} ${ghana[3]}` : `+${digits}`;
}
