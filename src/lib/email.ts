import "server-only";

/**
 * Optional transactional email through Resend. When RESEND_API_KEY is not set the caller
 * shows the link in the app so it can be shared directly.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [params.to], subject: params.subject, html: params.html }),
  });
  if (!res.ok) {
    console.error("[email]", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
