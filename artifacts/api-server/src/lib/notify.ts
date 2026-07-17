import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function notifyNewLead(email: string, createdAt: Date): Promise<void> {
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) {
    console.warn("FOUNDER_EMAIL not set — skipping lead notification");
    return;
  }

  const timestamp = createdAt.toLocaleString("en-US", {
    timeZone: "UTC",
    dateStyle: "long",
    timeStyle: "short",
  }) + " UTC";

  const { error } = await resend.emails.send({
    from: "OrgIntel Waitlist <onboarding@resend.dev>",
    to: founderEmail,
    subject: `New waitlist signup: ${email}`,
    html: `
      <p>A new lead just joined your waitlist.</p>
      <table style="border-collapse:collapse;margin-top:12px;">
        <tr>
          <td style="padding:4px 12px 4px 0;color:#555;font-size:14px;">Email</td>
          <td style="padding:4px 0;font-size:14px;font-weight:600;">${email}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;color:#555;font-size:14px;">Signed up</td>
          <td style="padding:4px 0;font-size:14px;">${timestamp}</td>
        </tr>
      </table>
      <p style="margin-top:16px;font-size:13px;color:#888;">Sent automatically by OrgIntel.</p>
    `,
    text: `New waitlist signup\n\nEmail: ${email}\nSigned up: ${timestamp}`,
  });

  if (error) {
    // Log but don't throw — a failed notification should never break the signup flow
    console.error("Lead notification email failed:", error);
  }
}
