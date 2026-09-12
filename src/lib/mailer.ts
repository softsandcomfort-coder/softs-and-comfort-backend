import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Email not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env file."
    );
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<void> {
  
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transport = createTransport();

  await transport.sendMail({
    from,
    to,
    subject: "Reset your password",
    text: `Click the link below to reset your password. It expires in 15 minutes.\n\n${resetLink}\n\nIf you did not request a password reset, you can ignore this email.`,
    html: `
      <p>Click the button below to reset your password. The link expires in <strong>15 minutes</strong>.</p>
      <p style="margin:24px 0">
        <a href="${resetLink}"
           style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Reset password
        </a>
      </p>
      <p style="color:#888;font-size:13px">
        Or copy this link into your browser:<br/>
        <a href="${resetLink}">${resetLink}</a>
      </p>
      <p style="color:#888;font-size:13px">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    `,
  });
}
