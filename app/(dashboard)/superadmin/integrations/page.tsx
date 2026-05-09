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
              Integration <span className="text-indigo-500">Hub</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.15em]">External System Synchronization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          subtitle="FORS Agent" 
          color="green" 
          saving={saving === "ai"} 
          saved={saved === "ai"} 
          onSave={() => saveCategory("ai")}
        >
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Provider</label>
            <select 
              value={settings.ai.provider || "ollama"} 
              onChange={e => updateField("ai", "provider", e.target.value)} 
              className="w-full bg-white/50 border border-emerald-100 rounded-xl px-4 py-3 text-[12px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-200 cursor-pointer appearance-none shadow-sm"
            >
              <option value="ollama">Ollama</option>
              <option value="mistral">Mistral</option>
              <option value="qwen">Qwen</option>
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
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
              {settings.servicenow.map((inst: ServiceNowInstance, idx: number) => (
                <div key={idx} className="relative p-5 bg-white/40 border border-sky-100 rounded-[1.5rem] space-y-5 group/inst">
                  <div className="flex items-center justify-between border-b border-sky-50 pb-3 mb-1">
                    <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Node {idx + 1}</span>
                    {settings.servicenow.length > 1 && (
                      <button onClick={() => removeSNInstance(idx)} className="text-sky-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <Field label="Instance URL" value={inst.url} onChange={v => updateSNInstance(idx, "url", v)} placeholder="leoni.service-now.com" mono />
                    <Field label="Client ID" value={inst.clientId} onChange={v => updateSNInstance(idx, "clientId", v)} placeholder="SN_CLIENT_ID" mono />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Secret</label>
                    <input 
                      type="password" 
                      value={inst.clientSecret} 
                      onChange={e => updateSNInstance(idx, "clientSecret", e.target.value)} 
                      placeholder="••••••••••••••••" 
                      className="w-full bg-white/60 border border-sky-50 rounded-xl px-4 py-3 text-[12px] font-mono text-slate-800 focus:outline-none shadow-sm" 
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={addSNInstance}
              className="w-full mt-4 flex items-center justify-center gap-2 py-4 border border-dashed border-sky-200 rounded-[1.5rem] text-[11px] font-black text-sky-400 uppercase tracking-widest hover:border-sky-400 hover:text-sky-600 hover:bg-sky-100/30 transition-all"
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
  const colorMap: Record<string, { bg: string; border: string; iconBg: string; btn: string }> = {
    pink:  { bg: "bg-pink-50/50",    border: "border-pink-100",    iconBg: "bg-pink-100",    btn: "bg-pink-500"    },
    green: { bg: "bg-emerald-50/50", border: "border-emerald-100", iconBg: "bg-emerald-100", btn: "bg-emerald-500" },
    blue:  { bg: "bg-sky-50/50",     border: "border-sky-100",     iconBg: "bg-sky-100",     btn: "bg-sky-500"     },
  };
  const cm = colorMap[color];

  return (
    <div className={clsx(
      "backdrop-blur-xl border p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group flex flex-col h-full",
      cm.bg, cm.border
    )}>
      <div className="flex items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className={clsx("w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 shrink-0", cm.iconBg)}>
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-tight truncate">{title}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-2 truncate">{subtitle}</p>
          </div>
        </div>
        <button 
          onClick={onSave} 
          disabled={saving} 
          className={clsx(
            "flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 text-white shadow-xl shrink-0",
            saved ? "bg-violet-500 shadow-violet-200" : cm.btn
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span className="hidden sm:inline">{saving ? "Syncing..." : saved ? "Done" : "Sync"}</span>
        </button>
      </div>
      <div className="space-y-6 flex-1">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder} 
        className={clsx(
          "w-full bg-white/60 border border-slate-100 rounded-2xl px-5 py-3.5 text-[12px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-200 transition-all shadow-sm",
          mono && "font-mono"
        )} 
      />
    </div>
  );
}
