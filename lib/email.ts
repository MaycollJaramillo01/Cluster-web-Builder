type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME || "Cluster";
  if (!apiKey || !fromEmail) {
    if (process.env.NODE_ENV !== "production") console.info("email_skipped", { to: message.to, subject: message.subject });
    return false;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
    }),
  });
  if (!response.ok) {
    console.error("email_delivery_failed", { status: response.status, subject: message.subject });
    return false;
  }
  return true;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] || character);
}
