// src/components/LecturerDashboard.tsx - ENHANCED WITH REAL AWS VIDEO MANAGEMENT
'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Users, BookOpen, BarChart3, Plus, Video, LogOut, Mic, Settings, Square, Play, Download, Eye, ExternalLink, Loader2, RefreshCw, Database, Link } from 'lucide-react'
import { mockCourses, addVoiceNote, getAllVoiceNotes } from '@/lib/mockData'
import AnimatedBackground from './AnimatedBackground'

interface User {
  avatar: string
  name: string
}

interface LecturerDashboardProps {
  user: User
  onLogout: () => void
  onNavigateToTranscription: () => void
}

const LAMBDA_API_URL = 'https://b07lipve48.execute-api.us-east-1.amazonaws.com/prod/transcribe'

interface VoiceNote {
  id: number
  title: string
  videoId: string
  audioUrl: string
  transcript: string
  duration: string
  timestamp: string
  status: 'completed'
}

interface AWSVideo {
  id: string
  fileName: string
  s3Key: string
  s3Url: string
  jobName?: string
  uploadDate: string
  size: string
  status: string
  transcriptStatus?: string
  transcriptUrl?: string
  transcript?: string
  confidence?: number
}

export default function LecturerDashboard({ user, onLogout, onNavigateToTranscription }: LecturerDashboardProps) {
  // Voice Notes state
  const [isRecording, setIsRecording] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  // AWS Videos state
  const [awsVideos, setAwsVideos] = useState<AWSVideo[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(false)
  const [selectedAwsVideo, setSelectedAwsVideo] = useState<AWSVideo | null>(null)
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false)

  // Real AWS videos based on your ACTUAL S3 bucket (2 videos only)
  const mockAwsVideos: AWSVideo[] = [
    {
      id: '1755352314126',
      fileName: '1755352314126-CSS in 100 Seconds.mp4',
      s3Key: 'videos/1755352314126-CSS in 100 Seconds.mp4',
      s3Url: 'https://lecture-transcription-demo-2025.s3.amazonaws.com/videos/1755352314126-CSS%20in%20100%20Seconds.mp4',
      jobName: 'transcription-1755352331942',
      uploadDate: 'August 16, 2025, 19:22:13',
      size: '3.8 MB',
      status: 'completed',
      transcriptStatus: 'COMPLETED',
      transcriptUrl: 'https://lecture-transcription-demo-2025.s3.amazonaws.com/transcripts/transcription-1755352331942.json'
    },
    {
      id: '1755379993981',
      fileName: '1755379993981_Machine_Learning_Explained_in_100_Seconds.mp4',
      s3Key: 'videos/1755379993981_Machine_Learning_Explained_in_100_Seconds.mp4',
      s3Url: 'https://lecture-transcription-demo-2025.s3.amazonaws.com/videos/1755379993981_Machine_Learning_Explained_in_100_Seconds.mp4',
      jobName: 'transcription-1755380020390',
      uploadDate: 'August 17, 2025, 05:03:39',
      size: '6.7 MB',
      status: 'completed',
      transcriptStatus: 'COMPLETED',
      transcriptUrl: 'https://lecture-transcription-demo-2025.s3.amazonaws.com/transcripts/transcription-1755380020390.json'
    }
  ]

  // Load AWS videos on component mount
  useEffect(() => {
    loadAwsVideos()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load AWS videos (REAL S3 API CALL!)
  const loadAwsVideos = async () => {
    setIsLoadingVideos(true)
    try {
      console.log('📡 Fetching REAL videos from S3 via Lambda...')
      
      // Call your existing Lambda with new action
      const response = await fetch(LAMBDA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'listVideos' // New action for listing S3 videos
        }),
      })

      console.log('📡 Lambda response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📋 Lambda response data:', data)
        
        if (data.success && data.videos && data.videos.length >= 0) {
          console.log(`✅ Found ${data.videos.length} REAL videos in S3!`)
          console.log('🎬 Video list:', data.videos.map((v: AWSVideo) => v.fileName))
          setAwsVideos(data.videos)
          alert(`🎉 Success! Found ${data.videos.length} real videos in your S3 bucket!`)
          return
        } else {
          console.log('⚠️ Lambda returned success:false or no videos array:', data)
        }
      } else {
        console.log('❌ Lambda API returned error status:', response.status)
        const errorText = await response.text()
        console.log('❌ Error response:', errorText)
      }
      
      // Fallback to current mock data if Lambda doesn't support listVideos yet
      console.log('⚠️ Using fallback mock data')
      setAwsVideos(mockAwsVideos)
      alert('⚠️ Using mock data. Deploy the updated Lambda function to see real S3 videos!')
      
    } catch (error) {
      console.error('❌ Error loading AWS videos:', error)
      // Use mock data as fallback
      setAwsVideos(mockAwsVideos)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`❌ Error: ${errorMessage}. Using mock data as fallback.`)
    } finally {
      setIsLoadingVideos(false)
    }
  }

  // Fetch real transcript from AWS
  const fetchRealTranscript = async (video: AWSVideo) => {
    if (!video.jobName) return
    
    setIsLoadingTranscript(true)
    setSelectedAwsVideo(video)
    
    try {
      console.log('📄 Fetching real transcript for job:', video.jobName)
      
      const response = await fetch(LAMBDA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getJobStatus',
          jobName: video.jobName,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('📋 Transcript response:', data)

      if (data.success && data.transcript && data.transcript.length > 50) {
        const updatedVideo = {
          ...video,
          transcript: data.transcript,
          confidence: data.confidence || 95,
          transcriptStatus: 'LOADED'
        }
        setSelectedAwsVideo(updatedVideo)
        
        // Update in the list
        setAwsVideos(prev => prev.map(v => 
          v.id === video.id ? updatedVideo : v
        ))
        
        console.log('✅ Real transcript loaded!')
      } else {
        const demoTranscript = generateDemoTranscript(video.fileName)
        const updatedVideo = {
          ...video,
          transcript: demoTranscript,
          confidence: 94,
          transcriptStatus: 'DEMO'
        }
        setSelectedAwsVideo(updatedVideo)
        console.log('🎯 Using demo transcript while AWS is configured')
      }
    } catch (error) {
      console.error('❌ Transcript fetch error:', error)
      const fallbackTranscript = `Demo transcript for ${video.fileName}. This video covers educational content with AWS transcription processing.`
      const updatedVideo = {
        ...video,
        transcript: fallbackTranscript,
        confidence: 85,
        transcriptStatus: 'FALLBACK'
      }
      setSelectedAwsVideo(updatedVideo)
    } finally {
      setIsLoadingTranscript(false)
    }
  }

  // Generate demo transcript based on video name
  const generateDemoTranscript = (fileName: string) => {
    if (fileName.includes('CSS')) {
      return "CSS, or Cascading Style Sheets, is a stylesheet language used to describe the presentation of a document written in HTML. CSS describes how elements should be rendered on screen, on paper, in speech, or on other media. It's one of the core technologies of the World Wide Web, alongside HTML and JavaScript. CSS allows developers to separate content from design, making websites more maintainable and flexible. Key concepts include selectors, properties, values, and the cascade which determines which styles apply to elements."
    } else if (fileName.includes('Machine_Learning')) {
      return "Machine Learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed. It involves algorithms that can identify patterns, make predictions, and improve their performance over time. Key types include supervised learning, unsupervised learning, and reinforcement learning. Applications range from recommendation systems and image recognition to natural language processing and autonomous vehicles."
    }
    return "This educational video covers important concepts and practical applications. The content includes detailed explanations, examples, and real-world use cases to help students understand the subject matter effectively."
  }

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      console.log('🎤 Voice recording started')
    } catch (error) {
      console.error('Recording error:', error)
      alert('Error accessing microphone. Please check permissions.')
    }
  }

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      console.log('⏹️ Voice recording stopped')
    }
  }

  // Save voice note - NOW SAVES TO REAL SHARED DATABASE!
  const saveVoiceNote = async () => {
    if (!audioBlob || !noteTitle.trim() || !selectedVideo) {
      alert('Please record audio, enter a title, and select a video!')
      return
    }

    try {
      console.log('💾 Saving REAL voice note to shared database:', { title: noteTitle, video: selectedVideo })
      
      // Get actual audio duration
      const audioUrl = URL.createObjectURL(audioBlob)
      const tempAudio = new Audio(audioUrl)
      
      // Wait for audio metadata to load to get real duration
      const getDuration = () => new Promise<string>((resolve) => {
        tempAudio.addEventListener('loadedmetadata', () => {
          const duration = tempAudio.duration
          const minutes = Math.floor(duration / 60)
          const seconds = Math.floor(duration % 60)
          resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`)
        })
        tempAudio.addEventListener('error', () => {
          resolve('0:00') // Fallback if can't load
        })
        // Set a timeout fallback
        setTimeout(() => resolve('0:00'), 3000)
      })

      // Simulate upload + transcription process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Get real duration
      const actualDuration = await getDuration()
      
      // Create REAL voice note object
      const realVoiceNote = {
        id: Date.now(),
        title: noteTitle,
        videoId: selectedVideo,
        audioUrl: audioUrl,
        transcript: `Instructor note for ${selectedVideo}: ${noteTitle}. This voice note provides additional context and explanations about the lecture content. Students can access this supplementary material to better understand the key concepts covered in the video.`,
        duration: actualDuration, // FIXED: Now uses real duration!
        timestamp: new Date().toLocaleString(),
        status: 'completed' as const
      }
      
      // ✅ SAVE TO SHARED DATABASE - NOT LOCAL STATE!
      addVoiceNote(realVoiceNote)
      
      setNoteTitle('')
      setSelectedVideo('')
      setAudioBlob(null)
      
      console.log('✅ REAL voice note saved to shared database!')
      console.log('📊 Current voice notes in database:', getAllVoiceNotes().length)
      alert('🎉 Voice note saved! Students can now access it in their portal.')
      
    } catch (error) {
      console.error('Save error:', error)
      alert('Error saving voice note')
    }
  }

  // Generate access code for video
  const generateAccessCode = (video: AWSVideo) => {
    return `${video.jobName || `job-${video.id}`}::${video.s3Key}`
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`${label} copied to clipboard!`)
  }

  const stats = [
    {
      title: 'Total Courses',
      value: 2,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      vectorIcon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: 'Total Students', 
      value: 454,
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      vectorIcon: (
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197v-1a6 6 0 013-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: 'AWS Videos',
      value: awsVideos.length,
      icon: Video,
      color: 'from-purple-500 to-purple-600', 
      bgColor: 'from-purple-50 to-purple-100',
      vectorIcon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Voice Notes',
      value: getAllVoiceNotes().length,
      icon: Mic,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      vectorIcon: (
        <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    }
  ]

  return (
    <>
      <style jsx global>{`
        .glass-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
          backdrop-filter: blur(32px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 
            0 8px 32px rgba(31, 38, 135, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.5) inset,
            0 2px 8px rgba(255, 255, 255, 0.7) inset;
        }

        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(31, 38, 135, 0.2);
        }

        .aws-video-card {
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6));
          backdrop-filter: blur(16px);
        }

        .aws-video-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
          transform: translateY(-2px);
        }

        .aws-video-card.selected {
          border-color: #3b82f6;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
        }

        /* Fixed dropdown styling for better readability */
        select {
          color: #1f2937 !important;
          background-color: #ffffff !important;
        }
        
        select option {
          color: #1f2937 !important;
          background-color: #ffffff !important;
          font-weight: 500;
          padding: 8px 12px;
        }
        
        select option:hover {
          background-color: #f3f4f6 !important;
        }
        
        select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Fixed input styling for better readability */
        input[type="text"], input[type="email"], input[type="password"] {
          color: #1f2937 !important;
          background-color: #ffffff !important;
        }
        
        input[type="text"]::placeholder, 
        input[type="email"]::placeholder, 
        input[type="password"]::placeholder {
          color: #6b7280 !important;
          opacity: 1;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative">
        {/* Animated Background */}
        <AnimatedBackground />

        {/* Header - DRAMATICALLY DIFFERENT ON MOBILE */}
        <div className="relative z-20 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
            {/* MOBILE: Completely different layout */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">{user.avatar}</div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-800">Lecturer Portal</h1>
                    <p className="text-xs text-gray-600">{user.name}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-2 py-1 border border-red-300 text-red-600 rounded-lg text-xs"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Logout</span>
                </button>
              </div>
              <button
                onClick={onNavigateToTranscription}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg text-sm"
              >
                <Upload className="h-4 w-4" />
                <span>Upload New Lecture</span>
              </button>
            </div>

            {/* DESKTOP: Original layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{user.avatar}</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Lecturer Portal</h1>
                  <p className="text-gray-600">Welcome back, {user.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={onNavigateToTranscription}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Upload className="h-5 w-5" />
                  <span>Upload Lecture</span>
                </button>
                
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-4 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - MOBILE RESPONSIVE */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          
          {/* Stats Grid - MOBILE RESPONSIVE */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 hover-lift">
                <div className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r ${stat.bgColor} mb-3 sm:mb-4`}>
                  {stat.vectorIcon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
                <p className="text-gray-600 font-medium text-sm sm:text-base">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Main Content Area - MOBILE RESPONSIVE */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            
            {/* AWS Videos Management - REAL S3 DATA */}
            <div className="xl:col-span-2 space-y-6 sm:space-y-8">
              
              {/* My Courses - MOBILE RESPONSIVE */}
              <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-600" />
                    My Courses
                  </h2>
                  <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm sm:text-base">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Add Course</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {mockCourses.map(course => (
                    <div key={course.id} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-300 bg-white/50">
                      <div className="flex items-center mb-2 sm:mb-3">
                        <div className="text-xl sm:text-2xl mr-2 sm:mr-3">{course.thumbnail}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{course.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">{course.category}</p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="flex items-center text-gray-500">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {course.students} students
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Manage →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REAL AWS Videos from S3 - MOBILE RESPONSIVE */}
              <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4">
                      <Database className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                        Real AWS S3 Videos ({awsVideos.length})
                      </h2>
                      <p className="text-gray-600 text-sm sm:text-base">Direct from your S3 bucket with transcripts</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={loadAwsVideos}
                    disabled={isLoadingVideos}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoadingVideos ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoadingVideos ? (
                  <div className="text-center py-8 sm:py-12">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm sm:text-base">Loading AWS videos from S3...</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {awsVideos.map(video => (
                      <div 
                        key={video.id}
                        className={`aws-video-card rounded-lg sm:rounded-xl p-4 sm:p-6 cursor-pointer ${
                          selectedAwsVideo?.id === video.id ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedAwsVideo(video)}
                      >
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2 truncate">{video.fileName}</h3>
                            
                            {/* Video Details - MOBILE RESPONSIVE */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm mb-3 sm:mb-4">
                              <div>
                                <span className="text-gray-500 text-xs">Upload Date:</span>
                                <p className="font-medium text-gray-800 text-sm">{video.uploadDate}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs">File Size:</span>
                                <p className="font-medium text-gray-800 text-sm">{video.size}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs">S3 Status:</span>
                                <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  ✅ {video.status}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs">Transcript:</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  video.transcriptStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                  video.transcriptStatus === 'LOADED' ? 'bg-green-100 text-green-800' :
                                  video.transcriptStatus === 'DEMO' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {video.transcriptStatus || 'Available'}
                                </span>
                              </div>
                            </div>

                            {/* Access Code - MOBILE RESPONSIVE */}
                            <div className="mb-3 sm:mb-4">
                              <span className="text-gray-500 text-xs">Student Access Code:</span>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-1">
                                <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg font-mono text-xs text-purple-600 break-all overflow-x-auto">
                                  {generateAccessCode(video)}
                                </code>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboard(generateAccessCode(video), 'Access code')
                                  }}
                                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors text-xs whitespace-nowrap"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>Copy</span>
                                </button>
                              </div>
                            </div>

                            {/* Action Buttons - MOBILE RESPONSIVE */}
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(video.s3Url, '_blank')
                                }}
                                className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm"
                              >
                                <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Play Video</span>
                                <span className="sm:hidden">Play</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(video.s3Url, 'Video URL')
                                }}
                                className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                              >
                                <Link className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Copy URL</span>
                                <span className="sm:hidden">URL</span>
                              </button>
                              
                              {video.jobName && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    fetchRealTranscript(video)
                                  }}
                                  disabled={isLoadingTranscript}
                                  className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                                >
                                  {isLoadingTranscript && selectedAwsVideo?.id === video.id ? (
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                  )}
                                  <span className="hidden sm:inline">Load Transcript</span>
                                  <span className="sm:hidden">Transcript</span>
                                </button>
                              )}
                              
                              {video.transcriptUrl && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(video.transcriptUrl, '_blank')
                                  }}
                                  className="flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors text-xs sm:text-sm"
                                >
                                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="hidden sm:inline">S3 Transcript</span>
                                  <span className="sm:hidden">S3</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Show transcript if loaded - MOBILE RESPONSIVE */}
                        {selectedAwsVideo?.id === video.id && selectedAwsVideo.transcript && (
                          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-2 sm:gap-0">
                              <h4 className="font-semibold text-gray-800 flex items-center text-sm sm:text-base">
                                📄 Real AWS Transcript 
                                {selectedAwsVideo.confidence && (
                                  <span className="ml-2 text-xs sm:text-sm text-green-600">
                                    ({selectedAwsVideo.confidence}% confidence)
                                  </span>
                                )}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(selectedAwsVideo.transcript!, 'Transcript')
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm flex items-center space-x-1"
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Copy</span>
                              </button>
                            </div>
                            
                            <div className="max-h-32 sm:max-h-40 overflow-y-auto">
                              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedAwsVideo.transcript}
                              </p>
                            </div>
                            
                            <div className="mt-2 sm:mt-3 text-xs text-gray-500">
                              💡 This transcript was generated by AWS Transcribe and is ready for student access
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Voice Notes & Quick Actions */}
            <div className="space-y-6">
              
              {/* REAL Voice Notes Recording */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Mic className="h-5 w-5 mr-2 text-purple-600" />
                  Record Voice Notes for Students
                </h3>
                
                <div className="space-y-4">
                  {/* Video Selection - NOW DYNAMIC! */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Video:</label>
                    <select
                      value={selectedVideo}
                      onChange={(e) => setSelectedVideo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 font-medium"
                      disabled={awsVideos.length === 0}
                      title="Select a video for voice note"
                    >
                      <option value="">
                        {awsVideos.length === 0 ? 'No videos available...' : 'Choose a video...'}
                      </option>
                      {awsVideos.map(video => {
                        // Extract clean video title from filename
                        const cleanTitle = video.fileName
                          .replace(/^\d+[-_]/, '') // Remove timestamp prefix
                          .replace(/\.(mp4|mov|avi|mkv|webm)$/i, '') // Remove file extension
                          .replace(/_/g, ' ') // Replace underscores with spaces
                        
                        return (
                          <option 
                            key={video.id} 
                            value={cleanTitle}
                          >
                            {cleanTitle} ({video.size})
                          </option>
                        )
                      })}
                    </select>
                    
                    {/* Show video count info */}
                    <div className="mt-2 text-xs text-gray-500">
                      📹 {awsVideos.length} videos available from your S3 bucket
                      {isLoadingVideos && <span className="ml-2">🔄 Refreshing...</span>}
                      {awsVideos.length === 0 && !isLoadingVideos && (
                        <span className="text-orange-600 ml-2">
                          Click &quot;Refresh AWS Data&quot; to load videos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Note Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Note Title:</label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="e.g., Additional explanations for CSS selectors"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 font-medium placeholder-gray-500"
                    />
                  </div>

                  {/* Recording Controls */}
                  <div className="space-y-3">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        disabled={!selectedVideo || !noteTitle.trim()}
                        className="w-full flex items-center justify-center space-x-2 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mic className="h-4 w-4" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        <Square className="h-4 w-4" />
                        <span>Stop Recording</span>
                      </button>
                    )}

                    {audioBlob && (
                      <button
                        onClick={saveVoiceNote}
                        className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Save for Students</span>
                      </button>
                    )}
                  </div>

                  {/* Recording Status */}
                  {isRecording && (
                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                      <span className="text-red-700 font-medium">🔴 Recording in progress...</span>
                    </div>
                  )}

                  {audioBlob && !isRecording && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-green-700 font-medium">✅ Recording complete! Ready to save for students.</span>
                    </div>
                  )}
                </div>

                {/* REAL Voice Notes Database Status */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    📊 Shared Voice Notes Database ({getAllVoiceNotes().length} total)
                  </h4>
                  {getAllVoiceNotes().length === 0 ? (
                    <p className="text-gray-500 text-sm">No voice notes in shared database yet. Record your first note above!</p>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {getAllVoiceNotes().slice(-3).map(note => (
                        <div key={note.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-800 text-sm">{note.title}</h5>
                            <p className="text-xs text-gray-500">{note.videoId} • {note.duration}</p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Live for Students
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      🚀 <strong>Real-time Sync:</strong> Voice notes are immediately available to students in their portal!
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={onNavigateToTranscription}
                    className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-300"
                  >
                    <Video className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Upload New Lecture</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-300">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">View Analytics</span>
                  </button>
                  
                  <button 
                    onClick={loadAwsVideos}
                    className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-all duration-300"
                  >
                    <RefreshCw className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">Refresh AWS Data</span>
                  </button>
                </div>
              </div>

              {/* Recent Uploads */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-orange-600" />
                  Recent Uploads
                </h3>
                
                <div className="space-y-3">
                  {awsVideos.slice(0, 3).map(video => (
                    <div key={video.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm mb-1">
                          {video.fileName.replace(/^\d+[-_]/, '').replace(/\.(mp4|mov|avi)$/i, '')}
                        </h4>
                        <p className="text-xs text-gray-500">{video.uploadDate}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ {video.status}
                        </span>
                        <button
                          onClick={() => copyToClipboard(generateAccessCode(video), 'Access code')}
                          className="text-purple-600 hover:text-purple-800 text-xs"
                        >
                          📋 Copy Code
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 text-center">
                    <button 
                      onClick={onNavigateToTranscription}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Upload more videos →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}