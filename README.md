# PostgreSQL Backup Service

A Node.js service for automated PostgreSQL database backups with database-to-database restore functionality.

## Features

- Automated database-to-database backups using pg_dump and psql
- Backup file compression (gzip)
- Configurable backup schedule (default: every 30 minutes)
- Health check endpoint
- Manual backup trigger endpoint
- Comprehensive logging
- Docker support

## Prerequisites

- Node.js 20 or later
- PostgreSQL client tools
- Docker and Docker Compose (for local development)
- Access to source and target databases

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```env
SOURCE_DATABASE_URL=postgresql://user:password@localhost:5432/source_database
TARGET_DATABASE_URL=postgresql://user:password@localhost:5432/target_database
BACKUP_RETENTION_DAYS=7
BACKUP_SCHEDULE="*/30 * * * *"
PORT=3000
NODE_ENV=development
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development environment:
   ```bash
   docker-compose up -d
   ```

3. Run the service:
   ```bash
   npm run dev
   ```

The service will be available at `http://localhost:3000`.

## Docker Deployment

1. Build the image:
   ```bash
   docker build -t postgres-backup-service .
   ```

2. Run the container:
   ```bash
   docker run -d \
     --name postgres-backup \
     -p 3000:3000 \
     --env-file .env \
     postgres-backup-service
   ```

## Coolify Deployment

1. Create a new service in Coolify
2. Connect your Git repository
3. Configure the following settings:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Port: 3000
   - Health Check URL: `/health`
   - Resource Limits:
     - CPU: 0.5 CPU
     - Memory: 512MB
     - Storage: 1GB

4. Add the required environment variables in Coolify's dashboard

## API Endpoints

### Health Check
```
GET /health
Response: { "status": "healthy" }
```

### Manual Backup Trigger
```
POST /backup
Response: {
  "success": true,
  "size": 1234567,
  "duration": 1234
}
```

## Backup Schedule

The backup schedule is configured using a cron expression. Default is every 30 minutes:
```
*/30 * * * *
```

## Monitoring

The service provides basic monitoring through:
- Health check endpoint
- Logging of backup operations
- Backup metrics (size, duration, success/failure)

## Security Considerations

- All sensitive data is handled through environment variables
- Database credentials are never logged
- SSL/TLS is required for database connections
- Temporary files are automatically cleaned up

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
