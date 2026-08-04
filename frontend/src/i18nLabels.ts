import type { ChatMessageListItem, SourceListItem } from '@/shared/api';
import { Msg, type MsgKey } from '@/shared/i18n';

export const SOURCE_STATUS_MSG: Record<SourceListItem['status'], MsgKey> = {
  pending: Msg.sourceStatus.pending,
  processing: Msg.sourceStatus.processing,
  ready: Msg.sourceStatus.ready,
  failed: Msg.sourceStatus.failed,
};

export const SOURCE_TYPE_MSG: Record<SourceListItem['source_type'], MsgKey> = {
  csv: Msg.sourceType.csv,
  pdf: Msg.sourceType.pdf,
  text: Msg.sourceType.text,
};

export const ROLE_MSG: Record<ChatMessageListItem['role'], MsgKey> = {
  user: Msg.role.user,
  assistant: Msg.role.assistant,
};
