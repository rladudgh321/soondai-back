import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs?.extend(utc);
dayjs?.extend(timezone);

export function convertToKoreanTimezone(date: Date): string {
  console.log('date', date);
  return dayjs(date).tz('Asia/Seoul').format();
}
