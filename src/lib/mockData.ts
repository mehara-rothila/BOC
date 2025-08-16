// src/lib/mockData.ts - WITH REAL VOICE NOTES STORAGE

export interface Course {
  id: number
  title: string
  description: string
  instructor: string
  thumbnail: string
  category: string
  students: number
}

export interface VoiceNote {
  id: number
  title: string
  videoId: string
  audioUrl: string
  transcript: string
  duration: string
  timestamp: string
  status: 'completed'
}

export interface UploadedVideo {
  id: number
  courseId: number
  title: string
  description: string
  fileName: string
  s3Key?: string
  transcript?: string
  summary?: string
  keyPoints?: string[]
  uploadDate: string
  status: 'uploading' | 'processing' | 'completed'
  confidence?: number
}

// 2 SIMPLE COURSES - Perfect for demo!
export const mockCourses: Course[] = [
  {
    id: 1,
    title: "Machine Learning Fundamentals",
    description: "Introduction to ML algorithms and neural networks",
    instructor: "Dr. Sarah Wilson",
    thumbnail: "🤖",
    category: "AI",
    students: 156
  },
  {
    id: 4,
    title: "Web Development with React",
    description: "Full-stack development with React and Node.js", 
    instructor: "Dr. Sarah Wilson",
    thumbnail: "🌐",
    category: "Web Dev", 
    students: 298
  }
]

// STORAGE for uploaded videos
export const uploadedVideos: UploadedVideo[] = [
  {
    id: 1,
    courseId: 4,
    title: "CSS in 100 Seconds",
    description: "Quick overview of CSS fundamentals and modern techniques",
    fileName: "1755352314126-CSS in 100 Seconds.mp4",
    s3Key: "videos/1755352314126-CSS in 100 Seconds.mp4",
    uploadDate: "August 16, 2025",
    status: "completed",
    confidence: 95
  },
  {
    id: 2,
    courseId: 1,
    title: "Machine Learning Explained in 100 Seconds", 
    description: "Quick introduction to machine learning concepts and applications",
    fileName: "1755379993981_Machine_Learning_Explained_in_100_Seconds.mp4",
    s3Key: "videos/1755379993981_Machine_Learning_Explained_in_100_Seconds.mp4",
    uploadDate: "August 17, 2025",
    status: "completed",
    confidence: 94
  }
]

// NEW: REAL VOICE NOTES STORAGE - SHARED BETWEEN LECTURER AND STUDENT
export let voiceNotesDatabase: VoiceNote[] = []

// Add voice note from lecturer
export const addVoiceNote = (voiceNote: VoiceNote) => {
  voiceNotesDatabase.push(voiceNote)
  console.log('✅ Voice note saved to shared database:', voiceNote.title)
  console.log('📊 Total voice notes in database:', voiceNotesDatabase.length)
}

// Get voice notes for specific video (for student)
export const getVoiceNotesForVideo = (videoId: string): VoiceNote[] => {
  const notes = voiceNotesDatabase.filter(note => note.videoId === videoId)
  console.log(`🔍 Found ${notes.length} voice notes for video: ${videoId}`)
  return notes
}

// Get all voice notes (for debugging)
export const getAllVoiceNotes = (): VoiceNote[] => {
  return voiceNotesDatabase
}

// Clear voice notes (for testing)
export const clearVoiceNotes = () => {
  voiceNotesDatabase = []
}

// Add video after lecturer uploads
export const addUploadedVideo = (video: UploadedVideo) => {
  uploadedVideos.push(video)
}

// Get videos for student side  
export const getVideosForStudent = () => {
  return uploadedVideos.filter(video => video.status === 'completed')
}

// LOGIN ACCOUNTS
export const mockUsers = {
  'lec@gmail.com': {
    password: 'lec123',
    type: 'lecturer' as const,
    data: {
      id: 1,
      name: 'Dr. Sarah Wilson',
      email: 'lec@gmail.com',
      department: 'Computer Science',
      avatar: '👩‍🏫',
      totalCourses: 4,
      totalStudents: 846
    }
  },
  'stu@gmail.com': {
    password: 'stu123', 
    type: 'student' as const,
    data: {
      id: 1,
      name: 'Alex Kumar',
      email: 'stu@gmail.com',
      year: '3rd Year',
      major: 'Computer Science', 
      avatar: '👨‍🎓',
      enrolledCourses: [1, 2]
    }
  }
}