import crypto from 'crypto'

export interface CertificateInfo {
  commonName: string
  organization: string
  organizationUnit: string
  country: string
  state: string
  locality: string
  cpf: string | null
  validFrom: Date
  validTo: Date
  serialNumber: string
  issuer: string
  publicKey: string
}

export function parseCertificate(certificatePem: string): CertificateInfo | null {
  try {
    const cert = crypto.X509Certificate?.parse 
      ? new crypto.X509Certificate(certificatePem)
      : parsePEMCertificate(certificatePem)
    
    if (!cert) return null
    
    // Extrair informações do certificado
    const subject = parseDN(cert.subject || '')
    const issuer = parseDN(cert.issuer || '')
    
    return {
      commonName: subject.CN || '',
      organization: subject.O || '',
      organizationUnit: subject.OU || '',
      country: subject.C || '',
      state: subject.ST || '',
      locality: subject.L || '',
      cpf: extractCPF(subject.CN || subject.OU || ''),
      validFrom: new Date(cert.validFrom || ''),
      validTo: new Date(cert.validTo || ''),
      serialNumber: cert.serialNumber || '',
      issuer: issuer.CN || issuer.O || '',
      publicKey: cert.publicKey?.export?.() || ''
    }
  } catch (error) {
    console.error('Erro ao parsear certificado:', error)
    return null
  }
}

function parseDN(dn: string): Record<string, string> {
  const result: Record<string, string> = {}
  const parts = dn.split(',').map(p => p.trim())
  
  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key && value) {
      result[key] = value
    }
  }
  
  return result
}

function extractCPF(text: string): string | null {
  // Padrão CPF: 000.000.000-00 ou 00000000000
  const cpfMatch = text.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/)
  return cpfMatch ? cpfMatch[1] : null
}

function parsePEMCertificate(pem: string): any {
  // Implementação simplificada para ambientes sem suporte nativo a X509
  const lines = pem.split('\n')
  const base64 = lines
    .filter(l => !l.includes('-----BEGIN') && !l.includes('-----END'))
    .join('')
  
  return {
    subject: '',
    issuer: '',
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    serialNumber: '',
    publicKey: { export: () => base64 }
  }
}

export function signData(data: string, privateKeyPem: string): string {
  try {
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(data)
    sign.end()
    
    return sign.sign(privateKeyPem, 'base64')
  } catch (error) {
    console.error('Erro ao assinar dados:', error)
    throw new Error('Falha ao assinar documento')
  }
}

export function verifySignature(data: string, signature: string, publicKeyPem: string): boolean {
  try {
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(data)
    verify.end()
    
    return verify.verify(publicKeyPem, signature, 'base64')
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error)
    return false
  }
}

export function generateDocumentHash(content: Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

export function validateCertificateChain(certificatePem: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  try {
    const certInfo = parseCertificate(certificatePem)
    
    if (!certInfo) {
      errors.push('Certificado inválido')
      return { valid: false, errors }
    }
    
    // Verificar validade temporal
    const now = new Date()
    if (now < certInfo.validFrom) {
      errors.push('Certificado ainda não está ativo')
    }
    if (now > certInfo.validTo) {
      errors.push('Certificado expirado')
    }
    
    // Verificar se é um certificado ICP-Brasil (simplificado)
    if (!certInfo.organization && !certInfo.commonName) {
      errors.push('Certificado não contém informações do titular')
    }
    
    return { valid: errors.length === 0, errors }
  } catch (error) {
    errors.push('Erro ao validar certificado')
    return { valid: false, errors }
  }
}
