FROM node:20-bullseye

# Install PostgreSQL client tools and verify installation
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    # Verify installation and show paths
    which psql && \
    which pg_dump && \
    psql --version && \
    pg_dump --version && \
    # Show the actual locations
    ls -l $(which psql) && \
    ls -l $(which pg_dump)

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

# Verify PostgreSQL tools are available
RUN which psql && \
    which pg_dump && \
    echo "PATH: $PATH"

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 