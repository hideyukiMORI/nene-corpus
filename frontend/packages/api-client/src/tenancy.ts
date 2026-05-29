import { fetchJson } from './fetch-json';

export interface SystemConfigResponse {
  tenant_resolution_mode: 'single' | 'subdomain' | 'path';
  tenant_org_slug: string;
  tenant_base_domain: string;
}

export interface UpdateSystemConfigRequest {
  tenant_resolution_mode?: 'single' | 'subdomain' | 'path';
  tenant_org_slug?: string;
  tenant_base_domain?: string;
}

export async function getSystemConfig(token: string, apiBase = ''): Promise<SystemConfigResponse> {
  return fetchJson<SystemConfigResponse>(`${apiBase}/admin/superadmin/system-config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateSystemConfig(
  token: string,
  body: UpdateSystemConfigRequest,
  apiBase = '',
): Promise<SystemConfigResponse> {
  return fetchJson<SystemConfigResponse>(`${apiBase}/admin/superadmin/system-config`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
