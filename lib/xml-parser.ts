/**
 * ServiceNow XML Ticket Parser
 *
 * Parses a ServiceNow incident XML export, normalizes all fields,
 * and returns both UI-facing values and a DB-ready field map.
 *
 * Runs client-side using the browser DOMParser API.
 */

// ─── Types ───────────────────────────────────────────────────────────

/** Fields that map directly to MySQL `tickets` columns */
export interface XmlDbFields {
  number: string | null;
  short_description: string | null;
  description: string | null;
  state: string | null;
  priority: string | null;
  assignment_group: string | null;
  assigned_to: string | null;
  sys_class_name: string | null;
  sys_created_on: string | null;
  ref_incident_calendar_stc: string | null;
  ref_sc_request_calendar_stc: string | null;
  work_notes: string | null;
  work_notes_list: string | null;
  sla_due: string | null;
  made_sla: string | null;
  time_worked: string | null;
  sys_updated_on: string | null;
  sys_updated_by: string | null;
  sys_mod_count: string | null;
  opened_by: string | null;
  opened_at: string | null;
  calendar_duration: string | null;
  due_date: string | null;
  closed_at: string | null;
  close_notes: string | null;
  closed_by: string | null;
  comments: string | null;
  business_service: string | null;
  sys_created_by: string | null;
  u_response_time: string | null;
}

/** UI-only fields (not saved to DB) */
export interface XmlUiFields {
  number: string;
  opened_at: string;
  closed_at: string;
  opened_by: string;
  stakeholders: string;
  urgency: string;
  state: string;
  analysis_priority: string;
  short_description: string;
  description: string;
  comments: string;
}

