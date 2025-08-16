// src/app/page.tsx - Updated to use MainApp with login flow
import MainApp from '@/components/MainApp'

export default function Home() {
  return <MainApp />
}

export const metadata = {
  title: 'EduLink Pro - AWS Lecture Transcription | Beauty of Cloud 2025',
  description: 'Professional AI-powered lecture transcription platform with AWS services. Two-sided platform for lecturers and students with real-time transcription.',
  keywords: 'AWS, transcription, AI, education, accessibility, cloud computing, lecturer portal, student dashboard, live transcription',
}