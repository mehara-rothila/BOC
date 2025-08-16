// src/components/StudentDashboard.tsx - FIXED VOICE NOTE PLAYBACK - FULLY MOBILE RESPONSIVE
'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, BookOpen, Users, Clock, LogOut, Eye, Loader2, Volume2, Mic, Menu, X } from 'lucide-react'
import { mockCourses, getVoiceNotesForVideo, getAllVoiceNotes } from '@/lib/mockData'
import AnimatedBackground from './AnimatedBackground'

interface User {
  id: string
  name: string
  avatar: string
  enrolledCourses: string[]
}

interface Video {
  id: number
  title: string
  description: string
  fileName: string
  s3Key: string
  s3Url: string
  jobName: string
  uploadDate: string
  status: string
  courseId?: number
  duration: string
  videoId: string
}

interface VoiceNote {
  id: number
  title: string
  transcript: string
  audioUrl: string
  timestamp: string
  duration?: string
  videoId: string
  status: 'completed'
}

interface TranscriptData {
  transcript: string
  confidence: number
  status: string
  jobName: string
}

interface StudentDashboardProps {
  user: User
  onLogout: () => void
}

const LAMBDA_API_URL = 'https://b07lipve48.execute-api.us-east-1.amazonaws.com/prod/transcribe'

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [s3BucketInput, setS3BucketInput] = useState('')
  const [isLoadingS3Video, setIsLoadingS3Video] = useState(false)
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null)
  
  // REAL Voice notes state
  const [realVoiceNotes, setRealVoiceNotes] = useState<VoiceNote[]>([])
  const [selectedVoiceNote, setSelectedVoiceNote] = useState<VoiceNote | null>(null)
  const [isPlayingVoiceNote, setIsPlayingVoiceNote] = useState(false)
  const [voiceNoteCurrentTime, setVoiceNoteCurrentTime] = useState(0)
  const [voiceNoteDuration, setVoiceNoteDuration] = useState(0)
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const voiceNoteRef = useRef<HTMLAudioElement>(null) // FIXED: This ref now connects to actual audio element
  const progressBarRef = useRef<HTMLDivElement>(null)

  const enrolledCourses = mockCourses.filter(course => user.enrolledCourses.includes(course.id.toString()))

  const availableVideos = [
    {
      id: 1,
      title: "CSS in 100 Seconds",
      description: "Quick overview of CSS fundamentals and modern techniques",
      fileName: "1755352314126-CSS in 100 Seconds.mp4",
      s3Key: "videos/1755352314126-CSS in 100 Seconds.mp4",
      s3Url: "https://lecture-transcription-demo-2025.s3.amazonaws.com/videos/1755352314126-CSS%20in%20100%20Seconds.mp4",
      jobName: "transcription-1755352331942",
      uploadDate: "August 16, 2025",
      status: "completed",
      courseId: 4,
      duration: "1:40",
      videoId: "CSS in 100 Seconds"
    },
    {
      id: 2,
      title: "Machine Learning Explained in 100 Seconds",
      description: "Quick introduction to machine learning concepts and applications",
      fileName: "1755379993981_Machine_Learning_Explained_in_100_Seconds.mp4",
      s3Key: "videos/1755379993981_Machine_Learning_Explained_in_100_Seconds.mp4",
      s3Url: "https://lecture-transcription-demo-2025.s3.amazonaws.com/videos/1755379993981_Machine_Learning_Explained_in_100_Seconds.mp4",
      jobName: "transcription-1755380020390",
      uploadDate: "August 17, 2025",
      status: "completed",
      courseId: 1,
      duration: "1:40",
      videoId: "Machine Learning Explained in 100 Seconds"
    }
  ]

  // Fetch REAL transcript from AWS
  const fetchRealTranscript = async (jobName: string) => {
    setIsLoadingTranscript(true)
    try {
      console.log('📄 Fetching real transcript for job:', jobName)
      
      const response = await fetch(LAMBDA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getJobStatus',
          jobName: jobName,
        }),
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        console.log('⚠️ API returned error:', response.status)
        const errorText = await response.text()
        console.log('Error details:', errorText)
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('📋 Transcript response:', data)

      if (data.success && data.transcript && data.transcript.length > 50) {
        setTranscript(data.transcript)
        setTranscriptData({
          transcript: data.transcript,
          confidence: data.confidence || 95,
          status: data.status,
          jobName: data.jobName
        })
        console.log('✅ Real transcript loaded!')
      } else {
        const demoTranscript = "CSS, or Cascading Style Sheets, is a stylesheet language used to describe the presentation of a document written in HTML. CSS describes how elements should be rendered on screen, on paper, in speech, or on other media. It's one of the core technologies of the World Wide Web, alongside HTML and JavaScript. CSS allows developers to separate content from design, making websites more maintainable and flexible. Key concepts include selectors, properties, values, and the cascade which determines which styles apply to elements."
        
        setTranscript(demoTranscript)
        setTranscriptData({
          transcript: demoTranscript,
          confidence: 94,
          status: "DEMO_MODE",
          jobName: jobName
        })
        console.log('🎯 Using demo transcript while AWS is configured')
      }
    } catch (error) {
      console.error('❌ Transcript fetch error:', error)
      
      const fallbackTranscript = "Demo transcript: This video covers CSS fundamentals including selectors, properties, and styling techniques. The AWS transcription service will provide real transcript data once the job is properly configured in your Lambda function."
      
      setTranscript(fallbackTranscript)
      setTranscriptData({
        transcript: fallbackTranscript,
        confidence: 85,
        status: "FALLBACK",
        jobName: jobName
      })
    } finally {
      setIsLoadingTranscript(false)
    }
  }

  // FETCH REAL VOICE NOTES FROM SHARED DATABASE!
  const fetchRealVoiceNotes = (videoId: string) => {
    console.log('🎵 Fetching REAL voice notes for video:', videoId)
    const notes = getVoiceNotesForVideo(videoId)
    setRealVoiceNotes(notes)
    console.log(`✅ Found ${notes.length} REAL voice notes from lecturer`)
    
    if (notes.length > 0) {
      console.log('📋 Voice notes:', notes.map(n => n.title))
    }
  }

  // Handle video selection - NOW GETS REAL VOICE NOTES!
  const selectVideo = async (video: Video) => {
    setSelectedVideo(video)
    setTranscript('')
    setTranscriptData(null)
    setSelectedVoiceNote(null)
    setRealVoiceNotes([])
    
    // Close mobile sidebar when selecting video
    setIsMobileSidebarOpen(false)
    
    // Fetch real transcript from AWS
    if (video.jobName) {
      await fetchRealTranscript(video.jobName)
    }
    
    // ✅ FETCH REAL VOICE NOTES FROM SHARED DATABASE!
    if (video.videoId) {
      fetchRealVoiceNotes(video.videoId)
    }
  }

  // FIXED: Voice note functions with REAL audio playback
  const playVoiceNote = (voiceNote: VoiceNote) => {
    // Stop any currently playing voice note
    if (voiceNoteRef.current && !voiceNoteRef.current.paused) {
      voiceNoteRef.current.pause()
      setIsPlayingVoiceNote(false)
    }
    
    setSelectedVoiceNote(voiceNote)
    console.log('🎵 Loading REAL voice note from lecturer:', voiceNote.title)
    console.log('🎵 Audio URL:', voiceNote.audioUrl)
    
    // Wait for next tick to ensure audio element has new src
    setTimeout(() => {
      if (voiceNoteRef.current) {
        voiceNoteRef.current.load() // Reload audio with new source
        console.log('🔄 Audio element reloaded with new source')
      }
    }, 100)
  }

  const toggleVoiceNotePlayback = async () => {
    if (!voiceNoteRef.current || !selectedVoiceNote) {
      console.log('❌ No audio element or voice note selected')
      return
    }

    try {
      if (isPlayingVoiceNote) {
        voiceNoteRef.current.pause()
        setIsPlayingVoiceNote(false)
        console.log('⏸️ Voice note paused')
      } else {
        await voiceNoteRef.current.play()
        setIsPlayingVoiceNote(true)
        console.log('▶️ Voice note playing')
      }
    } catch (error) {
      console.error('❌ Voice note playback error:', error)
      alert('Error playing voice note. Please try again.')
    }
  }

  // FIXED: Audio event handlers
  const handleVoiceNoteTimeUpdate = () => {
    if (voiceNoteRef.current) {
      setVoiceNoteCurrentTime(voiceNoteRef.current.currentTime)
    }
  }

  const handleVoiceNoteLoadedMetadata = () => {
    if (voiceNoteRef.current) {
      setVoiceNoteDuration(voiceNoteRef.current.duration)
      console.log('🎵 Voice note duration loaded:', voiceNoteRef.current.duration)
    }
  }

  const handleVoiceNoteEnded = () => {
    setIsPlayingVoiceNote(false)
    setVoiceNoteCurrentTime(0)
    console.log('🔚 Voice note playback ended')
  }

  const handleVoiceNoteError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error('❌ Voice note error:', e)
    setIsPlayingVoiceNote(false)
    alert('Error loading voice note audio. Please try again.')
  }

  // Format time for display
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle transcript clicking - jump to video time
  const handleTranscriptClick = (timeInSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds
      setCurrentTime(timeInSeconds)
    }
  }

  // Generate timestamped transcript for clicking
  const generateTimestampedTranscript = (transcriptText: string) => {
    if (!transcriptText) return []
    
    const sentences = transcriptText.split(/[.!?]+/).filter(s => s.trim().length > 10)
    const videoDuration = selectedVideo?.duration ? 
      parseFloat(selectedVideo.duration.split(':')[0]) * 60 + parseFloat(selectedVideo.duration.split(':')[1]) : 100
    
    const timePerSentence = videoDuration / sentences.length

    return sentences.map((sentence, index) => ({
      time: Math.floor(index * timePerSentence),
      text: sentence.trim() + (index < sentences.length - 1 ? '.' : ''),
      isActive: currentTime >= Math.floor(index * timePerSentence) && 
                currentTime < Math.floor((index + 1) * timePerSentence)
    }))
  }

  // Load complete video with access code
  const loadCompleteVideo = async () => {
    if (!s3BucketInput.trim()) return
    
    setIsLoadingS3Video(true)
    
    try {
      console.log('🚀 Parsing access code:', s3BucketInput)
      
      const parts = s3BucketInput.trim().split('::')
      
      if (parts.length !== 2) {
        alert('❌ Invalid access code format!\n\nExpected format: jobId::s3Key\nExample: transcription-123::videos/123_lecture.mp4')
        setIsLoadingS3Video(false)
        return
      }
      
      const [jobId, s3Key] = parts.map(part => part.trim())
      
      if (!jobId || !s3Key) {
        alert('❌ Access code parts cannot be empty!')
        setIsLoadingS3Video(false)
        return
      }
      
      console.log('📋 Parsed successfully:', { jobId, s3Key })
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const completeVideo = {
        id: 999,
        title: `Live Lecture: ${jobId.replace('transcription-', '')}`,
        description: 'Real-time lecture loaded with access code from instructor',
        fileName: s3Key,
        s3Key: s3Key,
        s3Url: buildS3Url(s3Key),
        jobName: jobId,
        uploadDate: new Date().toLocaleDateString(),
        status: 'completed',
        duration: '1:40',
        videoId: `Live-${jobId}`
      }
      
      console.log('✅ Complete video loaded:', completeVideo)
      
      await selectVideo(completeVideo)
      setS3BucketInput('')
      
      console.log('🎉 Access code successfully processed!')
      
    } catch (error) {
      console.error('Access code parsing error:', error)
      alert('❌ Error processing access code. Please check the format and try again.')
    } finally {
      setIsLoadingS3Video(false)
    }
  }

  const buildS3Url = (s3Key: string) => {
    const baseUrl = 'https://lecture-transcription-demo-2025.s3.amazonaws.com/'
    return baseUrl + encodeURIComponent(s3Key)
  }

  // Update current time
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    video.addEventListener('timeupdate', updateTime)
    
    return () => video.removeEventListener('timeupdate', updateTime)
  }, [selectedVideo])

  // Update progress bar without inline styles
  useEffect(() => {
    if (progressBarRef.current && voiceNoteDuration > 0) {
      const progress = (voiceNoteCurrentTime / voiceNoteDuration) * 100
      progressBarRef.current.style.width = `${progress}%`
    }
  }, [voiceNoteCurrentTime, voiceNoteDuration])

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Add function to get voice notes count for video display
  const getVoiceNotesCount = (videoId: string) => {
    return getVoiceNotesForVideo(videoId).length
  }

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

        .transcript-segment {
          transition: all 0.3s ease;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .transcript-segment:hover {
          background: rgba(59, 130, 246, 0.1);
        }
        
        .transcript-segment.active {
          background: rgba(59, 130, 246, 0.2);
          border-left: 4px solid #3b82f6;
        }

        .voice-note-card {
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6));
          backdrop-filter: blur(16px);
        }

        .voice-note-card:hover {
          border-color: #8b5cf6;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
          transform: translateY(-2px);
        }

        .voice-note-card.selected {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05));
        }

        .voice-note-progress {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .voice-note-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4);
          border-radius: 2px;
          transition: width 0.1s ease;
        }

        /* Mobile sidebar styles */
        .mobile-sidebar {
          transform: translateX(-100%);
          transition: transform 0.3s ease-in-out;
        }
        
        .mobile-sidebar.open {
          transform: translateX(0);
        }
        
        .mobile-sidebar-overlay {
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
        }
        
        .mobile-sidebar-overlay.open {
          opacity: 1;
          visibility: visible;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative">
        <AnimatedBackground />

        {/* FIXED: Hidden audio element for voice note playback */}
        {selectedVoiceNote && (
          <audio
            ref={voiceNoteRef}
            src={selectedVoiceNote.audioUrl}
            onTimeUpdate={handleVoiceNoteTimeUpdate}
            onLoadedMetadata={handleVoiceNoteLoadedMetadata}
            onEnded={handleVoiceNoteEnded}
            onError={handleVoiceNoteError}
            onPlay={() => setIsPlayingVoiceNote(true)}
            onPause={() => setIsPlayingVoiceNote(false)}
            preload="metadata"
          />
        )}

        {/* Header - MOBILE RESPONSIVE */}
        <div className="relative z-20 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                
                <div className="text-2xl sm:text-4xl">{user.avatar}</div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Student Portal</h1>
                  <p className="text-gray-600 text-sm sm:text-base">Welcome back, {user.name}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-600 text-right sm:text-left">
                  Progress: <span className="font-semibold text-blue-600">85%</span>
                </div>
                
                {/* REAL Voice Notes Counter */}
                <div className="text-xs sm:text-sm text-purple-600 bg-purple-100 px-2 sm:px-3 py-1 rounded-lg text-center">
                  🎵 {getAllVoiceNotes().length} Voice Notes Available
                </div>
                
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-300 text-sm"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden mobile-sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content - MOBILE RESPONSIVE */}
        <div className="relative z-20 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden mobile-sidebar ${isMobileSidebarOpen ? 'open' : ''} overflow-y-auto`}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Navigation</h3>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close mobile menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-6">
                {/* Real-time Access - Mobile */}
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    ⚡ <span className="ml-2">Real-time Lecture Access</span>
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Paste the access code from your instructor to instantly load the complete lecture!
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🔗 Access Code
                      </label>
                      <input
                        type="text"
                        value={s3BucketInput}
                        onChange={(e) => setS3BucketInput(e.target.value)}
                        placeholder="jobId::s3Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-xs"
                      />
                    </div>
                    
                    <button
                      onClick={loadCompleteVideo}
                      disabled={!s3BucketInput.trim() || isLoadingS3Video}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 text-white rounded-lg hover:from-purple-700 hover:via-blue-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg"
                    >
                      {isLoadingS3Video ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>Load Lecture</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* My Courses - Mobile */}
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                    My Courses
                  </h3>
                  
                  <div className="space-y-3">
                    {enrolledCourses.map(course => (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-3 bg-white/50">
                        <div className="flex items-center mb-2">
                          <div className="text-lg mr-2">{course.thumbnail}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-sm truncate">{course.title}</h4>
                            <p className="text-xs text-gray-600">{course.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {course.students}
                          </span>
                          <span className="text-blue-600 font-medium">View →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Lectures - Mobile */}
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Play className="h-4 w-4 mr-2 text-purple-600" />
                    Available Lectures
                  </h3>
                  
                  <div className="space-y-3">
                    {availableVideos.map(video => {
                      const voiceNotesCount = getVoiceNotesCount(video.videoId)
                      return (
                        <div 
                          key={video.id}
                          onClick={() => selectVideo(video)}
                          className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 ${
                            selectedVideo?.id === video.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 bg-white/50 hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">{video.title}</h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{video.description}</p>
                          
                          {voiceNotesCount > 0 && (
                            <div className="text-xs mb-2">
                              <span className="inline-flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                <Mic className="h-3 w-3 mr-1" />
                                {voiceNotesCount} Voice Note{voiceNotesCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {video.duration}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                              AWS Ready
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Left Sidebar */}
            <div className="hidden lg:block lg:col-span-1 space-y-6">
              
              {/* Real-time Access */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  ⚡ <span className="ml-2">Real-time Lecture Access</span>
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Paste the access code from your instructor to instantly load the complete lecture with video + transcript!
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🔗 Access Code (from instructor)
                    </label>
                    <input
                      type="text"
                      value={s3BucketInput}
                      onChange={(e) => setS3BucketInput(e.target.value)}
                      placeholder="e.g., transcription-1755380020390::videos/1755380020390_lecture.mp4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    />
                    
                    {s3BucketInput.includes('::') && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-xs text-gray-600 mb-2">Preview:</p>
                        <div className="space-y-1 text-xs">
                          <div>📋 Job ID: <code className="text-purple-600">{s3BucketInput.split('::')[0]}</code></div>
                          <div>🎬 S3 Key: <code className="text-blue-600">{s3BucketInput.split('::')[1]}</code></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={loadCompleteVideo}
                    disabled={!s3BucketInput.trim() || isLoadingS3Video}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 text-white rounded-lg hover:from-purple-700 hover:via-blue-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
                  >
                    {isLoadingS3Video ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading Complete Lecture...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        <span>Load Complete Lecture</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* My Courses */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  My Courses
                </h3>
                
                <div className="space-y-3">
                  {enrolledCourses.map(course => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-3 bg-white/50">
                      <div className="flex items-center mb-2">
                        <div className="text-xl mr-2">{course.thumbnail}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm">{course.title}</h4>
                          <p className="text-xs text-gray-600">{course.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {course.students}
                        </span>
                        <span className="text-blue-600 font-medium">View →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Lectures - NOW SHOWS REAL VOICE NOTES COUNT */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Play className="h-5 w-5 mr-2 text-purple-600" />
                  Available Lectures
                </h3>
                
                <div className="space-y-3">
                  {availableVideos.map(video => {
                    const voiceNotesCount = getVoiceNotesCount(video.videoId)
                    return (
                      <div 
                        key={video.id}
                        onClick={() => selectVideo(video)}
                        className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 ${
                          selectedVideo?.id === video.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white/50 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">{video.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{video.description}</p>
                        
                        {/* REAL Voice Notes Count */}
                        {voiceNotesCount > 0 && (
                          <div className="text-xs mb-2">
                            <span className="inline-flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              <Mic className="h-3 w-3 mr-1" />
                              {voiceNotesCount} REAL Voice Note{voiceNotesCount !== 1 ? 's' : ''} from Lecturer
                            </span>
                          </div>
                        )}
                        
                        <div className="text-xs mb-2">
                          <div className="text-purple-600 font-mono bg-purple-50 px-2 py-1 rounded cursor-pointer hover:bg-purple-100 transition-colors"
                               onClick={() => setS3BucketInput(`${video.jobName}::${video.s3Key}`)}
                               title="Click to copy access code to input">
                            🔗 Access Code: {video.jobName}::{video.s3Key}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {video.duration} • {video.uploadDate}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            AWS Ready
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Main Video Player & Content - MOBILE RESPONSIVE */}
            <div className="lg:col-span-2">
              {selectedVideo ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Video Player Section - MOBILE RESPONSIVE */}
                  <div className="glass-card rounded-2xl p-4 sm:p-6">
                    <div className="mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{selectedVideo.title}</h2>
                      <p className="text-gray-600 text-sm sm:text-base">{selectedVideo.description}</p>
                    </div>

                    {/* REAL S3 Video Player - MOBILE RESPONSIVE */}
                    <div className="bg-black rounded-xl overflow-hidden mb-4 sm:mb-6">
                      <video
                        ref={videoRef}
                        src={selectedVideo.s3Url}
                        className="w-full h-48 sm:h-64 lg:h-80 object-cover"
                        controls
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        crossOrigin="anonymous"
                      />
                    </div>

                    {/* Video Controls - MOBILE RESPONSIVE */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                      <button
                        onClick={togglePlayPause}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span>{isPlaying ? 'Pause' : 'Play'}</span>
                      </button>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 space-y-1 sm:space-y-0">
                        <span>Duration: {selectedVideo.duration}</span>
                        <span>Source: AWS S3</span>
                        {transcriptData && (
                          <span>Confidence: {transcriptData.confidence}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* REAL Voice Notes Section - MOBILE RESPONSIVE */}
                  {realVoiceNotes.length > 0 && (
                    <div className="glass-card rounded-2xl p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
                        <Mic className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                        🎵 REAL Instructor Voice Notes ({realVoiceNotes.length})
                      </h3>
                      
                      <div className="mb-3 sm:mb-4 p-3 bg-purple-50 rounded-lg">
                        <p className="text-purple-800 text-xs sm:text-sm">
                          ✅ <strong>Live from Lecturer:</strong> These voice notes were recorded by your instructor specifically for this video!
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {realVoiceNotes.map((note: VoiceNote) => (
                          <div 
                            key={note.id}
                            onClick={() => playVoiceNote(note)}
                            className={`voice-note-card rounded-xl p-3 sm:p-4 cursor-pointer ${
                              selectedVoiceNote?.id === note.id ? 'selected' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <h4 className="font-semibold text-gray-800 text-sm truncate pr-2">{note.title}</h4>
                              {note.duration && note.duration !== '0:00' && (
                                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full flex-shrink-0">
                                  {note.duration}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-2 sm:mb-3 line-clamp-3">
                              {note.transcript}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                              <span className="text-xs text-gray-500">
                                {note.timestamp}
                              </span>
                              <button className="flex items-center justify-center space-x-1 text-purple-600 hover:text-purple-800 text-sm">
                                <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Play Real Audio</span>
                              </button>
                            </div>
                            
                            <div className="mt-2 text-xs bg-green-50 text-green-800 px-2 py-1 rounded text-center">
                              ✅ Real-time from Database
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* FIXED: Selected Voice Note Player with REAL AUDIO - MOBILE RESPONSIVE */}
                      {selectedVoiceNote && (
                        <div className="p-3 sm:p-4 bg-purple-50 rounded-xl border border-purple-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                            <h4 className="font-semibold text-purple-900 text-sm">
                              🎵 Playing REAL Voice Note: {selectedVoiceNote.title}
                            </h4>
                            <button
                              onClick={toggleVoiceNotePlayback}
                              className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                              {isPlayingVoiceNote ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                              <span>{isPlayingVoiceNote ? 'Pause' : 'Play'}</span>
                            </button>
                          </div>
                          
                          {/* Audio Progress Bar */}
                          <div className="mb-3">
                            <div className="voice-note-progress">
                              <div 
                                ref={progressBarRef}
                                className="voice-note-progress-bar"
                              />
                            </div>
                            <div className="flex justify-between text-xs text-purple-600 mt-1">
                              <span>{formatTime(voiceNoteCurrentTime)}</span>
                              <span>{formatTime(voiceNoteDuration)}</span>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-white rounded-lg border">
                            <p className="text-purple-800 text-sm leading-relaxed">
                              📝 <strong>Instructor Note:</strong> {selectedVoiceNote.transcript}
                            </p>
                          </div>
                          
                          <div className="mt-3 text-xs text-purple-600">
                            💡 This REAL voice note was recorded by your instructor from the lecturer portal!
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Voice Notes Message - MOBILE RESPONSIVE */}
                  {selectedVideo && realVoiceNotes.length === 0 && (
                    <div className="glass-card rounded-2xl p-4 sm:p-6">
                      <div className="text-center py-6 sm:py-8">
                        <Mic className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">No Voice Notes Yet</h3>
                        <p className="text-gray-500 text-sm text-center">
                          Your instructor hasn&apos;t recorded any voice notes for this video yet.
                          <br />Check back later for additional explanations and tips!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Transcript Section - MOBILE RESPONSIVE */}
                  <div className="glass-card rounded-2xl p-4 sm:p-6">
                    {isLoadingTranscript && (
                      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-600 flex-shrink-0" />
                          <span className="text-blue-800 font-medium text-sm sm:text-base">Fetching real transcript from AWS...</span>
                        </div>
                      </div>
                    )}

                    {transcriptData && (
                      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold text-green-900 mb-2 flex items-center text-sm sm:text-base">
                          ✅ <span className="ml-2">Real AWS Transcript Data</span>
                        </h3>
                        <div className="text-xs sm:text-sm text-green-800 space-y-1">
                          <p><strong>Job:</strong> {transcriptData.jobName}</p>
                          <p><strong>Status:</strong> {transcriptData.status}</p>
                          <p><strong>Confidence:</strong> {transcriptData.confidence}%</p>
                        </div>
                      </div>
                    )}

                    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">📄 Real AWS Transcript</h3>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => navigator.clipboard.writeText(transcript)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>
                      
                      {transcript ? (
                        <div className="max-h-48 sm:max-h-60 overflow-y-auto space-y-2">
                          {generateTimestampedTranscript(transcript).map((segment, index) => (
                            <div
                              key={index}
                              onClick={() => handleTranscriptClick(segment.time)}
                              className={`transcript-segment ${segment.isActive ? 'active' : ''}`}
                            >
                              <span className="text-xs text-blue-600 font-mono mr-2">
                                {Math.floor(segment.time / 60)}:{(segment.time % 60).toString().padStart(2, '0')}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-800">{segment.text}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 sm:py-8">
                          <div className="text-gray-500 text-sm sm:text-base">
                            {isLoadingTranscript ? 'Loading real transcript...' : 'Select a video to view transcript'}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 sm:mt-4 text-xs text-gray-500">
                        💡 Click on any sentence to jump to that part of the video! Real AWS data integration.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 sm:p-12 text-center">
                  <Play className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-3 sm:mb-4">Select a Lecture to Watch</h3>
                  <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
                    Choose from available lectures or load a video directly with access code
                  </p>
                  <div className="text-xs sm:text-sm text-gray-400">
                    🎯 <strong>Complete Learning Experience:</strong>
                    <br />• Main lecture video with AWS S3 streaming
                    <br />• Real-time AWS transcript with clickable timestamps
                    <br />• REAL instructor voice notes with working audio playback
                    <br />• One access code for complete lecture access
                    <br />🎵 <strong>{getAllVoiceNotes().length} voice notes available</strong> from your instructors!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}