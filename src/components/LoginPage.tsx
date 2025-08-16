// src/components/LoginPage.tsx - FULLY MOBILE RESPONSIVE
'use client'

import { useState } from 'react'
import { User, Lock, GraduationCap, BookOpen, Eye, EyeOff, Zap } from 'lucide-react'
import AnimatedBackground from './AnimatedBackground'

interface LecturerData {
  id: number
  name: string
  email: string
  department: string
  avatar: string
  courses: number[]
  totalStudents: number
  totalLectures: number
}

interface StudentData {
  id: number
  name: string
  email: string
  year: string
  major: string
  avatar: string
  enrolledCourses: number[]
  completedLectures: number
  totalProgress: number
}

type UserData = LecturerData | StudentData

interface LoginProps {
  onLogin: (userType: 'lecturer' | 'student', userData: UserData) => void
}

export default function LoginPage({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Mock user data - EXACTLY what you requested!
  const mockUsers = {
    'lec@gmail.com': {
      password: 'lec123',
      type: 'lecturer' as const,
      data: {
        id: 1,
        name: 'Dr. Sarah Wilson',
        email: 'lec@gmail.com',
        department: 'Computer Science',
        avatar: '👩‍🏫',
        courses: [1, 2, 3, 4],
        totalStudents: 284,
        totalLectures: 47
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
        enrolledCourses: [1, 2],
        completedLectures: 23,
        totalProgress: 76
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1200))

      const user = mockUsers[formData.email as keyof typeof mockUsers]
      
      if (!user) {
        throw new Error('Invalid email address')
      }

      if (user.password !== formData.password) {
        throw new Error('Invalid password')
      }

      // Success - call the onLogin callback
      onLogin(user.type, user.data)

    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleQuickLogin = (email: string, password: string) => {
    setFormData({ ...formData, email, password })
  }

  return (
    <>
      <style jsx global>{`
        .text-clean-shadow {
          filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2));
        }

        .line-static-glow {
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.7); 
          width: 8rem; 
          opacity: 0.8;
        }

        @media (min-width: 640px) {
          .line-static-glow {
            width: 10rem;
          }
        }

        @keyframes slide-up-delayed {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-delayed {
          animation: slide-up-delayed 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-slide-up-delayed-2 {
          animation: slide-up-delayed 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }
        .animate-slide-up-delayed-3 {
          animation: slide-up-delayed 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }
        .animate-slide-up-delayed-4 {
          animation: slide-up-delayed 0.8s ease-out 0.8s forwards;
          opacity: 0;
        }
        .animate-slide-up-delayed-5 {
          animation: slide-up-delayed 0.8s ease-out 1.0s forwards;
          opacity: 0;
        }
        .animate-slide-up-delayed-6 {
          animation: slide-up-delayed 0.8s ease-out 1.2s forwards;
          opacity: 0;
        }
        .animate-slide-up-delayed-7 {
          animation: slide-up-delayed 0.8s ease-out 1.4s forwards;
          opacity: 0;
        }

        @keyframes glass-fade-in {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-glass-fade-in {
          animation: glass-fade-in 1.2s ease-out forwards;
        }

        /* Enhanced Glass Effects */
        .glass-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
          backdrop-filter: blur(32px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 
            0 8px 32px rgba(31, 38, 135, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.5) inset,
            0 2px 8px rgba(255, 255, 255, 0.7) inset;
        }

        .glass-input {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 
            0 4px 16px rgba(31, 38, 135, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.3) inset;
        }

        .glass-button {
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.9), 
            rgba(168, 85, 247, 0.9), 
            rgba(236, 72, 153, 0.9)
          );
          backdrop-filter: blur(16px);
          box-shadow: 
            0 20px 40px rgba(59, 130, 246, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.2) inset,
            0 2px 4px rgba(255, 255, 255, 0.4) inset;
        }

        .input-focus-effect {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .button-static-shadow {
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
        }

        @keyframes aurora-glow {
          0%, 100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
          25% { opacity: 0.8; transform: scale(1.05) rotate(90deg); }
          50% { opacity: 0.4; transform: scale(0.95) rotate(180deg); }
          75% { opacity: 0.9; transform: scale(1.1) rotate(270deg); }
        }
        .animate-aurora-glow {
          animation: aurora-glow 8s ease-in-out infinite;
        }

        .quick-login-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.3));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 
            0 4px 16px rgba(31, 38, 135, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.3) inset;
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        
        {/* GORGEOUS ANIMATED BACKGROUND */}
        <AnimatedBackground />

        {/* Main Content - FULLY MOBILE RESPONSIVE */}
        <div className="relative z-20 min-h-screen flex items-center justify-center p-3 sm:p-4 lg:p-6">
          <div className="w-full max-w-6xl">
            
            {/* MOBILE-FIRST LAYOUT: Single column on mobile, side-by-side on larger screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

              {/* Quick Login Cards - MOBILE RESPONSIVE */}
              <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
                {/* Demo Login Header - MOBILE RESPONSIVE */}
                <div className="text-center animate-slide-up-delayed">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">🎯 Demo Login</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Quick access for judges</p>
                </div>

                {/* Mobile: Stack cards horizontally on larger mobile, vertically on small mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
                  {/* Lecturer Quick Login - MOBILE RESPONSIVE */}
                  <div className="quick-login-card rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 animate-slide-up-delayed-2">
                    <div className="text-center mb-3 sm:mb-4">
                      <div className="text-3xl sm:text-4xl mb-2">👩‍🏫</div>
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base">Lecturer Portal</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Dr. Sarah Wilson</p>
                    </div>
                    <button
                      onClick={() => handleQuickLogin('lec@gmail.com', 'lec123')}
                      className="w-full flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold text-sm sm:text-base"
                    >
                      <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Quick Login</span>
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <div className="mt-2 sm:mt-3 text-xs text-gray-500 text-center">
                      lec@gmail.com • lec123
                    </div>
                  </div>

                  {/* Student Quick Login - MOBILE RESPONSIVE */}
                  <div className="quick-login-card rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 animate-slide-up-delayed-3">
                    <div className="text-center mb-3 sm:mb-4">
                      <div className="text-3xl sm:text-4xl mb-2">👨‍🎓</div>
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base">Student Portal</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Alex Kumar</p>
                    </div>
                    <button
                      onClick={() => handleQuickLogin('stu@gmail.com', 'stu123')}
                      className="w-full flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-semibold text-sm sm:text-base"
                    >
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Quick Login</span>
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <div className="mt-2 sm:mt-3 text-xs text-gray-500 text-center">
                      stu@gmail.com • stu123
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Login Form - MOBILE RESPONSIVE */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <div className="relative group">
                  {/* Enhanced outer glow - RESPONSIVE */}
                  <div className="absolute -inset-3 sm:-inset-6 bg-gradient-to-r from-blue-300/40 via-purple-300/50 to-pink-300/40 rounded-[1.5rem] sm:rounded-[2rem] blur-xl sm:blur-2xl opacity-60 group-hover:opacity-80 transition-all duration-1000 animate-aurora-glow" />
                  
                  {/* Secondary glow layer - RESPONSIVE */}
                  <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-white/60 via-blue-100/40 to-purple-100/40 rounded-[1.2rem] sm:rounded-[1.5rem] blur-lg sm:blur-xl opacity-40 group-hover:opacity-60 transition-all duration-500" />

                  {/* Enhanced Glass Panel - MOBILE RESPONSIVE */}
                  <div className="relative glass-card rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden group-hover:shadow-2xl transition-all duration-500">

                    {/* Enhanced inner glass layers - RESPONSIVE */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-blue-50/10 to-purple-50/15 rounded-[1.2rem] sm:rounded-[1.5rem]" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/15 via-transparent to-purple-100/15 rounded-[1.2rem] sm:rounded-[1.5rem]" />
                    <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/10 to-transparent rounded-[1.2rem] sm:rounded-[1.5rem]" />

                    {/* Content - MOBILE RESPONSIVE PADDING */}
                    <div className="relative p-6 sm:p-8 lg:p-12">

                      {/* Enhanced Header - MOBILE RESPONSIVE */}
                      <div className="text-center mb-8 sm:mb-10 lg:mb-12 animate-glass-fade-in">
                        {/* Logo with enhanced styling - RESPONSIVE */}
                        <div className="mb-6 sm:mb-8 lg:mb-10">
                          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent text-clean-shadow">
                            EduLink Pro
                          </h1>
                          <div className="mt-3 sm:mt-4 h-px mx-auto bg-gradient-to-r from-transparent via-purple-400/70 to-transparent line-static-glow rounded-full" />
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-800 mb-3 sm:mb-4 animate-slide-up-delayed drop-shadow-sm">
                          Welcome Back
                        </h2>

                        <p className="text-gray-600 text-base sm:text-lg lg:text-xl animate-slide-up-delayed-2 drop-shadow-sm">
                          Sign in to continue your educational journey
                        </p>
                      </div>

                      {/* Enhanced Form - MOBILE RESPONSIVE */}
                      <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
                        {/* Enhanced Error Message - MOBILE RESPONSIVE */}
                        {error && (
                          <div className="relative overflow-hidden rounded-2xl animate-slide-up-delayed">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-100/90 to-red-50/80 backdrop-blur-lg border border-red-300/70 shadow-lg" />
                            <div className="relative p-4 sm:p-5 text-red-700">
                              <div className="flex items-start">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-sm sm:text-base">{error}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Enhanced Email Field - MOBILE RESPONSIVE */}
                        <div className="group animate-slide-up-delayed-3">
                          <label className="flex items-center text-sm font-bold text-gray-700 mb-3 sm:mb-4 group-focus-within:text-blue-600 transition-all duration-500">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-500 group-focus-within:text-blue-500 transition-colors duration-300" />
                            Email Address
                          </label>
                          <div className="relative">
                            <div className="absolute inset-0 glass-input rounded-2xl group-focus-within:border-blue-400/80 group-focus-within:shadow-lg group-focus-within:input-focus-effect transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-purple-50/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />

                            <input
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              name="email"
                              required
                              className="relative w-full px-4 sm:px-6 lg:px-7 py-3 sm:py-4 lg:py-5 bg-transparent text-gray-700 font-semibold placeholder-gray-500 focus:outline-none text-base sm:text-lg"
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>

                        {/* Enhanced Password Field - MOBILE RESPONSIVE */}
                        <div className="group animate-slide-up-delayed-4">
                          <label className="flex items-center text-sm font-bold text-gray-700 mb-3 sm:mb-4 group-focus-within:text-blue-600 transition-all duration-500">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-500 group-focus-within:text-blue-500 transition-colors duration-300" />
                            Password
                          </label>
                          <div className="relative">
                            <div className="absolute inset-0 glass-input rounded-2xl group-focus-within:border-blue-400/80 group-focus-within:shadow-lg group-focus-within:input-focus-effect transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-purple-50/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />

                            <input
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={handleChange}
                              name="password"
                              required
                              className="relative w-full px-4 sm:px-6 lg:px-7 py-3 sm:py-4 lg:py-5 bg-transparent text-gray-700 font-semibold placeholder-gray-500 focus:outline-none text-base sm:text-lg pr-12 sm:pr-14"
                              placeholder="Enter your password"
                            />
                            
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-300"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Enhanced Remember Checkbox - MOBILE RESPONSIVE */}
                        <div className="flex items-center justify-between animate-slide-up-delayed-5">
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={formData.remember}
                              onChange={handleChange}
                              name="remember"
                              className="sr-only"
                            />
                            <div className="relative">
                              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl border-2 transition-all duration-300 shadow-sm ${formData.remember ? 'border-blue-500 bg-blue-100 shadow-blue-200' : 'border-gray-300 bg-white/70 group-hover:border-gray-400 group-hover:shadow-md'}`}>
                                {formData.remember && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="ml-3 sm:ml-4 text-gray-700 font-semibold group-hover:text-gray-800 transition-colors duration-300 text-sm sm:text-base">
                              Remember me
                            </span>
                          </label>
                        </div>

                        {/* Enhanced Login Button - MOBILE RESPONSIVE */}
                        <div className="animate-slide-up-delayed-6">
                          <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full group overflow-hidden rounded-2xl button-static-shadow hover:shadow-2xl transition-all duration-500"
                          >
                            <div className="absolute inset-0 glass-button group-hover:shadow-2xl transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-lg opacity-50 group-hover:opacity-70 transition-all duration-500" />

                            <div className="relative py-3 sm:py-4 lg:py-5 px-6 sm:px-8 text-white font-bold text-lg sm:text-xl group-hover:scale-[1.02] transition-transform duration-300 flex items-center justify-center">
                              {loading ? (
                                <>
                                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span className="text-base sm:text-lg lg:text-xl">Signing in...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                  </svg>
                                  <span className="text-base sm:text-lg lg:text-xl">Sign In</span>
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                  </svg>
                                </>
                              )}
                            </div>
                          </button>
                        </div>
                      </form>
                    </div>
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