export interface ParsedXmlTicket {
  ui: XmlUiFields;
  db: XmlDbFields;
  warnings: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Extract text content from an XML element.
 * If the element has a `display_value` attribute, prefer that.
 * Returns null for empty / missing tags.
 */
function extractField(parent: Element, tagName: string): string | null {
  const el = parent.getElementsByTagName(tagName)[0];
  if (!el) return null;

  // Prefer display_value attribute (common in ServiceNow reference fields)
  const dv = el.getAttribute("display_value");
  if (dv !== null && dv.trim() !== "") return dv.trim();

  const text = (el.textContent || "").trim();
  return text === "" ? null : text;
}

/**
 * Like extractField but always returns the display_value attribute
 * for reference fields (caller_id, assigned_to, opened_by, closed_by, etc.)
 */
function extractDisplayValue(parent: Element, tagName: string): string | null {
  const el = parent.getElementsByTagName(tagName)[0];
  if (!el) return null;

  const dv = el.getAttribute("display_value");
  if (dv !== null && dv.trim() !== "") return dv.trim();

  // Fallback: if the inner text looks like a name (not a sys_id), use it
  const text = (el.textContent || "").trim();
  if (text === "" || /^[a-f0-9]{32}$/i.test(text)) return null;
  return text;
}

/**
 * Normalize a date string to YYYY-MM-DD HH:mm:ss.
 * Accepts ISO 8601, ServiceNow format (YYYY-MM-DD HH:mm:ss), and many variants.
 */
function normalizeDate(raw: string | null): string | null {
  if (!raw) return null;
  try {
    // ServiceNow dates are often already in "YYYY-MM-DD HH:mm:ss"
    const clean = raw.trim().replace("T", " ").replace("Z", "");
    // Try parsing as Date
    const d = new Date(raw.trim());
    if (isNaN(d.getTime())) {
      // If can't parse, return cleaned raw
      return clean.substring(0, 19) || null;
    }
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return null;
  }
}

/**
 * Extract journal / work_notes entries from `<sys_journal_field>` blocks.
 * Only elements where `<element>` equals the target (e.g. "work_notes") are included.
 */
function extractJournalEntries(parent: Element, elementName: string): string[] {
  const entries: string[] = [];
  const journals = parent.getElementsByTagName("sys_journal_field");
  for (let i = 0; i < journals.length; i++) {
    const journal = journals[i];
    const elTag = journal.getElementsByTagName("element")[0];
    const valTag = journal.getElementsByTagName("value")[0];
    if (elTag && (elTag.textContent || "").trim() === elementName && valTag) {
      const text = (valTag.textContent || "").trim();
      if (text) entries.push(text);
    }
  }
  return entries;
}

/**
 * Derive the analysis priority label from urgency and priority values.
 *
 * Rules:
 *  - urgency=1 OR priority=1 → "1 - Critical"
 *  - urgency=2 OR priority=2 → "2 - High"
 *  - priority=3             → "3 - Moderate"
 *  - priority>=4            → "4 - Low"
 */
function deriveAnalysisPriority(urgencyRaw: string | null, priorityRaw: string | null): string {
  const u = parseInt((urgencyRaw || "").replace(/\D/g, ""), 10) || 99;
  const p = parseInt((priorityRaw || "").replace(/\D/g, ""), 10) || 99;

  if (u === 1 || p === 1) return "1 - Critical";
  if (u === 2 || p === 2) return "2 - High";
  if (p === 3) return "3 - Moderate";
  if (p >= 4) return "4 - Low";
  return "3 - Moderate"; // fallback
}

/**
 * Map the raw urgency value to the UI select option format.
 */
function mapUrgencyToUi(raw: string | null): string {
  if (!raw) return "";
  const num = parseInt(raw.replace(/\D/g, ""), 10);
  switch (num) {
    case 1: return "1 - High";
    case 2: return "2 - Medium";
    case 3: return "3 - Low";
    default: return raw;
  }
}

/**
 * Map the raw state value (number or label) to the UI select option format.
 */
function mapStateToUi(raw: string | null): string {
  if (!raw) return "";
  const num = parseInt(raw.replace(/\D/g, ""), 10);
  // ServiceNow numeric states
  const stateMap: Record<number, string> = {
    1: "New",
    2: "In Progress",
    3: "On Hold",
    6: "Resolved",
    7: "Closed",
    8: "Canceled",
  };
  if (stateMap[num]) return stateMap[num];
  // If it's already a label, return as-is
  return raw.trim();
}

// ─── Main Parser ─────────────────────────────────────────────────────

export function parseServiceNowXml(xmlText: string): ParsedXmlTicket {
  const warnings: string[] = [];

  // Parse XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  // Check for parse errors
  const parseError = doc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error("Invalid XML: " + (parseError[0].textContent || "Parse error"));
  }

  // Find the <incident> root element
  let incident = doc.getElementsByTagName("incident")[0];

  // Fallback: try the document element itself, or first child
  if (!incident) {
    // Maybe the root IS the incident data (some exports wrap differently)
    const root = doc.documentElement;
    if (root && root.getElementsByTagName("number").length > 0) {
      incident = root;
      warnings.push("No <incident> root found; using document root.");
    } else {
      throw new Error("No <incident> element found in the XML file.");
    }
  }

  // ── Extract raw values ──────────────────────────────────────────────

