import type { ChatSessionSummary } from '@/shared/api';

export function formatClientIp(ip: string | null | undefined): string {
  if (ip === null || ip === undefined || ip.trim() === '') {
    return '—';
  }

  if (ip.includes(':')) {
    const segment = ip.split(':')[0];

    return segment === '' ? ip : `${segment}:…`;
  }

  return ip;
}

export function hasSessionMetadata(session: ChatSessionSummary): boolean {
  return (
    (session.user_agent !== null && session.user_agent.trim() !== '') ||
    (session.referer !== null && session.referer.trim() !== '')
  );
}
