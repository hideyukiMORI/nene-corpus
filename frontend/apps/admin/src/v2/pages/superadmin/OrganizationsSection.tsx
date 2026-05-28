/**
 * OrganizationsSection — 組織管理 CRUD UI (#279)
 * superadmin のみに表示される。
 */
import { FormEvent, useEffect, useState } from 'react';
import {
  createOrganization,
  deleteOrganization,
  listOrganizations,
  updateOrganization,
} from '@nene-corpus/api-client/organizations';
import type { OrganizationItem } from '@nene-corpus/api-client/organizations';
import { ConfirmDialog } from '../../../ConfirmDialog';
import { adminApiBase } from '../../../config';

// ─── shared primitives ────────────────────────────────────────────────────────

interface FormPanelProps {
  title: string;
  titleEn: string;
  lead: React.ReactNode;
  children: React.ReactNode;
}

function FormPanel({ title, titleEn, lead, children }: FormPanelProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--hair)',
      borderRadius: 8,
      padding: '22px 24px 24px',
      marginBottom: 14,
    }}>
      <h3 style={{
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--ink-strong)',
        marginBottom: 4,
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
      }}>
        {title}
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--ink-faint)',
          letterSpacing: '0.04em',
        }}>
          {titleEn}
        </span>
      </h3>
      <div style={{
        fontSize: 13,
        color: 'var(--ink-muted)',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid var(--hair)',
      }}>
        {lead}
      </div>
      {children}
    </div>
  );
}

function StatusMsg({ type, text }: { type: 'error' | 'success'; text: string }) {
  return (
    <p style={{
      fontSize: 12.5,
      color: type === 'error' ? 'var(--danger-text)' : 'var(--success-fg)',
      marginTop: 8,
    }}>
      {text}
    </p>
  );
}

const PLANS = ['free', 'pro', 'enterprise'];

// ─── Create form ──────────────────────────────────────────────────────────────

interface CreateFormProps {
  token: string;
  onCreated: (org: OrganizationItem) => void;
  onClose: () => void;
}

function CreateForm({ token, onCreated, onClose }: CreateFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState('free');
  const [customDomain, setCustomDomain] = useState('');
  const [externalId, setExternalId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await createOrganization(token, {
        name: name.trim(),
        slug: slug.trim(),
        plan,
        custom_domain: customDomain.trim() !== '' ? customDomain.trim() : null,
        external_id: externalId.trim() !== '' ? externalId.trim() : null,
      }, adminApiBase);
      onCreated(created);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : '作成に失敗しました。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: 'var(--bg-soft)',
      border: '1px solid var(--hair)',
      borderRadius: 8,
      padding: '18px 20px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-strong)' }}>
          新しい組織を追加 // new organization
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: 11, padding: '2px 8px' }}
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label" htmlFor="new-org-name">
              名前 <span className="en">name</span>
              <span style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>*</span>
            </label>
            <input
              id="new-org-name"
              className="field-input"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); }}
              placeholder="Acme Corp"
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="new-org-slug">
              スラッグ <span className="en">slug</span>
              <span style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>*</span>
            </label>
            <input
              id="new-org-slug"
              className="field-input"
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); }}
              placeholder="acme"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="小文字英数字とハイフンのみ"
              required
            />
            <div className="field-hint">小文字英数字とハイフンのみ</div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="new-org-plan">
              プラン <span className="en">plan</span>
            </label>
            <select
              id="new-org-plan"
              className="field-select"
              value={plan}
              onChange={(e) => { setPlan(e.target.value); }}
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="new-org-domain">
              カスタムドメイン <span className="en">custom domain</span>
            </label>
            <input
              id="new-org-domain"
              className="field-input"
              type="text"
              value={customDomain}
              onChange={(e) => { setCustomDomain(e.target.value); }}
              placeholder="example.com"
            />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field-label" htmlFor="new-org-external-id">
              外部 ID <span className="en">external id</span>
            </label>
            <input
              id="new-org-external-id"
              className="field-input"
              type="text"
              value={externalId}
              onChange={(e) => { setExternalId(e.target.value); }}
              placeholder="optional"
            />
          </div>
        </div>
        {error !== null && <StatusMsg type="error" text={error} />}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="btn btn-ghost" type="button" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? '追加中…' : '組織を追加'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

