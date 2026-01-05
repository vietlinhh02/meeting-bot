# Kế hoạch Migration: Meeting Bot từ Python/Django sang Node.js/Express

## Tóm tắt yêu cầu
- Chuyển đổi project meeting bot từ Python/Django sang Node.js với JavaScript ES Modules
- Sử dụng Express.js, Prisma ORM, PostgreSQL và MinIO
- Tạo project ở root level của repository hiện tại
- Chỉ setup Docker cho database/Redis/MinIO, code chạy local
- Scope: Core Bot API, Bot Controller & Media Processing, Webhooks & Event System

## Phân tích Project Python hiện tại

### Kiến trúc tổng quan
**attendee/** - Django project với các module chính:
- `attendee/accounts/` - User authentication, Organization management
- `attendee/bots/` - Core bot logic, API endpoints, models
- `attendee/bots/bot_controller/` - Media processing (audio/video)
- `attendee/bots/bot_pod_creator/` - Kubernetes pod management cho bots

### Database Models chính (từ models.py)
1. **Organization** - Tổ chức với credit system
2. **User** - Users thuộc Organization với role-based access
3. **Project** - Projects thuộc Organization
4. **Bot** - Meeting bots (state machine: joining -> in_meeting -> leaving -> ended)
5. **ZoomOAuthApp** & **ZoomOAuthConnection** - Zoom credentials
6. **GoogleMeetBotLogin** & **GoogleMeetBotLoginGroup** - Google Meet credentials
7. **Recording**, **Utterance**, **ChatMessage** - Meeting artifacts
8. **MediaBlob**, **AsyncTranscription** - Media storage references

### Tech Stack hiện tại
- **Framework**: Django 5.1.14 + Django REST Framework
- **Database**: PostgreSQL (psycopg2)
- **Cache/Queue**: Redis + Celery 5.4.0 (task queue)
- **Storage**: AWS S3 / Azure Storage / MinIO (via django-storages)
- **Auth**: django-allauth (Google OAuth), Token authentication
- **Media**: GStreamer pipeline, Selenium (for Google Meet), Zoom Meeting SDK
- **Encryption**: Fernet (cryptography) cho credentials

### API Endpoints chính (từ urls.py)
- `/api/v1/bots` - Bot CRUD operations
- `/api/v1/calendars` - Calendar integrations
- `/api/v1/zoom_oauth_connections` - Zoom OAuth management
- `/api/v1/app_session` - App session management
- `/external_webhooks/` - Nhận webhooks từ platforms
- `/bot_sso/` - SSO cho bots

## Kế hoạch Implementation Node.js

### Cấu trúc thư mục đề xuất
```
meeting-bot/
├── attendee/              (Python code - giữ nguyên)
├── src/                   (Node.js code mới)
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── storage.js    (MinIO config)
│   ├── models/           (Prisma generated)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── bot.controller.js
│   │   ├── organization.controller.js
│   │   └── webhook.controller.js
│   ├── services/
│   │   ├── bot/
│   │   │   ├── bot.service.js
│   │   │   ├── bot-lifecycle.service.js
│   │   │   └── bot-state-machine.service.js
│   │   ├── media/
│   │   │   ├── recording.service.js
│   │   │   ├── transcription.service.js
│   │   │   └── storage.service.js (MinIO)
│   │   ├── platform/
│   │   │   ├── zoom.service.js
│   │   │   └── google-meet.service.js
│   │   └── queue/
│   │       └── worker.service.js (Bull/BullMQ)
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   ├── routes/
│   │   ├── api/
│   │   │   ├── bots.routes.js
│   │   │   ├── organizations.routes.js
│   │   │   └── webhooks.routes.js
│   │   └── index.js
│   ├── utils/
│   │   ├── encryption.js (Fernet replacement)
│   │   ├── logger.js
│   │   └── validators.js
│   └── app.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker-compose.dev.yml (Chỉ DB, Redis, MinIO)
├── package.json
├── .env.example
└── README.nodejs.md
```

### Phase 1: Project Setup & Infrastructure

#### 1.1 Initialize Node.js Project
**Files to create:**
- `package.json` với dependencies:
  - express (^4.18.0)
  - @prisma/client (^5.0.0)
  - prisma (dev dependency)
  - ioredis (Redis client)
  - bull hoặc bullmq (Job queue thay Celery)
  - minio (MinIO SDK)
  - dotenv
  - helmet, cors, compression
  - winston (logging)
  - joi (validation)
  - jsonwebtoken (JWT)
  - bcryptjs (password hashing)
  - node-cron (scheduler thay Celery beat)

#### 1.2 Docker Compose cho Services
**File: docker-compose.dev.yml**
- PostgreSQL container (port 5432)
- Redis container (port 6379)
- MinIO container (ports 9000, 9001)
- MinIO init container (tạo bucket)

#### 1.3 Environment Configuration
**File: .env.example**
```
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/meetingbot

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=meeting-recordings

# JWT
JWT_SECRET=your-secret-key
CREDENTIALS_ENCRYPTION_KEY=your-fernet-key

# API Keys
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
DEEPGRAM_API_KEY=
```

### Phase 2: Database Migration với Prisma

#### 2.1 Prisma Schema
**File: prisma/schema.prisma**

Chuyển đổi Django models sang Prisma schema:

```prisma
// Organization model (từ accounts/models.py)
model Organization {
  id                            Int       @id @default(autoincrement())
  name                          String
  centicredits                  Int       @default(500)
  version                       Int       @default(0)
  isWebhooksEnabled             Boolean   @default(true) @map("is_webhooks_enabled")
  isAsyncTranscriptionEnabled   Boolean   @default(false) @map("is_async_transcription_enabled")
  isManagedZoomOauthEnabled     Boolean   @default(true) @map("is_managed_zoom_oauth_enabled")
  isAppSessionsEnabled          Boolean   @default(false) @map("is_app_sessions_enabled")
  createdAt                     DateTime  @default(now()) @map("created_at")
  updatedAt                     DateTime  @updatedAt @map("updated_at")

  users                         User[]
  projects                      Project[]

  @@map("organizations")
}

// User model (từ accounts/models.py)
model User {
  id             Int           @id @default(autoincrement())
  objectId       String        @unique @map("object_id")
  email          String        @unique
  password       String
  firstName      String?       @map("first_name")
  lastName       String?       @map("last_name")
  role           UserRole      @default(ADMIN)
  isActive       Boolean       @default(true) @map("is_active")
  organizationId Int           @map("organization_id")
  invitedById    Int?          @map("invited_by_id")
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  organization   Organization  @relation(fields: [organizationId], references: [id])
  invitedBy      User?         @relation("UserInvites", fields: [invitedById], references: [id])
  invitedUsers   User[]        @relation("UserInvites")
  apiKeys        ApiKey[]

  @@map("users")
}

enum UserRole {
  ADMIN
  REGULAR_USER
}

// Project model (từ bots/models.py)
model Project {
  id             Int           @id @default(autoincrement())
  objectId       String        @unique @map("object_id")
  name           String
  organizationId Int           @map("organization_id")
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  organization   Organization  @relation(fields: [organizationId], references: [id])
  bots           Bot[]
  zoomOauthApps  ZoomOAuthApp[]

  @@map("projects")
}

// Bot model - Core model
model Bot {
  id                    Int           @id @default(autoincrement())
  objectId              String        @unique @map("object_id")
  meetingUrl            String        @map("meeting_url")
  botName               String?       @map("bot_name")
  state                 BotState      @default(JOINING)
  transcriptionState    TranscriptionState @default(NOT_STARTED) @map("transcription_state")
  recordingState        RecordingState @default(NOT_STARTED) @map("recording_state")
  projectId             Int           @map("project_id")
  metadata              Json?
  createdAt             DateTime      @default(now()) @map("created_at")
  updatedAt             DateTime      @updatedAt @map("updated_at")
  joinedAt              DateTime?     @map("joined_at")
  leftAt                DateTime?     @map("left_at")

  project               Project       @relation(fields: [projectId], references: [id])
  recordings            Recording[]
  utterances            Utterance[]
  events                BotEvent[]

  @@map("bots")
}

enum BotState {
  JOINING
  IN_MEETING
  LEAVING
  ENDED
  FAILED
}

enum TranscriptionState {
  NOT_STARTED
  IN_PROGRESS
  COMPLETE
  FAILED
}

enum RecordingState {
  NOT_STARTED
  IN_PROGRESS
  COMPLETE
  FAILED
}

// Recording model
model Recording {
  id              Int       @id @default(autoincrement())
  objectId        String    @unique @map("object_id")
  botId           Int       @map("bot_id")
  storageKey      String    @map("storage_key")
  storageUrl      String?   @map("storage_url")
  duration        Int?
  fileSize        Int?      @map("file_size")
  mimeType        String?   @map("mime_type")
  createdAt       DateTime  @default(now()) @map("created_at")

  bot             Bot       @relation(fields: [botId], references: [id])

  @@map("recordings")
}

// Utterance model (transcript)
model Utterance {
  id              Int       @id @default(autoincrement())
  botId           Int       @map("bot_id")
  speakerName     String    @map("speaker_name")
  speakerUuid     String?   @map("speaker_uuid")
  transcription   String
  timestampMs     Int       @map("timestamp_ms")
  durationMs      Int       @map("duration_ms")
  createdAt       DateTime  @default(now()) @map("created_at")

  bot             Bot       @relation(fields: [botId], references: [id])

  @@map("utterances")
}

// Encrypted credentials storage
model ZoomOAuthApp {
  id                Int       @id @default(autoincrement())
  objectId          String    @unique @map("object_id")
  projectId         Int       @map("project_id")
  clientId          String    @map("client_id")
  encryptedData     Bytes     @map("encrypted_data")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  project           Project   @relation(fields: [projectId], references: [id])

  @@map("zoom_oauth_apps")
}

// Webhook events
model BotEvent {
  id         Int       @id @default(autoincrement())
  botId      Int       @map("bot_id")
  eventType  String    @map("event_type")
  eventData  Json?     @map("event_data")
  createdAt  DateTime  @default(now()) @map("created_at")

  bot        Bot       @relation(fields: [botId], references: [id])

  @@map("bot_events")
}
```

#### 2.2 Migration Strategy
1. Generate initial Prisma migration: `npx prisma migrate dev --name init`
2. Tạo seed script để import data từ Python DB (nếu cần)
3. Generate Prisma Client: `npx prisma generate`

### Phase 3: Core API Implementation

#### 3.1 Express App Setup
**File: src/app.js**
```javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';

const app = express();

// Security & optimization middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(errorHandler);

export default app;
```

#### 3.2 Authentication Middleware
**File: src/middleware/auth.middleware.js**
- Token-based authentication (tương tự Django REST Framework Token Auth)
- API Key validation
- Organization/Project access control

#### 3.3 Bot API Routes
**File: src/routes/api/bots.routes.js**

Endpoints:
- `POST /api/v1/bots` - Create bot & join meeting
- `GET /api/v1/bots/:id` - Get bot status
- `PATCH /api/v1/bots/:id` - Update bot
- `DELETE /api/v1/bots/:id` - Leave meeting & delete bot
- `GET /api/v1/bots/:id/transcript` - Get transcript
- `GET /api/v1/bots/:id/recording` - Get recording URL
- `POST /api/v1/bots/:id/speech` - Send speech to bot

#### 3.4 Bot Service Layer
**File: src/services/bot/bot.service.js**
- `createBot(projectId, meetingUrl, options)` - Tạo bot instance
- `updateBotState(botId, newState)` - State machine management
- `deleteBot(botId)` - Cleanup bot resources
- `getBotStatus(botId)` - Get current bot state

**File: src/services/bot/bot-lifecycle.service.js**
- `joinMeeting(bot)` - Khởi động bot process
- `leaveMeeting(bot)` - Graceful shutdown
- `handleBotFailure(bot, error)` - Error recovery

### Phase 4: Bot Controller & Media Processing

#### 4.1 Storage Service (MinIO)
**File: src/services/media/storage.service.js**
```javascript
import { Client } from 'minio';

class StorageService {
  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY
    });
  }

  async uploadRecording(botId, buffer, metadata) {
    const key = `recordings/${botId}/${Date.now()}.webm`;
    await this.client.putObject(
      process.env.MINIO_BUCKET,
      key,
      buffer,
      metadata
    );
    return key;
  }

  async getPresignedUrl(key, expirySeconds = 3600) {
    return await this.client.presignedGetObject(
      process.env.MINIO_BUCKET,
      key,
      expirySeconds
    );
  }
}
```

#### 4.2 Recording Service
**File: src/services/media/recording.service.js**
- Stream audio/video to storage
- Handle chunked uploads
- Generate recording metadata

#### 4.3 Transcription Service
**File: src/services/media/transcription.service.js**
- Integration với Deepgram API
- Real-time transcription streaming
- Store utterances to database

#### 4.4 Bot Controller Process
**Approach**: Vì phần bot controller Python sử dụng GStreamer, Selenium, Zoom SDK (C bindings), ta có 2 options:

**Option A (Recommended)**: Hybrid approach
- Giữ nguyên Python bot controller process (attendee/bots/bot_controller/)
- Node.js API server gọi Python script qua child_process hoặc queue
- Communication qua WebSocket hoặc Redis pub/sub

**Option B**: Pure Node.js (phức tạp hơn)
- Port GStreamer logic sang Node.js (sử dụng node-gstreamer hoặc FFmpeg)
- Sử dụng Puppeteer thay Selenium cho Google Meet
- Zoom SDK binding cho Node.js (nếu có)

**Recommendation**: Bắt đầu với Option A, sau đó dần migrate sang Option B

### Phase 5: Queue System (Thay Celery)

#### 5.1 Bull/BullMQ Setup
**File: src/services/queue/worker.service.js**
```javascript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

// Queues
export const botQueue = new Queue('bot-tasks', { connection });
export const transcriptionQueue = new Queue('transcription-tasks', { connection });

// Workers
const botWorker = new Worker('bot-tasks', async (job) => {
  switch(job.name) {
    case 'join-meeting':
      return await joinMeetingTask(job.data);
    case 'leave-meeting':
      return await leaveMeetingTask(job.data);
    case 'process-recording':
      return await processRecordingTask(job.data);
  }
}, { connection });

const transcriptionWorker = new Worker('transcription-tasks', async (job) => {
  return await processTranscriptionTask(job.data);
}, { connection });
```

#### 5.2 Task Definitions
- `join-meeting` - Async bot joining process
- `leave-meeting` - Cleanup after meeting
- `process-recording` - Upload & transcode recordings
- `process-transcription` - Async transcription với Deepgram
- `send-webhook` - Webhook delivery với retries

#### 5.3 Scheduled Tasks (thay Celery Beat)
**File: src/services/queue/scheduler.service.js**
```javascript
import cron from 'node-cron';

// Check for stale bots every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await cleanupStaleBots();
});

// Process pending transcriptions
cron.schedule('* * * * *', async () => {
  await processPendingTranscriptions();
});
```

### Phase 6: Webhooks & Events

#### 6.1 Webhook Service
**File: src/services/webhook.service.js**
```javascript
import axios from 'axios';
import crypto from 'crypto';

class WebhookService {
  async sendWebhook(webhookUrl, event, data, secret) {
    const payload = { event, data, timestamp: new Date().toISOString() };
    const signature = this.generateSignature(payload, secret);

    try {
      await axios.post(webhookUrl, payload, {
        headers: {
          'X-Webhook-Signature': signature,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
    } catch (error) {
      // Queue for retry
      await webhookQueue.add('retry-webhook', {
        webhookUrl, event, data, secret, attempt: 1
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      });
    }
  }

  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}
```

#### 6.2 Event System
**File: src/services/event.service.js**
- Bot state change events (joining, joined, left, etc.)
- Recording events (started, completed, failed)
- Transcription events (utterance, completed)
- Publish events to webhooks + database

### Phase 7: Platform Integrations

#### 7.1 Zoom Service
**File: src/services/platform/zoom.service.js**
- OAuth flow
- Meeting SDK authentication
- Join token generation
- Webhook handling

#### 7.2 Google Meet Service
**File: src/services/platform/google-meet.service.js**
- SSO certificate handling
- Meeting URL parsing
- Bot login management

### Phase 8: Security & Utilities

#### 8.1 Encryption Utility (Fernet alternative)
**File: src/utils/encryption.js**
```javascript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.CREDENTIALS_ENCRYPTION_KEY, 'base64');

export function encrypt(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
}

export function decrypt(buffer) {
  const iv = buffer.slice(0, 16);
  const authTag = buffer.slice(16, 32);
  const encrypted = buffer.slice(32);

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
```

#### 8.2 Validation
**File: src/utils/validators.js**
- Joi schemas for request validation
- Meeting URL validation
- Webhook URL validation

#### 8.3 Logging
**File: src/utils/logger.js**
- Winston logger with JSON formatting
- Log levels matching Python logging
- Structured logging for production

## Implementation Order (Recommended)

### Stage 1: Foundation (Week 1)
1. Initialize Node.js project structure
2. Setup Docker Compose (PostgreSQL, Redis, MinIO)
3. Create Prisma schema
4. Implement basic Express app với health check
5. Setup environment configuration

### Stage 2: Core API (Week 2-3)
6. Implement authentication middleware
7. Create Organization/User/Project API endpoints
8. Implement Bot CRUD API
9. Setup Bull queue system
10. MinIO storage integration

### Stage 3: Bot Lifecycle (Week 4-5)
11. Bot state machine service
12. Hybrid Python bot controller integration
13. Recording service implementation
14. Transcription service (Deepgram integration)

### Stage 4: Platform Integration (Week 6)
15. Zoom OAuth implementation
16. Google Meet integration
17. Webhook system implementation
18. Event publishing system

### Stage 5: Testing & Polish (Week 7-8)
19. Unit tests (Jest)
20. Integration tests
21. API documentation (Swagger/OpenAPI)
22. Performance optimization
23. Error handling improvements

## Files to Create (Summary)

### Configuration
- [ ] `package.json` - Dependencies & scripts
- [ ] `.env.example` - Environment template
- [ ] `docker-compose.dev.yml` - Development services
- [ ] `.gitignore` - Node.js specific
- [ ] `README.nodejs.md` - Setup instructions

### Database
- [ ] `prisma/schema.prisma` - Database schema
- [ ] `prisma/seed.js` - Seed data script

### Core Application
- [ ] `src/app.js` - Express app initialization
- [ ] `src/server.js` - Server entry point
- [ ] `src/config/database.js` - Prisma client
- [ ] `src/config/redis.js` - Redis client
- [ ] `src/config/storage.js` - MinIO client

### Middleware
- [ ] `src/middleware/auth.middleware.js`
- [ ] `src/middleware/error.middleware.js`
- [ ] `src/middleware/validate.middleware.js`
- [ ] `src/middleware/rate-limit.middleware.js`

### Routes
- [ ] `src/routes/index.js`
- [ ] `src/routes/api/auth.routes.js`
- [ ] `src/routes/api/organizations.routes.js`
- [ ] `src/routes/api/projects.routes.js`
- [ ] `src/routes/api/bots.routes.js`
- [ ] `src/routes/api/webhooks.routes.js`

### Controllers
- [ ] `src/controllers/auth.controller.js`
- [ ] `src/controllers/organization.controller.js`
- [ ] `src/controllers/project.controller.js`
- [ ] `src/controllers/bot.controller.js`
- [ ] `src/controllers/webhook.controller.js`

### Services
- [ ] `src/services/auth.service.js`
- [ ] `src/services/bot/bot.service.js`
- [ ] `src/services/bot/bot-lifecycle.service.js`
- [ ] `src/services/bot/bot-state-machine.service.js`
- [ ] `src/services/media/storage.service.js`
- [ ] `src/services/media/recording.service.js`
- [ ] `src/services/media/transcription.service.js`
- [ ] `src/services/platform/zoom.service.js`
- [ ] `src/services/platform/google-meet.service.js`
- [ ] `src/services/queue/worker.service.js`
- [ ] `src/services/queue/scheduler.service.js`
- [ ] `src/services/webhook.service.js`
- [ ] `src/services/event.service.js`

### Utilities
- [ ] `src/utils/encryption.js`
- [ ] `src/utils/logger.js`
- [ ] `src/utils/validators.js`
- [ ] `src/utils/object-id.js` (Generate unique IDs)
- [ ] `src/utils/meeting-url-parser.js`

## Key Technical Decisions

1. **ES Modules**: Sử dụng `"type": "module"` trong package.json, tất cả imports dùng ESM syntax
2. **ORM**: Prisma thay Django ORM (type-safe, auto-completion, migrations)
3. **Queue**: BullMQ thay Celery (native Node.js, Redis-backed)
4. **Storage**: MinIO SDK for JavaScript (S3-compatible)
5. **Bot Controller**: Hybrid approach - giữ Python process, Node.js orchestrate
6. **Validation**: Joi cho request validation
7. **Logging**: Winston với JSON format
8. **Testing**: Jest + Supertest
9. **API Docs**: Swagger/OpenAPI (manual or auto-generated)

## Migration Notes

### Django -> Express Mappings
- Django Views -> Express Controllers
- Django Models -> Prisma Schema
- Django Middleware -> Express Middleware
- Celery Tasks -> Bull Jobs
- Django Signals -> Event Emitters
- django-allauth -> Passport.js hoặc custom JWT
- Django REST Framework Serializers -> Joi schemas + manual serialization

### Database Considerations
- Django auto_now/auto_now_add -> Prisma @default(now()) / @updatedAt
- Django ForeignKey -> Prisma @relation
- Django JSONField -> Prisma Json type
- Django BinaryField (encrypted) -> Prisma Bytes

### Challenges & Solutions
1. **GStreamer/Media Processing**: Keep Python bot controller, communicate via WebSocket/Redis
2. **Fernet Encryption**: Implement AES-256-GCM equivalent in Node.js
3. **Django Signals**: Use EventEmitter pattern
4. **Concurrent Updates**: Use Prisma transactions + optimistic locking
5. **Scheduled Tasks**: node-cron thay Celery Beat

## Next Steps After Approval
1. Tạo package.json với tất cả dependencies
2. Setup Docker Compose với PostgreSQL, Redis, MinIO
3. Tạo Prisma schema và chạy migration
4. Implement basic Express server với health check
5. Tiếp tục theo implementation order phía trên
