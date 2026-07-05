import { Resend } from 'resend'
import config from '../config'

const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null

export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  if (!resend) {
    console.warn('Resend not configured — skipping welcome email to', to)
    return
  }

  try {
    await resend.emails.send({
      from: config.resend.fromEmail,
      to,
      subject: 'Welcome to VaagAi Smart Farm!',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0d1810;color:#eefdf0;border-radius:12px">
        <h1 style="color:#7bf1a8">Welcome, ${firstName}!</h1>
        <p>Your VaagAi Smart Farm account has been created successfully.</p>
        <p>You can now start managing your farm, tracking weather, diagnosing crop health, and more.</p>
        <div style="margin:24px 0;padding:16px;border-radius:8px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15)">
          <p style="margin:0;color:#8ff0ab">Get started:</p>
          <ul style="margin:8px 0 0;color:#95be9f;font-size:14px">
            <li>Set up your 3D farm view</li>
            <li>Check real-time weather</li>
            <li>Use AI Crop Doctor for diagnosis</li>
          </ul>
        </div>
        <p style="color:#5a7a6a;font-size:12px">VaagAi — Smart Farming, Smarter Future</p>
      </div>`,
    })
    console.log('Welcome email sent to', to)
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}
