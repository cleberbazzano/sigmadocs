import { db } from '@/lib/db'

export interface DocumentExpiringData {
  documentId: string
  documentTitle: string
  documentNumber?: string | null
  expirationDate: Date
  daysUntilExpiration: number
  category?: string | null
  authorName: string
  authorEmail: string
}

export interface EscalationData extends DocumentExpiringData {
  originalUserName: string
  originalUserEmail: string
  daysOverdue: number
}

/**
 * Email templates for Sigma DOCs
 */
export const emailTemplates = {
  /**
   * Document expiration alert
   */
  documentExpiring: (data: DocumentExpiringData, recipientName: string) => ({
    subject: `⚠️ Alerta de Vencimento: ${data.documentTitle}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Vencimento</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">📄 Sigma DOCs</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.8;">Sistema de Gestão Eletrônica de Documentos</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
    <p>Olá, <strong>${recipientName}</strong>,</p>
    
    <div style="background: ${data.daysUntilExpiration <= 0 ? '#fef2f2' : data.daysUntilExpiration <= 7 ? '#fffbeb' : '#f0fdf4'}; 
                border-left: 4px solid ${data.daysUntilExpiration <= 0 ? '#ef4444' : data.daysUntilExpiration <= 7 ? '#f59e0b' : '#22c55e'};
                padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h2 style="margin: 0 0 10px 0; color: ${data.daysUntilExpiration <= 0 ? '#dc2626' : data.daysUntilExpiration <= 7 ? '#d97706' : '#16a34a'};">
        ${data.daysUntilExpiration <= 0 ? '🚨 DOCUMENTO VENCIDO' : '⚠️ Documento Próximo do Vencimento'}
      </h2>
      <p style="margin: 0; font-size: 14px;">
        ${data.daysUntilExpiration <= 0 
          ? `Este documento venceu há ${Math.abs(data.daysUntilExpiration)} dia(s)` 
          : `Este documento vence em ${data.daysUntilExpiration} dia(s)`
        }
      </p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 40%;">Documento:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${data.documentTitle}</td>
      </tr>
      ${data.documentNumber ? `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Número:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${data.documentNumber}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Data de Vencimento:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: ${data.daysUntilExpiration <= 0 ? '#dc2626' : 'inherit'};">
          ${new Date(data.expirationDate).toLocaleDateString('pt-BR')}
        </td>
      </tr>
      ${data.category ? `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Categoria:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${data.category}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 10px; font-weight: bold;">Responsável:</td>
        <td style="padding: 10px;">${data.authorName}</td>
      </tr>
    </table>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents/${data.documentId}" 
         style="background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Ver Documento
      </a>
    </div>
    
    <p style="font-size: 12px; color: #64748b; text-align: center;">
      Este é um email automático do sistema Sigma DOCs. Não responda diretamente.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Sigma DOCs - Sistema de Gestão Eletrônica de Documentos

Olá, ${recipientName},

${data.daysUntilExpiration <= 0 ? '🚨 DOCUMENTO VENCIDO' : '⚠️ Documento Próximo do Vencimento'}

${data.daysUntilExpiration <= 0 
  ? `Este documento venceu há ${Math.abs(data.daysUntilExpiration)} dia(s)` 
  : `Este documento vence em ${data.daysUntilExpiration} dia(s)`
}

Detalhes:
- Documento: ${data.documentTitle}
${data.documentNumber ? `- Número: ${data.documentNumber}` : ''}
- Data de Vencimento: ${new Date(data.expirationDate).toLocaleDateString('pt-BR')}
${data.category ? `- Categoria: ${data.category}` : ''}
- Responsável: ${data.authorName}

Acesse o sistema para tomar as devidas providências.

Este é um email automático do sistema Sigma DOCs.
    `.trim()
  }),

  /**
   * Escalation alert - when user hasn't acted on expiration
   */
  escalationAlert: (data: EscalationData, recipientName: string) => ({
    subject: `🚨 ESCALAÇÃO: Documento ${data.daysOverdue > 0 ? 'Vencido há ' + data.daysOverdue + ' dias' : 'Próximo do Vencimento'}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Escalação</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">🚨 Alerta de Escalação</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.8;">Ação não realizada pelo responsável</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
    <p>Olá, <strong>${recipientName}</strong>,</p>
    
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: #dc2626;">⚠️ Atenção Necessária</h3>
      <p style="margin: 0;">O responsável <strong>${data.originalUserName}</strong> (${data.originalUserEmail}) não tomou providências sobre o documento abaixo.</p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 40%;">Documento:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${data.documentTitle}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Status:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">
          ${data.daysOverdue > 0 ? `Vencido há ${data.daysOverdue} dia(s)` : 'A vencer'}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Data de Vencimento:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${new Date(data.expirationDate).toLocaleDateString('pt-BR')}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold;">Responsável Original:</td>
        <td style="padding: 10px;">${data.originalUserName} (${data.originalUserEmail})</td>
      </tr>
    </table>
    
    <p>Por favor, tome as providências necessárias ou entre em contato com o responsável.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents/${data.documentId}" 
         style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Ver Documento
      </a>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Sigma DOCs - Alerta de Escalação

Olá, ${recipientName},

O responsável ${data.originalUserName} (${data.originalUserEmail}) não tomou providências sobre o documento:

- Documento: ${data.documentTitle}
- Status: ${data.daysOverdue > 0 ? `Vencido há ${data.daysOverdue} dia(s)` : 'A vencer'}
- Data de Vencimento: ${new Date(data.expirationDate).toLocaleDateString('pt-BR')}

Por favor, tome as providências necessárias.

Este é um email automático do sistema Sigma DOCs.
    `.trim()
  }),

  /**
   * Password reset email
   */
  passwordReset: (userName: string, resetToken: string, resetUrl: string) => ({
    subject: '🔐 Redefinição de Senha - Sigma DOCs',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">🔐 Redefinição de Senha</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
    <p>Olá, <strong>${userName}</strong>,</p>
    <p>Recebemos uma solicitação para redefinir sua senha.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}?token=${resetToken}" 
         style="background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Redefinir Senha
      </a>
    </div>
    
    <p style="font-size: 12px; color: #64748b;">Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este email.</p>
  </div>
</body>
</html>
    `,
    text: `
Redefinição de Senha - Sigma DOCs

Olá, ${userName},

Recebemos uma solicitação para redefinir sua senha.

Acesse o link abaixo para redefinir:
${resetUrl}?token=${resetToken}

Este link expira em 1 hora.
    `.trim()
  })
}

/**
 * Send document expiration notification
 */
export async function sendExpirationNotification(
  data: DocumentExpiringData,
  recipientEmail: string,
  recipientName: string
): Promise<{ success: boolean; error?: string }> {
  const { emailService } = await import('./service')
  const template = emailTemplates.documentExpiring(data, recipientName)
  
  const result = await emailService.send({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  })

  // Log notification to database
  try {
    await db.notification.create({
      data: {
        userId: await getUserIdByEmail(recipientEmail) || 'unknown',
        title: template.subject,
        message: `Documento "${data.documentTitle}" ${data.daysUntilExpiration <= 0 ? 'vencido' : 'próximo do vencimento'}`,
        type: data.daysUntilExpiration <= 0 ? 'error' : 'warning',
        link: `/documents/${data.documentId}`,
        metadata: JSON.stringify({
          documentId: data.documentId,
          expirationDate: data.expirationDate,
          daysUntilExpiration: data.daysUntilExpiration
        })
      }
    })
  } catch (e) {
    console.error('Error creating notification:', e)
  }

  return result
}

/**
 * Send escalation notification
 */
export async function sendEscalationNotification(
  data: EscalationData,
  recipientEmail: string,
  recipientName: string
): Promise<{ success: boolean; error?: string }> {
  const { emailService } = await import('./service')
  const template = emailTemplates.escalationAlert(data, recipientName)
  
  const result = await emailService.send({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  })

  // Log escalation to database
  try {
    await db.notification.create({
      data: {
        userId: await getUserIdByEmail(recipientEmail) || 'unknown',
        title: template.subject,
        message: `Escalação: ${data.originalUserName} não tratou documento "${data.documentTitle}"`,
        type: 'error',
        link: `/documents/${data.documentId}`,
        metadata: JSON.stringify({
          documentId: data.documentId,
          originalUserId: data.originalUserEmail,
          daysOverdue: data.daysOverdue,
          type: 'escalation'
        })
      }
    })
  } catch (e) {
    console.error('Error creating escalation notification:', e)
  }

  return result
}

async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true }
    })
    return user?.id || null
  } catch {
    return null
  }
}
