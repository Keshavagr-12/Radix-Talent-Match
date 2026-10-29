import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertCircle, Server } from 'lucide-react';
import { checkAllServicesHealth, ServiceHealthStatus, BACKEND_SERVICES } from '../../services/api/backendRegistry';

export const BackendServiceStatusStrip: React.FC = () => {
  const [statuses, setStatuses] = useState<Record<string, ServiceHealthStatus>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const results = await checkAllServicesHealth();
      setStatuses(results);
    } catch (e) {
      console.warn('Failed to probe service statuses:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-y-0.5 space-x-2">
          <Server className="w-4 h-4 text-indigo-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            RADIX Unified Microservices Engine (5 Independent FastAPI Backends)
          </h4>
        </div>
        <button
          onClick={fetchHealth}
          disabled={isRefreshing}
          className="inline-flex items-center text-[11px] font-mono text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors gap-1"
          title="Re-check backend health"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Probe Status</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {BACKEND_SERVICES.map((svc) => {
          const st = statuses[svc.id];
          const isAvailable = st?.isAvailable ?? false;
          const status = st?.status ?? 'checking';

          return (
            <div
              key={svc.id}
              className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                isAvailable
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : status === 'checking'
                  ? 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              }`}
            >
              <div className="truncate mr-2">
                <p className="font-semibold text-[11px] truncate">{svc.name.replace('Module 0', 'M')}</p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Port {svc.port}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isAvailable ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    FALLBACK
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
