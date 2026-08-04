import { useEffect, useRef } from 'react';

/**
 * size:
 *   'sm' — 確認ダイアログ等の小モーダル（max-w-md）
 *   'lg' — ドキュメントパネル等（max-w-5xl）
 *   'xl' — 会話ログ等（max-w-6xl）
 */
type ModalSize = 'sm' | 'lg' | 'xl';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'w-full max-w-md',
  lg: 'w-full max-w-5xl',
  xl: 'w-full max-w-6xl',
};

interface ModalProps {
  size?: ModalSize;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ size = 'sm', onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click handled by dialog cancel
    <dialog
      ref={dialogRef}
      className={`m-auto ${SIZE_CLASS[size]} rounded-admin bg-surface p-0 shadow-xl backdrop:bg-black/40`}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}
