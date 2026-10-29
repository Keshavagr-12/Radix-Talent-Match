import { BACKEND_URLS } from './config';
import { requestJson } from './client';

export interface ServiceHealthStatus {
  service: string;
  name: string;
  url: string;
  port: number;
  isAvailable: boolean;
  status: 'checking' | 'available' | 'unavailable' | 'error';
  lastChecked?: string;
  error?: string;
}

export const BACKEND_SERVICES = [
  { id: 'jdAnalytics', name: 'Module 01: JD Analytics', url: BACKEND_URLS.jdAnalytics, port: 8001 },
  { id: 'resumeParsing', name: 'Module 02: Resume Parsing', url: BACKEND_URLS.resumeParsing, port: 8002 },
  { id: 'profileBuilder', name: 'Module 03: Profile Builder', url: BACKEND_URLS.profileBuilder, port: 8003 },
  { id: 'talentCheck', name: 'Module 04: Talent Check', url: BACKEND_URLS.talentCheck, port: 8004 },
  { id: 'skillMatching', name: 'Module 05: Skill Matching', url: BACKEND_URLS.skillMatching, port: 8005 },
];

export async function checkSingleServiceHealth(serviceId: string): Promise<ServiceHealthStatus> {
  const meta = BACKEND_SERVICES.find((s) => s.id === serviceId);
  if (!meta) throw new Error(`Unknown service: ${serviceId}`);

  try {
    const res = await requestJson<any>(`${meta.url}/health`, { timeoutMs: 3000 });
    return {
      service: meta.id,
      name: meta.name,
      url: meta.url,
      port: meta.port,
      isAvailable: res.status === 'ok',
      status: res.status === 'ok' ? 'available' : 'error',
      lastChecked: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      service: meta.id,
      name: meta.name,
      url: meta.url,
      port: meta.port,
      isAvailable: false,
      status: 'unavailable',
      error: err?.message || 'Connection refused',
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function checkAllServicesHealth(): Promise<Record<string, ServiceHealthStatus>> {
  const results: Record<string, ServiceHealthStatus> = {};
  await Promise.all(
    BACKEND_SERVICES.map(async (svc) => {
      results[svc.id] = await checkSingleServiceHealth(svc.id);
    })
  );
  return results;
}