  const number = extractField(incident, "number");
  const short_description = extractField(incident, "short_description");
  const description = extractField(incident, "description");
  const stateRaw = extractField(incident, "state");
  const priorityRaw = extractField(incident, "priority");
  const urgencyRaw = extractField(incident, "urgency");
  const caller = extractDisplayValue(incident, "caller_id");
  const watch_list = extractField(incident, "watch_list");
  const opened_at = extractField(incident, "opened_at");
  const closed_at = extractField(incident, "closed_at");
  const assignment_group = extractDisplayValue(incident, "assignment_group");
  const assigned_to = extractDisplayValue(incident, "assigned_to");
  const sys_class_name = extractField(incident, "sys_class_name");
  const sys_created_on = extractField(incident, "sys_created_on");
  const work_notes = extractField(incident, "work_notes");
  const sla_due = extractField(incident, "sla_due");
  const made_sla = extractField(incident, "made_sla");
  const time_worked = extractField(incident, "time_worked");
  const sys_updated_on = extractField(incident, "sys_updated_on");
  const sys_updated_by = extractField(incident, "sys_updated_by");
  const sys_mod_count = extractField(incident, "sys_mod_count");
  const opened_by = extractDisplayValue(incident, "opened_by");
  const calendar_duration = extractField(incident, "calendar_duration");
  const due_date = extractField(incident, "due_date");
  const close_notes = extractField(incident, "close_notes");
  const closed_by = extractDisplayValue(incident, "closed_by");
  const commentsField = extractField(incident, "comments");
  const business_service = extractDisplayValue(incident, "business_service");
  const sys_created_by = extractField(incident, "sys_created_by");
  const u_response_time = extractField(incident, "u_response_time");
  const ref_incident_calendar_stc = extractField(incident, "ref_incident_calendar_stc");
  const ref_sc_request_calendar_stc = extractField(incident, "ref_sc_request_calendar_stc");

  // Journal entries for work_notes and comments
  const workNoteEntries = extractJournalEntries(incident, "work_notes");
  const commentEntries = extractJournalEntries(incident, "comments");

  // Combine journal entries into work_notes_list
  const work_notes_list = workNoteEntries.length > 0 ? workNoteEntries.join("\n---\n") : null;

  // Combine comments: prefer the <comments> field, fallback to journal entries
  const combinedComments = commentsField
    || (commentEntries.length > 0 ? commentEntries.join("\n---\n") : null)
    || (workNoteEntries.length > 0 ? workNoteEntries.join("\n---\n") : null);

  // ── Derive analysis priority ────────────────────────────────────────
  const analysisPriority = deriveAnalysisPriority(urgencyRaw, priorityRaw);

  // ── Warn about missing critical fields ──────────────────────────────
  if (!number) warnings.push("Missing: <number> (Incident Number)");
  if (!short_description) warnings.push("Missing: <short_description>");
  if (!description) warnings.push("Missing: <description> — Internal Description is empty");
  if (!stateRaw) warnings.push("Missing: <state>");
  if (!priorityRaw) warnings.push("Missing: <priority>");
  if (!opened_at) warnings.push("Missing: <opened_at>");
  if (!caller) warnings.push("Missing: <caller_id> display_value");
  if (!assignment_group) warnings.push("Missing: <assignment_group> display_value");
  if (!assigned_to) warnings.push("Missing: <assigned_to> display_value");

  // ── Build result ────────────────────────────────────────────────────
  return {
    ui: {
      number: number || "",
      opened_at: normalizeDate(opened_at) || "",
      closed_at: normalizeDate(closed_at) || "",
      opened_by: caller || "",
      stakeholders: watch_list || "",
      urgency: mapUrgencyToUi(urgencyRaw),
      state: mapStateToUi(stateRaw),
      analysis_priority: analysisPriority,
      short_description: short_description || "",
      description: description || "",
      comments: combinedComments || "",
    },
    db: {
      number,
      short_description,
      description,
      state: stateRaw,
      priority: priorityRaw,
      assignment_group,
      assigned_to,
      sys_class_name,
      sys_created_on: normalizeDate(sys_created_on),
      ref_incident_calendar_stc,
      ref_sc_request_calendar_stc,
      work_notes,
      work_notes_list,
      sla_due: normalizeDate(sla_due),
      made_sla,
      time_worked,
      sys_updated_on: normalizeDate(sys_updated_on),
      sys_updated_by,
      sys_mod_count,
      opened_by,
      opened_at: normalizeDate(opened_at),
      calendar_duration,
      due_date: normalizeDate(due_date),
      closed_at: normalizeDate(closed_at),
      close_notes,
      closed_by,
      comments: combinedComments,
      business_service,
      sys_created_by,
      u_response_time,
    },
    warnings,
  };
}