interface EditFormProps {
  token: string;
  org: OrganizationItem;
  onUpdated: (org: OrganizationItem) => void;
  onClose: () => void;
}

function EditForm({ token, org, onUpdated, onClose }: EditFormProps) {
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [plan, setPlan] = useState(org.plan);
  const [customDomain, setCustomDomain] = useState(org.custom_domain ?? '');
  const [externalId, setExternalId] = useState(org.external_id ?? '');
  const [isActive, setIsActive] = useState(org.is_active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateOrganization(token, org.id, {
        name: name.trim(),
        slug: slug.trim(),
        plan,
        custom_domain: customDomain.trim() !== '' ? customDomain.trim() : null,
        external_id: externalId.trim() !== '' ? externalId.trim() : null,
        is_active: isActive,
      }, adminApiBase);
      setSuccess('保存しました。');
      onUpdated(updated);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: 'var(--bg-soft)',
      border: '1.5px solid var(--primary-soft)',
      borderRadius: 8,
      padding: '18px 20px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-strong)' }}>
          編集 // edit · <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--ink-faint)' }}>id:{org.id}</span>
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: 11, padding: '2px 8px' }}
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label" htmlFor={`edit-org-name-${String(org.id)}`}>
              名前 <span className="en">name</span>
              <span style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>*</span>
            </label>
            <input
              id={`edit-org-name-${String(org.id)}`}
              className="field-input"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); }}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={`edit-org-slug-${String(org.id)}`}>
              スラッグ <span className="en">slug</span>
              <span style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>*</span>
            </label>
            <input
              id={`edit-org-slug-${String(org.id)}`}
              className="field-input"
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); }}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="小文字英数字とハイフンのみ"
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={`edit-org-plan-${String(org.id)}`}>
              プラン <span className="en">plan</span>
            </label>
            <select
              id={`edit-org-plan-${String(org.id)}`}
              className="field-select"
              value={plan}
              onChange={(e) => { setPlan(e.target.value); }}
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor={`edit-org-domain-${String(org.id)}`}>
              カスタムドメイン <span className="en">custom domain</span>
            </label>
            <input
              id={`edit-org-domain-${String(org.id)}`}
              className="field-input"
              type="text"
              value={customDomain}
              onChange={(e) => { setCustomDomain(e.target.value); }}
              placeholder="example.com"
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={`edit-org-external-id-${String(org.id)}`}>
              外部 ID <span className="en">external id</span>
            </label>
            <input
              id={`edit-org-external-id-${String(org.id)}`}
              className="field-input"
              type="text"
              value={externalId}
              onChange={(e) => { setExternalId(e.target.value); }}
              placeholder="optional"
            />
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
            <input
              id={`edit-org-active-${String(org.id)}`}
              type="checkbox"
              checked={isActive}
              onChange={(e) => { setIsActive(e.target.checked); }}
              style={{ accentColor: 'var(--primary)' }}
            />
            <label
              htmlFor={`edit-org-active-${String(org.id)}`}
              style={{ fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}
            >
              有効 // active
            </label>
          </div>
        </div>
        {error !== null && <StatusMsg type="error" text={error} />}
        {success !== null && <StatusMsg type="success" text={success} />}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="btn btn-ghost" type="button" onClick={onClose}>閉じる</button>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

interface OrganizationsSectionProps {
  token: string;
}

export function OrganizationsSection({ token }: OrganizationsSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrganizationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    listOrganizations(token, adminApiBase)
      .then((data) => {
        if (!cancelled) {
          setOrganizations(data.organizations);
          setTotal(data.total);
          setIsLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setLoadError(cause instanceof Error ? cause.message : '組織一覧の読み込みに失敗しました。');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [token]);

  function handleCreated(org: OrganizationItem): void {
    setOrganizations((prev) => [...prev, org]);
    setTotal((prev) => prev + 1);
    setShowCreateForm(false);
  }

  function handleUpdated(updated: OrganizationItem): void {
    setOrganizations((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  async function handleConfirmDelete(): Promise<void> {
    if (deleteTarget === null) return;
    setIsDeleting(true);
    try {
      await deleteOrganization(token, deleteTarget.id, adminApiBase);
      setOrganizations((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      setTotal((prev) => prev - 1);
      setDeleteTarget(null);
    } catch {
      // keep dialog open so user sees something failed via the UI
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <FormPanel
        title="組織管理"
        titleEn="// organizations"
        lead="テナント組織の一覧・追加・編集・削除を行います。"
      >
        {/* Header row with add button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 14 }}>
          {!showCreateForm && (
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={() => { setShowCreateForm(true); setEditingId(null); }}
            >
              + 組織を追加
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreateForm && (
          <CreateForm
            token={token}
            onCreated={handleCreated}
            onClose={() => { setShowCreateForm(false); }}
          />
        )}

        {/* Edit form */}
        {editingId !== null && (() => {
          const org = organizations.find((o) => o.id === editingId);
          return org !== undefined ? (
            <EditForm
              token={token}
              org={org}
              onUpdated={handleUpdated}
              onClose={() => { setEditingId(null); }}
            />
          ) : null;
        })()}

        {/* Loading / error states */}
        {isLoading && (
          <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>読み込み中…</p>
        )}
        {loadError !== null && (
          <p style={{ fontSize: 13, color: 'var(--danger-text)' }}>{loadError}</p>
        )}

        {/* Empty state */}
        {!isLoading && loadError === null && organizations.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '32px 16px',
            border: '1px dashed var(--hair)',
            borderRadius: 8,
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 22 }}>🏢</span>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>組織がまだありません。</p>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={() => { setShowCreateForm(true); }}
            >
              最初の組織を追加
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && loadError === null && organizations.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hair)', background: 'var(--bg-soft)' }}>
                  {['ID', '名前', 'スラッグ', 'プラン', '有効', 'ドメイン', '作成日', '操作'].map((h) => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-muted)', fontSize: 11, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr
                    key={org.id}
                    style={{
                      borderBottom: '1px solid var(--hair)',
                      cursor: 'pointer',
                      background: editingId === org.id ? 'var(--primary-soft)' : 'transparent',
                    }}
                    onClick={() => { setEditingId(editingId === org.id ? null : org.id); setShowCreateForm(false); }}
                  >
                    <td style={{ padding: '7px 10px', color: 'var(--ink-faint)', fontFamily: '"JetBrains Mono", monospace' }}>{org.id}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--ink-strong)', fontWeight: 600 }}>{org.name}</td>
                    <td style={{ padding: '7px 10px', fontFamily: '"JetBrains Mono", monospace', color: 'var(--ink-muted)' }}>{org.slug}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '1px 7px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'var(--primary-soft)',
                        color: 'var(--primary)',
                      }}>
                        {org.plan}
                      </span>
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      {org.is_active ? (
                        <span style={{ fontSize: 11, color: 'var(--success-fg)', fontWeight: 600 }}>有効</span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>無効</span>
                      )}
                    </td>
                    <td style={{ padding: '7px 10px', color: 'var(--ink-muted)', fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>
                      {org.custom_domain ?? '—'}
                    </td>
                    <td style={{ padding: '7px 10px', color: 'var(--ink-faint)', fontSize: 11 }}>
                      {new Date(org.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td style={{ padding: '7px 10px' }} onClick={(e) => { e.stopPropagation(); }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          className="btn btn-ghost"
                          type="button"
                          style={{ fontSize: 11, padding: '2px 8px' }}
                          onClick={() => { setEditingId(editingId === org.id ? null : org.id); setShowCreateForm(false); }}
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          style={{ fontSize: 11, color: 'var(--danger-text)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                          onClick={() => { setDeleteTarget(org); }}
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '6px 10px', fontSize: 11, color: 'var(--ink-faint)', borderTop: '1px solid var(--hair)' }}>
              合計 {total} 件
            </div>
          </div>
        )}
      </FormPanel>

      {/* Delete confirm dialog */}
      {deleteTarget !== null && (
        <ConfirmDialog
          title="組織を削除"
          description={`「${deleteTarget.name}」を削除します。この操作は取り消せません。`}
          confirmLabel="削除"
          variant="danger"
          isConfirming={isDeleting}
          onConfirm={() => { void handleConfirmDelete(); }}
          onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}
