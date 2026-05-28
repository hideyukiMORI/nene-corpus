import { fetchJson } from './fetch-json';

export interface OrganizationItem {
  id: number;
  name: string;
  slug: string;
  custom_domain: string | null;
  plan: string;
  is_active: boolean;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListOrganizationsResponse {
  organizations: OrganizationItem[];
  total: number;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  plan?: string;
  custom_domain?: string | null;
  external_id?: string | null;
}

export type UpdateOrganizationRequest = Partial<
  Omit<OrganizationItem, 'id' | 'created_at' | 'updated_at'>
>;

export async function listOrganizations(
  token: string,
  apiBase = '',
): Promise<ListOrganizationsResponse> {
  return fetchJson<ListOrganizationsResponse>(`${apiBase}/admin/superadmin/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getOrganization(
  token: string,
  id: number,
  apiBase = '',
): Promise<OrganizationItem> {
  return fetchJson<OrganizationItem>(`${apiBase}/admin/superadmin/organizations/${String(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createOrganization(
  token: string,
  body: CreateOrganizationRequest,
  apiBase = '',
): Promise<OrganizationItem> {
  return fetchJson<OrganizationItem>(`${apiBase}/admin/superadmin/organizations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function updateOrganization(
  token: string,
  id: number,
  body: UpdateOrganizationRequest,
  apiBase = '',
): Promise<OrganizationItem> {
  return fetchJson<OrganizationItem>(`${apiBase}/admin/superadmin/organizations/${String(id)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function deleteOrganization(
  token: string,
  id: number,
  apiBase = '',
): Promise<void> {
  await fetchJson<null>(`${apiBase}/admin/superadmin/organizations/${String(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
