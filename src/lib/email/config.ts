/**
 * Email Configuration for Sigma DOCs
 * Supports SMTP, SendGrid, and other email providers
 */

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: {
    name: string
    address: string
  }
}

// Email configuration from environment variables
export function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || 'noreply@sigmadocs.com.br'
  const fromName = process.env.SMTP_FROM_NAME || 'Sigma DOCs'

  if (!host || !user || !pass) {
    console.warn('SMTP not configured. Email notifications will be logged only.')
    return null
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from: {
      name: fromName,
      address: fromEmail
    }
  }
}

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}
