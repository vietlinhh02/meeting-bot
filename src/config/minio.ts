import * as Minio from 'minio';

const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
};

const minioClient = new Minio.Client(minioConfig);

const bucketName = process.env.MINIO_BUCKET_NAME || 'meeting-recordings';

// Initialize bucket if it doesn't exist
const initBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, process.env.MINIO_REGION || 'us-east-1');
      console.log(`MinIO bucket '${bucketName}' created successfully`);
    } else {
      console.log(`MinIO bucket '${bucketName}' already exists`);
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
  }
};

initBucket();

export { minioClient, bucketName };
