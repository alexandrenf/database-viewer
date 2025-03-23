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
  private pgDumpPath: string;

  constructor() {
    this.backupPath = '/tmp/backup.sql.gz';
    this.psqlPath = '/usr/bin/psql';
    this.pgDumpPath = '/usr/bin/pg_dump';
  }

  private async verifyTools(): Promise<void> {
    try {
      // Check psql
      const { stdout: psqlPath } = await execAsync('which psql');
      this.psqlPath = psqlPath.trim();
      logger.info('psql found at:', this.psqlPath);
      
      // Check pg_dump
      const { stdout: pgDumpPath } = await execAsync('which pg_dump');
      this.pgDumpPath = pgDumpPath.trim();
      logger.info('pg_dump found at:', this.pgDumpPath);
    } catch (error) {
      logger.error('PostgreSQL tools not found:', error);
      throw new Error('PostgreSQL tools not found in PATH');
    }
  }

  private async executeBackup(): Promise<void> {
    // Create backup from source database
    const backupCommand = `${this.pgDumpPath} "${env.SOURCE_DATABASE_URL}" | gzip > ${this.backupPath}`;
    logger.info('Executing backup command:', backupCommand);
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
      await this.verifyTools();
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