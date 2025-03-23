FROM node:20-slim

# Install PostgreSQL client tools and verify installation
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    which psql && \
    psql --version

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create necessary directories
RUN mkdir -p dist

# Copy compiled files to dist directory
RUN cp -r src/* dist/

# Verify psql is still available
RUN which psql

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 