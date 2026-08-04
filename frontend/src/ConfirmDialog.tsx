import { Modal } from './Modal';
import { Msg, useMsg } from '@/shared/i18n';

interface ConfirmDialogProps {
  /** ダイアログのタイトル */
  title: string;
  /** 本文（改行は <br> ではなく whitespace-pre-wrap で表示） */
  description: string;
  /** 確認ボタンのラベル（デフォルト: 確認） */
  confirmLabel?: string;
  /** キャンセルボタンのラベル（デフォルト: キャンセル） */
  cancelLabel?: string;
  /** 'danger': 赤い確認ボタン / 'default': プライマリカラー */
  variant?: 'danger' | 'default';
  /** 処理中フラグ（true のとき確認ボタンを disabled にする） */
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const t = useMsg();

  const confirmClass =
    variant === 'danger'
      ? 'rounded-admin bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50'
      : 'nc-btn-primary';

  return (
    <Modal size="sm" onClose={onClose}>
      <div className="px-6 py-5">
        {/* タイトル */}
        <h3 className="text-base font-semibold text-fg">{title}</h3>

        {/* 本文 */}
        <p className="mt-2 whitespace-pre-wrap text-sm text-fg-muted">{description}</p>

        {/* ボタン行 */}
        <div className="mt-5 flex justify-end gap-3">
          <button className="nc-btn text-sm" type="button" onClick={onClose} disabled={isConfirming}>
            {cancelLabel ?? t(Msg.common.cancel)}
          </button>
          <button
            className={confirmClass}
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {confirmLabel ?? title}
          </button>
        </div>
      </div>
    </Modal>
  );
}
