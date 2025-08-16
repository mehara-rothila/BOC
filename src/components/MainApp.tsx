// src/components/MainApp.tsx - Complete Application Flow - FULLY MOBILE RESPONSIVE
'use client'

import { useState } from 'react'
import LoginPage from './LoginPage'
import LecturerDashboard from './LecturerDashboard'
import StudentDashboard from './StudentDashboard'
import LectureTranscription from './LectureTranscription'

type AppState = 'login' | 'lecturer-dashboard' | 'student-dashboard' | 'transcription-upload'

interface BaseUserData {
  id: number
  name: string
  email: string
  avatar: string
}

export default function MainApp() {
  const [currentState, setCurrentState] = useState<AppState>('login')
  const [currentUser, setCurrentUser] = useState<{ type: 'lecturer' | 'student', data: BaseUserData & Record<string, unknown> } | null>(null)

  const handleLogin = (userType: 'lecturer' | 'student', userData: BaseUserData & Record<string, unknown>) => {
    setCurrentUser({ type: userType, data: userData })
    setCurrentState(userType === 'lecturer' ? 'lecturer-dashboard' : 'student-dashboard')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentState('login')
  }

  const navigateToTranscription = () => {
    setCurrentState('transcription-upload')
  }

  const navigateBack = () => {
    if (currentUser) {
      setCurrentState(currentUser.type === 'lecturer' ? 'lecturer-dashboard' : 'student-dashboard')
    } else {
      setCurrentState('login')
    }
  }

  // Render appropriate component based on current state
  switch (currentState) {
    case 'login':
      return <LoginPage onLogin={handleLogin as (userType: 'lecturer' | 'student', userData: unknown) => void} />

    case 'lecturer-dashboard':
      return (
        <LecturerDashboard 
          user={currentUser!.data as { avatar: string; name: string }}
          onLogout={handleLogout}
          onNavigateToTranscription={navigateToTranscription}
        />
      )

    case 'student-dashboard':
      return (
        <StudentDashboard 
          user={currentUser!.data as unknown as { id: string; name: string; avatar: string; enrolledCourses: string[] }}
          onLogout={handleLogout}
        />
      )

    case 'transcription-upload':
      return (
        <div>
          {/* Navigation Header - MOBILE RESPONSIVE */}
          <div className="bg-white shadow-sm border-b p-3 sm:p-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={navigateBack}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-3 sm:mb-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm sm:text-base">Back to Dashboard</span>
              </button>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                  <span className="text-gray-700 text-sm sm:text-base">Welcome, {currentUser?.data.name}</span>
                  <div className="text-lg sm:text-2xl">{currentUser?.data.avatar}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800 transition-colors text-sm sm:text-base self-start sm:self-center"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          {/* Your existing transcription component */}
          <LectureTranscription />
        </div>
      )

    default:
      return <LoginPage onLogin={handleLogin as (userType: 'lecturer' | 'student', userData: unknown) => void} />
  }
}