// src/lib/aws-config.ts
import { S3Client } from '@aws-sdk/client-s3'
import { TranscribeClient } from '@aws-sdk/client-transcribe'

// Validate environment variables
const validateConfig = () => {
  const required = {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
  }

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return required
}

// AWS Configuration
export const getAWSConfig = () => {
  const config = validateConfig()
  
  return {
    region: config.region!,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
  }
}

// Initialize AWS clients
export const createS3Client = () => {
  try {
    return new S3Client(getAWSConfig())
  } catch (error) {
    console.error('Failed to initialize S3 client:', error)
    throw error
  }
}

export const createTranscribeClient = () => {
  try {
    return new TranscribeClient(getAWSConfig())
  } catch (error) {
    console.error('Failed to initialize Transcribe client:', error)
    throw error
  }
}

// Constants
export const AWS_CONFIG = {
  BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET || 'lecture-transcription-demo-2025',
  REGION: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_FORMATS: ['video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/mp4'],
}

// Utility functions
export const validateFileType = (file: File): boolean => {
  return AWS_CONFIG.SUPPORTED_FORMATS.includes(file.type)
}

export const validateFileSize = (file: File): boolean => {
  return file.size <= AWS_CONFIG.MAX_FILE_SIZE
}

export const getMediaFormat = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'mp4':
    case 'm4v':
      return 'mp4'
    case 'mp3':
      return 'mp3'
    case 'wav':
      return 'wav'
    case 'm4a':
      return 'mp4'
    case 'mov':
      return 'mov'
    default:
      return 'mp4'
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}