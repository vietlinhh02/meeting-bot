# Meeting Bot

AI-powered meeting bot similar to Recall AI - automatically records, transcribes, and summarizes meetings.

## Features

- Automatic meeting recording
- Speech-to-text transcription
- AI-powered meeting summaries
- Action items extraction and analysis
- Meeting history storage and management

## Requirements

- Node.js >= 18.0.0
- pnpm (recommended) or npm
- Docker and Docker Compose (for local development)
- OR manually installed: PostgreSQL, Redis, MinIO (for production)

## Quick Start with Docker (Recommended)

The fastest way to get started is using Docker Compose, which sets up all required services automatically.

### 1. Clone the repository

```bash
git clone https://github.com/vietlinhh02/meeting-bot.git
cd meeting-bot
```

### 2. Start all services with Docker Compose

```bash
# Start PostgreSQL, Redis, and MinIO
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready (about 10-15 seconds)
docker-compose -f docker-compose.dev.yml ps
```

This will start:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **MinIO** on ports 9000 (API) and 9001 (Console)

### 3. Set up environment variables

```bash
cp .env.example .env
```

The default values in `.env.example` are pre-configured for Docker Compose. You only need to add your API keys:
- `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET`
- `DEEPGRAM_API_KEY`
- `OPENAI_API_KEY`

### 4. Install dependencies

```bash
pnpm install
# or
npm install
```

### 5. Set up the database

```bash
# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# (Optional) Seed the database
pnpm db:seed
```

### 6. Start the application

```bash
# Development mode with auto-reload
pnpm dev
```

The application will be available at `http://localhost:3000`

### Accessing Services

- **Application**: http://localhost:3000
- **MinIO Console**: http://localhost:9001 (login: minioadmin/minioadmin)
- **Prisma Studio**: `pnpm prisma:studio` (http://localhost:5555)

### Stopping Services

```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove all data (clean slate)
docker-compose -f docker-compose.dev.yml down -v
```

## Manual Installation (Without Docker)

If you prefer to install services manually:

### 1. Install PostgreSQL

```bash
# macOS with Homebrew
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt-get install postgresql-16
sudo systemctl start postgresql
```

Create database:
```bash
createdb meetingbot
```

### 2. Install Redis

```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### 3. Install MinIO

```bash
# Using Docker (recommended)
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# Create bucket
# Access MinIO Console at http://localhost:9001
# Login with minioadmin/minioadmin
# Create bucket named "meeting-recordings"
```

### 4. Configure environment

Update `.env` with your local service URLs:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/meetingbot
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost
# ... other configuration
```

### 5. Complete setup

Follow steps 4-6 from the Docker Quick Start above

## Usage

**Development mode with auto-reload:**

```bash
pnpm dev
```

**Build for production:**

```bash
pnpm build
```

**Run production build:**

```bash
pnpm start
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with auto-reload |
| `pnpm build` | Build TypeScript to JavaScript |
| `pnpm start` | Run production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint errors |
| `pnpm format` | Format code with Prettier |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm prisma:studio` | Open Prisma Studio |

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose -f docker-compose.dev.yml up -d` | Start all services in background |
| `docker-compose -f docker-compose.dev.yml ps` | Check service status |
| `docker-compose -f docker-compose.dev.yml logs -f` | View logs (real-time) |
| `docker-compose -f docker-compose.dev.yml logs [service]` | View specific service logs |
| `docker-compose -f docker-compose.dev.yml down` | Stop all services |
| `docker-compose -f docker-compose.dev.yml down -v` | Stop and remove volumes |
| `docker-compose -f docker-compose.dev.yml restart [service]` | Restart specific service |

## Project Structure

```
meeting-bot/
├── src/
│   ├── api/           # API routes and controllers
│   ├── services/      # Business logic services
│   ├── models/        # Data models (if not using Prisma)
│   ├── utils/         # Utility functions
│   ├── config/        # Configuration files (Redis, MinIO, Logger)
│   ├── middlewares/   # Express middlewares
│   ├── queue/         # BullMQ queue configuration
│   └── index.ts       # Application entry point
├── prisma/
│   └── schema.prisma  # Prisma database schema
├── dist/              # Compiled JavaScript (generated)
├── logs/              # Application logs
└── tests/             # Test files
```

## Technology Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: BullMQ
- **Storage**: MinIO (S3-compatible)
- **Logging**: Winston
- **Validation**: Joi
- **Authentication**: JWT + bcryptjs
- **Scheduling**: node-cron

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Troubleshooting

### Docker Issues

**Services won't start:**
```bash
# Check Docker daemon is running
docker ps

# Check for port conflicts
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Remove old containers and volumes
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

**Database connection errors:**
```bash
# Wait for PostgreSQL to be fully ready
docker-compose -f docker-compose.dev.yml logs postgres

# Check database is accessible
docker exec -it meeting-bot-postgres psql -U meetingbot -d meetingbot -c "SELECT 1;"
```

**MinIO bucket not created:**
```bash
# Check minio-init logs
docker-compose -f docker-compose.dev.yml logs minio-init

# Manually create bucket
docker exec -it meeting-bot-minio-init sh
mc alias set myminio http://minio:9000 minioadmin minioadmin
mc mb myminio/meeting-recordings
```

### Application Issues

**Port already in use:**
```bash
# Change PORT in .env file
PORT=3001
```

**Prisma migration errors:**
```bash
# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Or push schema without migration
pnpm prisma db push
```

**Module not found errors:**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Regenerate Prisma client
pnpm prisma:generate
```

**Redis connection errors:**
```bash
# Check Redis is running
docker-compose -f docker-compose.dev.yml logs redis

# Test connection
redis-cli ping
```

### Environment Variable Issues

**Missing API keys:**
- Copy `.env.example` to `.env`
- Add your actual API keys
- Restart the application

**Database URL format:**
```bash
# Correct format
DATABASE_URL=postgresql://username:password@host:port/database

# Example for Docker Compose
DATABASE_URL=postgresql://meetingbot:meetingbot_dev_password@localhost:5432/meetingbot
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before submitting pull requests.

## Security

Please see [SECURITY.md](./SECURITY.md) for security policy and reporting guidelines.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes and version history.

## License

MIT License - see [LICENSE](./LICENSE) for details.

