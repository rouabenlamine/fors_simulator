"use client";

import React, { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { Cpu, Save, Cloud, Server, Sparkles, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { getIntegrationSettings, updateIntegrationSettingsAction } from "@/app/actions/admin-actions";

type ServiceNowInstance = {
  url: string;
  clientId: string;
  clientSecret: string;
};

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({
    servicenow: [{ url: "", clientId: "", clientSecret: "" }],
    n8n: { webhook_url: "http://localhost:5678", fallback_url: "" },
    ai: { provider: "ollama", model: "qwen3.5:4b", endpoint: "http://localhost:11434", temperature: "0.7" },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getIntegrationSettings();

      let snInstances: ServiceNowInstance[] = [{ url: "", clientId: "", clientSecret: "" }];
      if (data.servicenow?.instances) {
        try { snInstances = JSON.parse(data.servicenow.instances); } catch { }
      } else if (data.servicenow?.instance_url) {
        snInstances = [{
          url: data.servicenow.instance_url,
          clientId: data.servicenow.client_id || "",
          clientSecret: data.servicenow.client_secret || ""
        }];
      }

      setSettings({
        servicenow: snInstances,
        n8n: { ...settings.n8n, ...(data.n8n || {}) },
        ai: { ...settings.ai, ...(data.ai || {}) },
      });
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateField(category: string, key: string, value: string) {
    setSettings(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
  }

  function updateSNInstance(index: number, field: keyof ServiceNowInstance, value: string) {
    const newInstances = [...settings.servicenow];
    newInstances[index] = { ...newInstances[index], [field]: value };
    setSettings(prev => ({ ...prev, servicenow: newInstances }));
  }

  function addSNInstance() {
    setSettings(prev => ({ ...prev, servicenow: [...prev.servicenow, { url: "", clientId: "", clientSecret: "" }] }));
  }

  function removeSNInstance(index: number) {
    if (settings.servicenow.length <= 1) return;
    const newInstances = settings.servicenow.filter((_: any, i: number) => i !== index);
    setSettings(prev => ({ ...prev, servicenow: newInstances }));
  }

  async function saveCategory(category: string) {
    setSaving(category); setSaved(null);
    try {
      let payload = settings[category];
      if (category === "servicenow") {
        payload = { instances: JSON.stringify(settings.servicenow) };
      }
      await updateIntegrationSettingsAction(category, payload);
      setSaved(category);
      setTimeout(() => setSaved(null), 2000);
    } catch (e: any) { alert(e.message); }
    setSaving(null);
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="w-full space-y-10 py-6 px-4 animate-in fade-in duration-500">

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
              External <span className="text-indigo-500">Integrations</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.15em]">External System Synchronization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* n8n - Pastel pink */}
        <IntegrationCard
          icon={<Cloud className="w-5 h-5 text-pink-600" />}
          title="Automation"
          subtitle="n8n Webhooks"
          color="pink"
          saving={saving === "n8n"}
          saved={saved === "n8n"}
          onSave={() => saveCategory("n8n")}
        >
          <Field label="Webhook URL" value={settings.n8n.webhook_url || ""} onChange={v => updateField("n8n", "webhook_url", v)} placeholder="https://n8n.leoni.com/..." mono />
          <Field label="Fallback" value={settings.n8n.fallback_url || ""} onChange={v => updateField("n8n", "fallback_url", v)} placeholder="Escalation URL" mono />
        </IntegrationCard>

        {/* AI Configuration - Pastel Green */}
        <IntegrationCard
          icon={<Sparkles className="w-5 h-5 text-emerald-600" />}
          title="AI Core"
          subtitle="FORS Assistant"
          color="green"
          saving={saving === "ai"}
          saved={saved === "ai"}
          onSave={() => saveCategory("ai")}
        >
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Provider</label>
            <select
              value={settings.ai.provider || "ollama"}
              onChange={e => updateField("ai", "provider", e.target.value)}
              className="w-full bg-white/50 border border-emerald-100 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-200 cursor-pointer appearance-none shadow-sm"
            >
              <option value="ollama">Ollama</option>
            </select>
          </div>
          <Field label="Model" value={settings.ai.model || ""} onChange={v => updateField("ai", "model", v)} placeholder="e.g. qwen2.5:7b" mono />
          <Field label="Endpoint" value={settings.ai.endpoint || ""} onChange={v => updateField("ai", "endpoint", v)} placeholder="http://ai-server:11434" mono />
        </IntegrationCard>

        {/* ServiceNow Card - Pastel Blue */}
        <div className="lg:col-span-1 md:col-span-2">
          <IntegrationCard
            icon={<Server className="w-5 h-5 text-blue-600" />}
            title="ServiceNow"
            subtitle="ITSM Cluster"
            color="blue"
            saving={saving === "servicenow"}
            saved={saved === "servicenow"}
            onSave={() => saveCategory("servicenow")}
          >
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {settings.servicenow.map((inst: ServiceNowInstance, idx: number) => (
                <div key={idx} className="relative p-4 bg-white/40 border border-sky-100 rounded-xl space-y-3 group/inst">
                  <div className="flex items-center justify-between border-b border-sky-50 pb-2 mb-1">
                    <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Node {idx + 1}</span>
                    {settings.servicenow.length > 1 && (
                      <button onClick={() => removeSNInstance(idx)} className="text-sky-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Field label="Instance URL" value={inst.url} onChange={v => updateSNInstance(idx, "url", v)} placeholder="leoni.service-now.com" mono />
                    <Field label="Client ID" value={inst.clientId} onChange={v => updateSNInstance(idx, "clientId", v)} placeholder="SN_CLIENT_ID" mono />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Client Secret</label>
                    <input
                      type="password"
                      value={inst.clientSecret}
                      onChange={e => updateSNInstance(idx, "clientSecret", e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-white/60 border border-sky-50 rounded-xl px-4 py-2.5 text-[11px] font-mono text-slate-800 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addSNInstance}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 border border-dashed border-sky-200 rounded-xl text-[10px] font-black text-sky-400 uppercase tracking-widest hover:border-sky-400 hover:text-sky-600 hover:bg-sky-100/30 transition-all"
            >
              <Plus className="w-5 h-5" /> Add System Node
            </button>
          </IntegrationCard>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ icon, title, subtitle, color, saving, saved, onSave, children }: {
  icon: React.ReactNode; title: string; subtitle: string; color: "pink" | "green" | "blue";
  saving: boolean; saved: boolean; onSave: () => void; children: React.ReactNode;
}) {
  const colorMap: Record<string, { bg: string; border: string; iconBg: string; btn: string; btnShadow: string }> = {
    pink: { bg: "bg-pink-50/40", border: "border-pink-100/80", iconBg: "bg-pink-100", btn: "bg-pink-500 hover:bg-pink-600", btnShadow: "shadow-pink-200/50" },
    green: { bg: "bg-emerald-50/40", border: "border-emerald-100/80", iconBg: "bg-emerald-100", btn: "bg-emerald-500 hover:bg-emerald-600", btnShadow: "shadow-emerald-200/50" },
    blue: { bg: "bg-sky-50/40", border: "border-sky-100/80", iconBg: "bg-sky-100", btn: "bg-sky-500 hover:bg-sky-600", btnShadow: "shadow-sky-200/50" },
  };
  const cm = colorMap[color];

  return (
    <div className={clsx(
      "backdrop-blur-xl border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col h-full",
      cm.bg, cm.border
    )}>
      {/* Card Header — icon + full title */}
      <div className="flex items-center gap-3 mb-5">
        <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 shrink-0", cm.iconBg)}>
          {icon}
        </div>
        <div>
          <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-tight">{title}</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="space-y-4 flex-1">{children}</div>

      {/* Card Footer — Sync button at the bottom */}
      <button
        onClick={onSave}
        disabled={saving}
        className={clsx(
          "w-full mt-5 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] text-white shadow-lg",
          saved ? "bg-violet-500 shadow-violet-200/50" : cm.btn,
          cm.btnShadow
        )}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? "Syncing..." : saved ? "Saved" : "Sync"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "w-full bg-white/60 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-200 transition-all shadow-sm",
          mono && "font-mono"
        )}
      />
    </div>
  );
}
