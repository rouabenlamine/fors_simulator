"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Cpu, Save, Cloud, Server, Sparkles, Check, Loader2 } from "lucide-react";
import { getIntegrationSettings, updateIntegrationSettingsAction } from "@/app/actions/admin-actions";

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({
    servicenow: { instance_url: "", client_id: "", client_secret: "" },
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
      setSettings(prev => ({
        servicenow: { ...prev.servicenow, ...(data.servicenow || {}) },
        n8n: { ...prev.n8n, ...(data.n8n || {}) },
        ai: { ...prev.ai, ...(data.ai || {}) },
      }));
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateField(category: string, key: string, value: string) {
    setSettings(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
  }

  async function saveCategory(category: string) {
    setSaving(category); setSaved(null);
    try {
      await updateIntegrationSettingsAction(category, settings[category]);
      setSaved(category);
      setTimeout(() => setSaved(null), 2000);
    } catch (e: any) { alert(e.message); }
    setSaving(null);
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-2">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Integration Hub</h1>
          <p className="text-sm text-slate-500">Configure external service connections. Superadmin only.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* n8n */}
        <IntegrationCard icon={<Cloud className="w-5 h-5 text-emerald-500" />} title="Automation (n8n)" subtitle="Webhook Mappings" color="emerald" saving={saving === "n8n"} saved={saved === "n8n"} onSave={() => saveCategory("n8n")}>
          <Field label="Primary Webhook URL" value={settings.n8n.webhook_url || ""} onChange={v => updateField("n8n", "webhook_url", v)} placeholder="https://n8n.your-domain.com/webhook/..." mono />
          <Field label="Fallback Target" value={settings.n8n.fallback_url || ""} onChange={v => updateField("n8n", "fallback_url", v)} placeholder="URL for manual escalations" mono />
        </IntegrationCard>

        {/* AI */}
        <IntegrationCard icon={<Sparkles className="w-5 h-5 text-blue-500" />} title="LLM Engine" subtitle="AI / Ollama Integration" color="blue" saving={saving === "ai"} saved={saved === "ai"} onSave={() => saveCategory("ai")}>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Provider</label>
            <select value={settings.ai.provider || "ollama"} onChange={e => updateField("ai", "provider", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 cursor-pointer transition-all">
              <option value="ollama">Ollama (Local)</option>
              <option value="mistral">Mistral AI</option>
              <option value="qwen">Qwen</option>
            </select>
          </div>
          <Field label="Active Model" value={settings.ai.model || ""} onChange={v => updateField("ai", "model", v)} placeholder="e.g. qwen3.5:4b" mono />
          <Field label="Endpoint URL" value={settings.ai.endpoint || ""} onChange={v => updateField("ai", "endpoint", v)} placeholder="http://localhost:11434" mono />
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Temperature</label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="1" step="0.1" value={settings.ai.temperature || "0.7"} onChange={e => updateField("ai", "temperature", e.target.value)} className="flex-1 accent-blue-500 h-1.5" />
              <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg min-w-[44px] text-center border border-blue-200">{settings.ai.temperature || "0.7"}</span>
            </div>
          </div>
        </IntegrationCard>

        {/* ServiceNow — full width */}
        <div className="lg:col-span-2">
          <IntegrationCard icon={<Server className="w-5 h-5 text-purple-500" />} title="ServiceNow ITSM" subtitle="Primary System of Record" color="purple" saving={saving === "servicenow"} saved={saved === "servicenow"} onSave={() => saveCategory("servicenow")}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Instance URL" value={settings.servicenow.instance_url || ""} onChange={v => updateField("servicenow", "instance_url", v)} placeholder="dev12345.service-now.com" mono />
              <Field label="Client ID" value={settings.servicenow.client_id || ""} onChange={v => updateField("servicenow", "client_id", v)} placeholder="OAuth Client ID" mono />
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Client Secret</label>
                <input type="password" value={settings.servicenow.client_secret || ""} onChange={e => updateField("servicenow", "client_secret", e.target.value)} placeholder="••••••••••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-purple-400 font-mono transition-all" />
              </div>
            </div>
          </IntegrationCard>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ icon, title, subtitle, color, saving, saved, onSave, children }: {
  icon: React.ReactNode; title: string; subtitle: string; color: string;
  saving: boolean; saved: boolean; onSave: () => void; children: React.ReactNode;
}) {
  const colorMap: Record<string, { bg: string; border: string; iconBg: string }> = {
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", iconBg: "bg-purple-100" },
  };
  const cm = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${cm.iconBg} flex items-center justify-center`}>{icon}</div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">{subtitle}</p>
          </div>
        </div>
        <button onClick={onSave} disabled={saving} className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm ${
          saved ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        } disabled:opacity-50 active:scale-[0.98]`}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all ${mono ? "font-mono" : ""}`} />
    </div>
  );
}
