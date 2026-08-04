import { createAdminTransport } from './transport';

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
  return createAdminTransport(token, apiBase).get<SystemConfigResponse>(
    '/admin/superadmin/system-config',
  );
}

export async function updateSystemConfig(
  token: string,
  body: UpdateSystemConfigRequest,
  apiBase = '',
): Promise<SystemConfigResponse> {
  return createAdminTransport(token, apiBase).put<SystemConfigResponse>(
    '/admin/superadmin/system-config',
    body,
  );
}
