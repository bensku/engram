const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'short',
});

export function formatDate(timestamp: number): string {
  return dateFormat.format(new Date(timestamp));
}
