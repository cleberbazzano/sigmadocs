import { db } from '@/lib/db'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

const execAsync = promisify(exec)

export interface BackupOptions {
  type: 'full' | 'incremental'
  createdBy?: string
}

export interface BackupResult {
  success: boolean
  backupId?: string
  filename?: string
  filepath?: string
  fileSize?: number
  error?: string
}

/**
 * Create a backup of the database
 */
export async function createBackup(options: BackupOptions = { type: 'full' }): Promise<BackupResult> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-${options.type}-${timestamp}.db`
    const backupDir = path.join(process.cwd(), 'backups')
    const filepath = path.join(backupDir, filename)

    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true })

    // Get database path from environment
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'db', 'custom.db')

    // Copy database file
    await fs.copyFile(dbPath, filepath)

    // Get file stats
    const stats = await fs.stat(filepath)
    const fileBuffer = await fs.readFile(filepath)
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    // Count records
    const documentsCount = await db.document.count()
    const usersCount = await db.user.count()
    
    // Get total records count (approximate)
    const tables = await db.$queryRaw<any[]>`SELECT name FROM sqlite_master WHERE type='table'`
    let totalRecords = 0
    for (const table of tables) {
      try {
        const count = await db.$queryRaw<any[]>`SELECT COUNT(*) as count FROM ${table.name}`
        totalRecords += count[0]?.count || 0
      } catch {
        // Skip tables that can't be counted
      }
    }

    // Create backup record
    const backup = await db.backupRecord.create({
      data: {
        filename,
        filepath,
        fileSize: stats.size,
        fileHash,
        type: options.type,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 0,
        documentsCount,
        usersCount,
        totalRecords,
        createdBy: options.createdBy || null,
        isAutomatic: !options.createdBy
      }
    })

    return {
      success: true,
      backupId: backup.id,
      filename,
      filepath,
      fileSize: stats.size
    }
  } catch (error) {
    console.error('Backup error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Restore database from backup
 */
export async function restoreBackup(
  backupId: string,
  restoredBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const backup = await db.backupRecord.findUnique({
      where: { id: backupId }
    })

    if (!backup) {
      return { success: false, error: 'Backup não encontrado' }
    }

    if (backup.status !== 'completed') {
      return { success: false, error: 'Backup não está completo' }
    }

    // Verify file exists
    try {
      await fs.access(backup.filepath)
    } catch {
      return { success: false, error: 'Arquivo de backup não encontrado' }
    }

    // Verify hash
    const fileBuffer = await fs.readFile(backup.filepath)
    const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    
    if (currentHash !== backup.fileHash) {
      return { success: false, error: 'Integridade do backup comprometida' }
    }

    // Get current database path
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'db', 'custom.db')
    
    // Create a backup of current database before restore
    const preRestoreBackup = `${dbPath}.pre-restore-${Date.now()}`
    await fs.copyFile(dbPath, preRestoreBackup)

    // Restore backup
    await fs.copyFile(backup.filepath, dbPath)

    // Update backup record
    await db.backupRecord.update({
      where: { id: backupId },
      data: {
        restoredAt: new Date(),
        restoredBy
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Restore error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * List available backups
 */
export async function listBackups(limit: number = 20) {
  try {
    const backups = await db.backupRecord.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return backups.map(backup => ({
      id: backup.id,
      filename: backup.filename,
      fileSize: backup.fileSize,
      type: backup.type,
      status: backup.status,
      documentsCount: backup.documentsCount,
      usersCount: backup.usersCount,
      totalRecords: backup.totalRecords,
      completedAt: backup.completedAt,
      isAutomatic: backup.isAutomatic
    }))
  } catch (error) {
    console.error('Error listing backups:', error)
    return []
  }
}

/**
 * Delete old backups (keep last N)
 */
export async function cleanupOldBackups(keepCount: number = 10): Promise<number> {
  const backups = await db.backupRecord.findMany({
    where: { status: 'completed' },
    orderBy: { createdAt: 'desc' },
    skip: keepCount
  })

  let deleted = 0
  for (const backup of backups) {
    try {
      // Delete file
      await fs.unlink(backup.filepath)
      // Delete record
      await db.backupRecord.delete({ where: { id: backup.id } })
      deleted++
    } catch (error) {
      console.error(`Error deleting backup ${backup.id}:`, error)
    }
  }

  return deleted
}

/**
 * Get backup statistics
 */
export async function getBackupStats() {
  const total = await db.backupRecord.count()
  const totalSize = await db.backupRecord.aggregate({
    _sum: { fileSize: true }
  })
  const latestBackup = await db.backupRecord.findFirst({
    where: { status: 'completed' },
    orderBy: { completedAt: 'desc' }
  })

  return {
    totalBackups: total,
    totalSize: totalSize._sum.fileSize || 0,
    latestBackup: latestBackup ? {
      id: latestBackup.id,
      filename: latestBackup.filename,
      completedAt: latestBackup.completedAt,
      documentsCount: latestBackup.documentsCount,
      usersCount: latestBackup.usersCount
    } : null
  }
}
