export function formatZeroJson(val: any): string {
  if (val === null || val === undefined || val === "") return "Not Provided";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "string") {
    // ISO Timestamp Conversion
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (isoRegex.test(val)) {
      try { return new Date(val).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } 
      catch { return val; }
    }
    // Object Sanitization: Strip basic UUIDs/Hashes
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(val)) return "System Object";
    
    return val.replace(/[{}[\]"]/g, "").replace(/_/g, " ");
  }
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      const parsedArray = val.map(v => formatZeroJson(v)).filter(Boolean);
      return parsedArray.length > 0 ? parsedArray.join(", ") : "None";
    }
    return Object.entries(val).map(([k, v]) => `${k.replace(/_/g, " ")}: ${formatZeroJson(v)}`).join(" | ");
  }
  return String(val).replace(/[{}[\]"]/g, "").replace(/_/g, " ");
}

export function translateJsonToNarratives(details: string | undefined, context?: { performedBy?: string; defaultAction?: string }): { title: string; description: string }[] {
  if (!details) return [{ title: "Event Status", description: "Action completed successfully with no additional details." }];

  // 1. Error-to-Insight Map (String check)
  if (details.includes("403") || details.includes("Forbidden")) {
    return [{ title: "Access Denied", description: "You do not have permission to edit this; please contact your IT Manager." }];
  }
  if (details.includes("500") || details.includes("Internal Error")) {
    return [{ title: "System Error", description: "The system is currently busy. Please try again in a few minutes." }];
  }
  if (details.includes("422") || details.includes("Validation Error")) {
    return [{ title: "Validation Error", description: "One of the fields was filled incorrectly. Please check the highlighted sections." }];
  }

  try {
    const obj = JSON.parse(details);
    if (typeof obj !== "object" || obj === null) {
      return [{ title: "System Message", description: formatZeroJson(obj) }];
    }

    // Error-to-Insight Map (Object check)
    const code = String(obj.statusCode || obj.status || obj.code || obj.error || "");
    if (code.includes("403")) return [{ title: "Access Denied", description: "You do not have permission to edit this; please contact your IT Manager." }];
    if (code.includes("500")) return [{ title: "System Error", description: "The system is currently busy. Please try again in a few minutes." }];
    if (code.includes("422")) return [{ title: "Validation Error", description: "One of the fields was filled incorrectly. Please check the highlighted sections." }];

    const narratives: { title: string; description: string }[] = [];
    const user = context?.performedBy || "System";

    // Natural Sentence Construction & Verb Mapping
    const verbRaw = obj.action || obj.method || obj.type || obj.event || context?.defaultAction;
    const targetRaw = obj.target || obj.resource || obj.object || obj.entity || obj.name;
    
    if (verbRaw) {
      let activeVerb = String(verbRaw).toLowerCase();
      if (activeVerb.includes("post") || activeVerb.includes("create") || activeVerb.includes("add")) activeVerb = "Added";
      else if (activeVerb.includes("put") || activeVerb.includes("update") || activeVerb.includes("modif")) activeVerb = "Modified";
      else if (activeVerb.includes("delete") || activeVerb.includes("remove")) activeVerb = "Removed";
      else activeVerb = "Processed";
      
      const cleanTarget = targetRaw ? `"${formatZeroJson(targetRaw)}"` : "a record";
      const objectType = obj.entityType || obj.resourceType ? formatZeroJson(obj.entityType || obj.resourceType) : "System Object";

      narratives.push({
        title: "Action Narrative",
        description: `${user} ${activeVerb} ${objectType} ${cleanTarget}.`
      });
    }

    // Process remaining fields
    Object.entries(obj).forEach(([key, value]) => {
      const k = key.toLowerCase();
      if (k === "action" || k === "method" || k === "type" || k === "event") return;
      if (k === "target" || k === "resource" || k === "object" || k === "entity") return;
      if (k.endsWith("_id") || k === "id" || k === "uuid" || k === "guid") return;

      const readableKey = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const readableValue = formatZeroJson(value);
      
      narratives.push({ title: readableKey, description: readableValue });
    });

    return narratives.length > 0 ? narratives : [{ title: "Event Details", description: "System recorded the event successfully." }];

  } catch {
    // Zero-JSON fallback for unparseable strings
    return [{ title: "System Message", description: formatZeroJson(details) }];
  }
}
