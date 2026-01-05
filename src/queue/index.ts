import { Queue, Worker, QueueEvents } from 'bullmq';

const queueName = process.env.QUEUE_NAME || 'meeting-jobs';
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '5');

// Create connection for BullMQ
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// Create queue
export const meetingQueue = new Queue(queueName, { connection });

// Queue events for monitoring
export const queueEvents = new QueueEvents(queueName, { connection });

queueEvents.on('completed', ({ jobId }) => {
  console.log(`Job ${jobId} has completed`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} has failed with reason: ${failedReason}`);
});

// Job processor types
export enum JobType {
  PROCESS_RECORDING = 'process-recording',
  TRANSCRIBE_AUDIO = 'transcribe-audio',
  GENERATE_SUMMARY = 'generate-summary',
  CLEANUP_OLD_FILES = 'cleanup-old-files',
}

// Example worker setup
export const createWorker = (
  processor: (job: any) => Promise<any>
) => {
  return new Worker(queueName, processor, {
    connection,
    concurrency,
  });
};
