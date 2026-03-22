import { getDeviceLocaleTag, t } from '@/i18n';

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(getDeviceLocaleTag(), {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) {
    return `${hours}${t('activities.hour')}`;
  }
  if (hours === 0) {
    return `${rest}${t('activities.minute')}`;
  }
  return `${hours}${t('activities.hour')} ${rest}${t('activities.minute')}`;
}
