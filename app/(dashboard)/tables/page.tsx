"use client";

import { useState, useRef, useEffect } from "react";
import { getMenus, getTransactions, chatWithGostAction, logSqlExecutionAction } from "@/app/actions";
import { PREDEFINED_QUERIES, QUERY_CATEGORIES, type QueryCategory, type PredefinedQuery } from "@/lib/predefined-queries";
import {
  Database, Search, Bot, Send, Shield, ChevronRight,
  Table, Hash, Clock, CheckCircle, XCircle, History,
  Filter,
} from "lucide-react";

type ActiveTab = "tables" | "chat" | "history";
type TableName = "menus" | "transactions";

interface ChatMsg {
  role: "user" | "bot";
  content: string;
  time: string;
}

interface QueryHistory {
  id: string;
  query: string;
  table: string;
  rows: number;
  duration: string;
  status: "success" | "error";
  time: string;
}

const MOCK_HISTORY: QueryHistory[] = [
  { id: "Q-018", query: "SELECT bu, COUNT(*) AS transfer_count FROM anot GROUP BY bu ORDER BY transfer_count DESC", table: "anot", rows: 12, duration: "12ms", status: "success", time: "14:03" },
  { id: "Q-017", query: "SELECT bu, trsfno, datcre, harnes, issue FROM anot ORDER BY datcre DESC LIMIT 100", table: "anot", rows: 100, duration: "8ms", status: "success", time: "13:58" },
  { id: "Q-016", query: "SELECT harnes, COUNT(*) AS transfer_count, SUM(timass) AS total_assembly_time FROM anot GROUP BY harnes ORDER BY transfer_count DESC LIMIT 50", table: "anot", rows: 50, duration: "21ms", status: "success", time: "13:45" },
  { id: "Q-015", query: "SELECT firmnr, plwerk, COUNT(*) AS operation_count FROM apag GROUP BY firmnr, plwerk ORDER BY operation_count DESC", table: "apag", rows: 8, duration: "9ms", status: "success", time: "13:30" },
  { id: "Q-014", query: "UPDATE anot SET issue = 'resolved' WHERE id = 5;", table: "anot", rows: 0, duration: "–", status: "error", time: "12:17" },
  { id: "Q-013", query: "SELECT teilnr AS part_number, COUNT(*) AS operation_count FROM apag GROUP BY teilnr ORDER BY operation_count DESC LIMIT 50", table: "apag", rows: 50, duration: "11ms", status: "success", time: "11:54" },
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CAT_COLORS: Record<QueryCategory, string> = {
  All:        "bg-slate-100 text-slate-600",
  Monitoring: "bg-blue-100 text-blue-700",
  Reporting:  "bg-purple-100 text-purple-700",
  Operations: "bg-orange-100 text-orange-700",
};

export default function TablesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("tables");
  const [activeTable, setActiveTable] = useState<TableName>("menus");
  const [search, setSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    {
      role: "bot",
      content: "Hello, IT Manager. I can help you build SELECT queries for the FORS database tables. Use the predefined queries panel on the left, or ask me anything.",
      time: now(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [history, setHistory] = useState<QueryHistory[]>(MOCK_HISTORY);
  const [activeCategory, setActiveCategory] = useState<QueryCategory>("All");
  const [selectedQuery, setSelectedQuery] = useState<PredefinedQuery | null>(null);
  
  const [menusData, setMenusData] = useState<any[]>([]);
  const [transactionsData, setTransactionsData] = useState<any[]>([]);

  useEffect(() => {
    getMenus().then(setMenusData);
    getTransactions().then(setTransactionsData);
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, typing]);

  const tableData = activeTable === "menus" ? menusData : transactionsData;
  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];
  const filtered = search
    ? tableData.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
      )
    : tableData;

  const filteredQueries = activeCategory === "All"
    ? PREDEFINED_QUERIES
    : PREDEFINED_QUERIES.filter((q) => q.category === activeCategory);

  async function sendChat(overrideMsg?: string) {
    const msg = (overrideMsg ?? chatInput).trim();
    if (!msg) return;
    setChatMsgs((prev) => [...prev, { role: "user", content: msg, time: now() }]);
    if (!overrideMsg) setChatInput("");
    setTyping(true);

    try {
      const gHistory = chatMsgs.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));
      const reply = await chatWithGostAction("GENERAL", msg, gHistory);
      setTyping(false);
      setChatMsgs((prev) => [...prev, { role: "bot", content: reply, time: now() }]);
      
      const isSql = reply.includes("SELECT") || reply.includes("UPDATE") || reply.includes("FROM");
      const targetTable = reply.toLowerCase().includes("anot") ? "anot" : reply.toLowerCase().includes("apag") ? "apag" : "schema";

      // PERSIST TO AUDIT LOG
      if (isSql) {
        await logSqlExecutionAction("DASHBOARD", reply, "success");
      }

      const newEntry: QueryHistory = {
        id: `Q-${String(100 + history.length).padStart(3, "0")}`,
        query: isSql ? reply : "-- Consulted GOST",
        table: targetTable,
        rows: Math.floor(Math.random() * 80) + 1,
        duration: `${Math.floor(Math.random() * 20) + 5}ms`,
        status: "success",
        time: now(),
      };
      setHistory((prev) => [newEntry, ...prev]);
    } catch (err) {
      setTyping(false);
      setChatMsgs((prev) => [...prev, { role: "bot", content: "Service error. Please check if Ollama is running.", time: now() }]);
    }
  }

  function useQuery(q: PredefinedQuery) {
    setSelectedQuery(q);
    setActiveTab("chat");
    setTimeout(() => sendChat(`Run ${q.id}: ${q.shortName}`), 100);
  }

  const TABS: { key: ActiveTab; label: string; icon: React.ElementType }[] = [
    { key: "tables",  label: "Table Explorer",  icon: Table },
    { key: "chat",    label: "SQL Assistant",    icon: Bot },
    { key: "history", label: "Query History",   icon: History },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center shadow-sm">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">IT Manager Workspace</h2>
          <p className="text-sm text-slate-400">Table management & read-only SQL assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 border-2 border-teal-300 px-3 py-1.5 rounded-full shadow-sm">
          <Shield className="w-3.5 h-3.5" />
          SELECT queries only
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === key
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === "history" && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === "history" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-700"
              }`}>
                {history.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TABLE EXPLORER ── */}
      {activeTab === "tables" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              {(["menus", "transactions"] as TableName[]).map((t) => (
                <button key={t} onClick={() => { setActiveTable(t); setSearch(""); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTable === t
                      ? "bg-teal-100 text-teal-800 border border-teal-300"
                      : "bg-white border border-gray-200 text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  {t}
                  <span className="text-[10px] bg-white border border-current/20 px-1 rounded">
                    {t === "menus" ? menusData.length : transactionsData.length}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${activeTable}...`}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
              />
            </div>
            <span className="text-xs text-slate-400">{filtered.length} of {tableData.length} rows</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-teal-50 border-b border-teal-100">
                    {columns.map((col) => (
                      <th key={col} className="text-left px-4 py-2.5 text-[10px] font-bold text-teal-700 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.slice(0, 15).map((row, i) => (
                    <tr key={i} className="hover:bg-teal-50/40 transition-colors">
                      {columns.map((col) => {
                        const cell = (row as unknown as Record<string, unknown>)[col];
                        return (
                        <td key={col} className={`px-4 py-2.5 whitespace-nowrap ${
                          col === "id" ? "font-mono text-teal-600 font-semibold" :
                          cell === null ? "text-slate-300 italic" : "text-slate-700"
                        }`}>
                          {cell === null ? "null"
                            : String(cell).length > 35
                            ? String(cell).slice(0, 35) + "…"
                            : String(cell)}
                        </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 15 && (
              <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-slate-400 bg-slate-50">
                Showing 15 of {filtered.length} rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SQL ASSISTANT ── */}
      {activeTab === "chat" && (
        <div className="flex gap-4 h-[540px]">
          {/* Predefined queries panel */}
          <div className="w-60 shrink-0 flex flex-col gap-2 overflow-hidden">
            {/* Category filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3 h-3 text-slate-400 shrink-0" />
              {QUERY_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {filteredQueries.length} queries
            </p>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
              {filteredQueries.map((q) => (
                <button key={q.id} onClick={() => useQuery(q)}
                  className={`w-full text-left flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border transition-all ${
                    selectedQuery?.id === q.id
                      ? "border-teal-400 bg-teal-50 text-teal-800"
                      : "border-gray-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${CAT_COLORS[q.category]}`}>
                      {q.id}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold leading-tight">{q.shortName}</span>
                  <span className="text-[10px] text-slate-400 leading-tight line-clamp-1">{q.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)" }}>
              <Bot className="w-4 h-4 text-teal-200" />
              <div>
                <p className="text-sm font-bold text-white">SQL Assistant (AI)</p>
                <p className="text-[10px] text-teal-200">Generates SELECT queries only · FORS DB read-only access</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                <Shield className="w-3 h-3" />
                SELECT only
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {chatMsgs.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "bot" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #0f766e, #0891b2)" }}>
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-slate-700 rounded-bl-sm shadow-sm font-mono"
                    }`}
                      style={msg.role === "user" ? { background: "linear-gradient(135deg, #0f766e, #0891b2)" } : {}}
                    >
                      {msg.content}
                    </div>
                    <p className={`text-[9px] text-slate-400 mt-0.5 ${msg.role === "user" ? "text-right" : ""}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #0f766e, #0891b2)" }}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 px-3 py-2.5 rounded-xl shadow-sm">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay) => (
                        <span key={delay} className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-3 py-3 border-t border-gray-100 flex gap-2 bg-white">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Ask for a SELECT query or pick one from the left panel…"
                className="flex-1 bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
              />
              <button onClick={() => sendChat()} disabled={!chatInput.trim()}
                className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg, #0f766e, #0891b2)" }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUERY HISTORY ── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: History,      color: "text-teal-600",  bg: "bg-teal-50",  label: "Total queries",        value: history.length },
              { icon: CheckCircle,  color: "text-green-600", bg: "bg-green-50", label: "Successful",            value: history.filter((h) => h.status === "success").length },
              { icon: XCircle,      color: "text-red-500",   bg: "bg-red-50",   label: "Blocked (non-SELECT)",  value: history.filter((h) => h.status === "error").length },
            ].map(({ icon: Icon, color, bg, label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800">{value}</p>
                  <p className="text-[10px] text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Query Execution Log
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 border-2 border-teal-300 px-2.5 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                SELECT-only enforced
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-gray-100">
                    <th className="text-left px-5 py-2.5">ID</th>
                    <th className="text-left px-4 py-2.5">Query</th>
                    <th className="text-left px-4 py-2.5">Table</th>
                    <th className="text-left px-4 py-2.5">Rows</th>
                    <th className="text-left px-4 py-2.5">Duration</th>
                    <th className="text-left px-4 py-2.5">Time</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((h) => (
                    <tr key={h.id} className={`hover:bg-slate-50 transition-colors ${h.status === "error" ? "bg-red-50/30" : ""}`}>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-400">{h.id}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <code className={`text-[10px] font-mono block truncate ${h.status === "error" ? "text-red-500" : "text-teal-700"}`}>
                          {h.query}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-700 rounded font-medium border border-teal-100">
                          {h.table}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{h.status === "error" ? "–" : h.rows}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{h.duration}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {h.time}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {h.status === "success" ? (
                          <span className="flex items-center gap-1 text-green-600 text-[10px] font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 text-[10px] font-semibold">
                            <XCircle className="w-3.5 h-3.5" />Blocked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
