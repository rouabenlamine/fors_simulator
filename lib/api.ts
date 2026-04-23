const N8N_BASE = process.env.NEXT_PUBLIC_N8N_BASE_URL || "http://localhost:5678";

export async function receiveTicketAnalysis(ticketId: string) {
  const res = await fetch(`${N8N_BASE}/webhook/ticket-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId }),
  });
  if (!res.ok) throw new Error("Failed to fetch ticket analysis");
  return res.json();
}

export async function approveSolution(ticketId: string, userId: string) {
  const res = await fetch(`${N8N_BASE}/webhook/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId, userId, action: "approve" }),
  });
  if (!res.ok) throw new Error("Failed to approve solution");
  return res.json();
}

export async function rejectSolution(ticketId: string, userId: string, reason?: string) {
  const res = await fetch(`${N8N_BASE}/webhook/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId, userId, action: "reject", reason }),
  });
  if (!res.ok) throw new Error("Failed to reject solution");
  return res.json();
}

export async function sendChatMessage(ticketId: string, message: string, userId: string) {
  const res = await fetch(`${N8N_BASE}/webhook/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId, message, userId }),
  });
  if (!res.ok) throw new Error("Failed to send chat message");
  return res.json();
}

export async function getChatHistory(sessionId: string) {
  const res = await fetch(`${N8N_BASE}/webhook/chat/${sessionId}`);
  if (!res.ok) throw new Error("Failed to get chat history");
  return res.json();
}
