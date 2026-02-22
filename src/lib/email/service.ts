import { getEmailConfig, isEmailConfigured } from './config'
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Email service for Sigma DOCs
 * Handles all email sending with proper logging
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null

  async initialize() {
    const config = getEmailConfig()
    if (!config) return false

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    })

    try {
      await this.transporter.verify()
      console.log('Email service initialized successfully')
      return true
    } catch (error) {
      console.error('Email service initialization failed:', error)
      this.transporter = null
      return false
    }
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    const config = getEmailConfig()
    
    // If no SMTP configured, log the email
    if (!config || !this.transporter) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📧 EMAIL (Not configured - logged only)')
      console.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`)
      console.log(`Subject: ${options.subject}`)
      console.log('---')
      console.log(options.text || options.html.replace(/<[^>]*>/g, ''))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Log to database
      await this.logEmailSent(options, null, 'logged_only')
      
      return { success: true, messageId: `logged-${Date.now()}` }
    }

    try {
      const result = await this.transporter.sendMail({
        from: `"${config.from.name}" <${config.from.address}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      })

      // Log to database
      await this.logEmailSent(options, result.messageId, 'sent')

      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Error sending email:', error)
      
      // Log failure to database
      await this.logEmailSent(options, null, 'failed', error instanceof Error ? error.message : 'Unknown error')
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  private async logEmailSent(
    options: EmailOptions, 
    messageId: string | null, 
    status: string,
    error?: string
  ) {
    try {
      await db.emailLog.create({
        data: {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          status,
          messageId,
          error,
          sentAt: new Date()
        }
      })
    } catch (e) {
      // EmailLog table might not exist yet
      console.log('Could not log email:', e)
    }
  }

  isConfigured(): boolean {
    return isEmailConfigured()
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Initialize on first import
emailService.initialize().catch(console.error)
