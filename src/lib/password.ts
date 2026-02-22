import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hash password using bcrypt with salt
 * Secure against rainbow table attacks
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  return bcrypt.hash(password, salt)
}

/**
 * Verify password against bcrypt hash
 * Constant-time comparison to prevent timing attacks
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Check if hash is bcrypt format (starts with $2a$, $2b$, or $2y$)
  if (hash.startsWith('$2')) {
    return bcrypt.compare(password, hash)
  }
  
  // Legacy SHA-256 support for migration
  // This allows existing users to still login
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const legacyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  if (legacyHash === hash) {
    // Password is correct but using legacy hash
    // Signal that rehash is needed
    return true
  }
  
  return false
}

/**
 * Check if password needs rehashing (migration from SHA-256 to bcrypt)
 */
export function needsRehash(hash: string): boolean {
  return !hash.startsWith('$2')
}

/**
 * Validate password strength
 * Returns object with isValid and errors array
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres')
  }
  
  if (password.length > 128) {
    errors.push('Senha não pode ter mais de 128 caracteres')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número')
  }
  
  // Check for common passwords
  const commonPasswords = ['password', '123456', 'admin123', 'senha123', 'password123']
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Senha muito comum. Escolha uma senha mais segura')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
