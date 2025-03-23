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
  private psqlPath: string;

  constructor() {
    this.backupPath = '/tmp/backup.sql.gz';
    this.psqlPath = '/usr/bin/psql';
  }

  private async verifyPsql(): Promise<void> {
    try {
      await execAsync(`which psql`);
      logger.info('psql is available in PATH');
    } catch (error) {
      logger.error('psql not found in PATH, trying to use full path');
      try {
        await execAsync(`ls -l ${this.psqlPath}`);
        logger.info('Found psql at full path');
      } catch (error) {
        throw new Error('psql not found in PATH or at full path');
      }
    }
  }

  private async executeBackup(): Promise<void> {
    // Create backup from source database
    const backupCommand = `pg_dump "${env.SOURCE_DATABASE_URL}" | gzip > ${this.backupPath}`;
    await execAsync(backupCommand);
    logger.info('Backup created successfully');
  }

  private async restoreToTarget(): Promise<void> {
    // Restore backup to target database
    const restoreCommand = `gunzip -c ${this.backupPath} | ${this.psqlPath} "${env.TARGET_DATABASE_URL}"`;
    logger.info('Executing restore command:', restoreCommand);
    await execAsync(restoreCommand);
    logger.info('Backup restored to target database successfully');
  }

  public async performBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    try {
      await this.verifyPsql();
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