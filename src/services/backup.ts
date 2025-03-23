import { exec } from 'child_process';
import { promisify } from 'util';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface BackupResult {
  success: boolean;
  size: number;
  duration: number;
  error?: string;
}

export class BackupService {
  private backupPath: string;

  constructor() {
    this.backupPath = '/tmp/backup.sql.gz';
  }

  private async executeBackup(): Promise<void> {
    // Create backup from source database
    const backupCommand = `pg_dump "${env.SOURCE_DATABASE_URL}" | gzip > ${this.backupPath}`;
    await execAsync(backupCommand);
    logger.info('Backup created successfully');
  }

  private async restoreToTarget(): Promise<void> {
    // Restore backup to target database
    const restoreCommand = `gunzip -c ${this.backupPath} | psql "${env.TARGET_DATABASE_URL}"`;
    await execAsync(restoreCommand);
    logger.info('Backup restored to target database successfully');
  }

  public async performBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    try {
      await this.executeBackup();
      await this.restoreToTarget();

      const stats = await promisify(require('fs').stat)(this.backupPath);
      await unlink(this.backupPath);

      return {
        success: true,
        size: stats.size,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Backup failed:', error);
      return {
        success: false,
        size: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }
} 