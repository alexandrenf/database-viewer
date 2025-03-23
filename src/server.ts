import express from 'express';
import { CronJob } from 'cron';
import { env } from './config/env';
import { logger } from './config/logger';
import { BackupService } from './services/backup';

const app = express();
const backupService = new BackupService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Manual backup trigger endpoint
app.post('/backup', async (req, res) => {
  try {
    const result = await backupService.performBackup();
    res.json(result);
  } catch (error) {
    logger.error('Manual backup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Backup failed',
    });
  }
});

// Start the server
const port = env.PORT;
app.listen(port, async () => {
  logger.info(`Server running on port ${port}`);
  
  // Run initial backup on server start
  try {
    logger.info('Running initial backup on server start');
    const result = await backupService.performBackup();
    logger.info('Initial backup completed', result);
  } catch (error) {
    logger.error('Initial backup failed:', error);
  }

  // Schedule automated backups
  const backupJob = new CronJob(
    env.BACKUP_SCHEDULE,
    async () => {
      logger.info('Starting scheduled backup');
      const result = await backupService.performBackup();
      logger.info('Scheduled backup completed', result);
    },
    null, // onComplete
    false, // start
    'UTC' // timeZone
  );

  backupJob.start();
  logger.info(`Scheduled backup job started with cron expression: ${env.BACKUP_SCHEDULE}`);
}); 