'use client'

import { useState, useEffect, useCallback } from 'react'

const UNLOCK_PHRASES = [
  "I understand that staying up late will make tomorrow harder and I choose sleep",
  "My future self will thank me for going to bed now instead of later",
  "Sleep is more important than whatever I think I need to do right now",
  "I am making the responsible choice to prioritize my health and rest",
  "Nothing good happens after bedtime and I accept this truth tonight",
]

function generateMathProblem(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 50) + 10
  const b = Math.floor(Math.random() * 50) + 10
  const c = Math.floor(Math.random() * 20) + 5
  return {
    question: `${a} + ${b} - ${c}`,
    answer: a + b - c,
  }
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

type SleepRecord = {
  [date: string]: boolean
}

type CircleMember = {
  id: string
  name: string
  streak: number
  status: 'on-track' | 'missed'
  emoji: string
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [bedtime, setBedtime] = useState('22:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [isLockdown, setIsLockdown] = useState(false)
  const [autoLockEnabled, setAutoLockEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Streak tracking
  const [sleepRecords, setSleepRecords] = useState<SleepRecord>({})
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  // Accountability Circle (demo data - would be from Supabase in production)
  const [circleMmbers, setCircleMembers] = useState<CircleMember[]>([])
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [friendCode, setFriendCode] = useState('')
  const [myCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase())

  // Unlock challenge states
  const [unlockStep, setUnlockStep] = useState(0)
  const [unlockPhrase, setUnlockPhrase] = useState('')
  const [typedPhrase, setTypedPhrase] = useState('')
  const [waitTimeRemaining, setWaitTimeRemaining] = useState(0)
  const [mathProblem, setMathProblem] = useState<{ question: string; answer: number } | null>(null)
  const [mathAnswer, setMathAnswer] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Load saved settings
  useEffect(() => {
    const savedBedtime = localStorage.getItem('bedtime')
    const savedWakeTime = localStorage.getItem('wakeTime')
    const savedAutoLock = localStorage.getItem('autoLockEnabled')
    const savedLockdown = localStorage.getItem('isLockdown')
    const savedRecords = localStorage.getItem('sleepRecords')
    const savedBestStreak = localStorage.getItem('bestStreak')
    const savedCircle = localStorage.getItem('circleMembers')

    if (savedBedtime) setBedtime(savedBedtime)
    if (savedWakeTime) setWakeTime(savedWakeTime)
    if (savedAutoLock) setAutoLockEnabled(savedAutoLock === 'true')
    if (savedRecords) setSleepRecords(JSON.parse(savedRecords))
    if (savedBestStreak) setBestStreak(parseInt(savedBestStreak))
    if (savedCircle) setCircleMembers(JSON.parse(savedCircle))
    if (savedLockdown === 'true') {
      setIsLockdown(true)
      startUnlockChallenge()
    }
  }, [])

  // Calculate current streak
  useEffect(() => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      if (sleepRecords[dateStr]) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    setCurrentStreak(streak)
    if (streak > bestStreak) {
      setBestStreak(streak)
      localStorage.setItem('bestStreak', String(streak))
    }
  }, [sleepRecords, bestStreak])

  // Save settings
  useEffect(() => {
    localStorage.setItem('bedtime', bedtime)
  }, [bedtime])

  useEffect(() => {
    localStorage.setItem('wakeTime', wakeTime)
  }, [wakeTime])

  useEffect(() => {
    localStorage.setItem('autoLockEnabled', String(autoLockEnabled))
  }, [autoLockEnabled])

  useEffect(() => {
    localStorage.setItem('isLockdown', String(isLockdown))
  }, [isLockdown])

  useEffect(() => {
    localStorage.setItem('sleepRecords', JSON.stringify(sleepRecords))
  }, [sleepRecords])

  useEffect(() => {
    localStorage.setItem('circleMembers', JSON.stringify(circleMmbers))
  }, [circleMmbers])

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Check for auto-lockdown at bedtime
  useEffect(() => {
    if (!autoLockEnabled || isLockdown) return

    const [hours, minutes] = bedtime.split(':').map(Number)
    const now = currentTime

    if (now.getHours() === hours && now.getMinutes() === minutes) {
      activateLockdown()
    }
  }, [currentTime, bedtime, autoLockEnabled, isLockdown])

  // Check for auto-unlock at wake time
  useEffect(() => {
    if (!isLockdown) return

    const [hours, minutes] = wakeTime.split(':').map(Number)
    const now = currentTime

    if (now.getHours() === hours && now.getMinutes() === minutes) {
      // Mark as successful sleep
      const today = new Date().toISOString().split('T')[0]
      setSleepRecords(prev => ({ ...prev, [today]: true }))
      setIsLockdown(false)
      setUnlockStep(0)
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  }, [currentTime, wakeTime, isLockdown])

  // Wait timer countdown
  useEffect(() => {
    if (waitTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setWaitTimeRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [waitTimeRemaining])

  const startUnlockChallenge = useCallback(() => {
    setUnlockStep(1)
    setUnlockPhrase(UNLOCK_PHRASES[Math.floor(Math.random() * UNLOCK_PHRASES.length)])
    setTypedPhrase('')
    setMathAnswer('')
    setErrorMessage('')
  }, [])

  const activateLockdown = async () => {
    setIsLockdown(true)
    startUnlockChallenge()
    // Try to enter fullscreen
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } catch (e) {
      console.log('Fullscreen not available')
    }
  }

  const handlePhraseSubmit = () => {
    if (typedPhrase.trim().toLowerCase() === unlockPhrase.toLowerCase()) {
      setUnlockStep(2)
      setWaitTimeRemaining(30)
      setErrorMessage('')
    } else {
      setErrorMessage('Phrase does not match. Type it exactly as shown.')
      setTypedPhrase('')
    }
  }

  const handleStartMathChallenge = () => {
    if (waitTimeRemaining === 0) {
      setUnlockStep(3)
      setMathProblem(generateMathProblem())
    }
  }

  const handleMathSubmit = () => {
    if (mathProblem && parseInt(mathAnswer) === mathProblem.answer) {
      setIsLockdown(false)
      setUnlockStep(0)
      setErrorMessage('')
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    } else {
      setErrorMessage('Wrong answer. Try again with a new problem.')
      setMathProblem(generateMathProblem())
      setMathAnswer('')
    }
  }

  const addFriend = () => {
    if (friendCode.trim()) {
      const newMember: CircleMember = {
        id: Math.random().toString(36).substring(7),
        name: `Friend ${circleMmbers.length + 1}`,
        streak: Math.floor(Math.random() * 15),
        status: 'on-track',
        emoji: ['🌙', '⭐', '🌟', '💫', '✨'][Math.floor(Math.random() * 5)]
      }
      setCircleMembers([...circleMmbers, newMember])
      setFriendCode('')
      setShowAddFriend(false)
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const formatBedtime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const getTimeUntilBedtime = () => {
    const [hours, minutes] = bedtime.split(':').map(Number)
    const bedtimeDate = new Date(currentTime)
    bedtimeDate.setHours(hours, minutes, 0, 0)

    if (bedtimeDate <= currentTime) {
      bedtimeDate.setDate(bedtimeDate.getDate() + 1)
    }

    const diff = bedtimeDate.getTime() - currentTime.getTime()
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60))
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return { hours: hoursLeft, minutes: minutesLeft }
  }

  const getWeekDays = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

    return DAYS.map((day, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const dateStr = date.toISOString().split('T')[0]
      const isToday = date.toDateString() === today.toDateString()
      const completed = sleepRecords[dateStr]
      return { day, dateStr, isToday, completed }
    })
  }

  const timeUntilBed = getTimeUntilBedtime()
  const weekDays = getWeekDays()

  // Benefits based on streak
  const getBenefits = () => {
    const focusBoost = Math.min(12 + currentStreak * 2, 25)
    const moodBoost = Math.min(8 + currentStreak * 3, 40)
    const energyBoost = Math.min(15 + currentStreak * 2, 35)
    return { focusBoost, moodBoost, energyBoost }
  }

  const benefits = getBenefits()

  // Lockdown Screen (Fullscreen)
  if (isLockdown) {
    return (
      <main className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-b from-[#0a1628] to-[#1a2744] z-50">
        <div className="max-w-lg w-full">
          {/* Moon */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.4)] relative">
              <div className="absolute top-6 left-8 w-4 h-4 rounded-full bg-amber-300/50"></div>
              <div className="absolute top-12 right-10 w-3 h-3 rounded-full bg-amber-300/50"></div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-amber-200 mb-2">Time for Bed</h1>
            <p className="text-slate-400">Lockdown ends at {formatBedtime(wakeTime)}</p>
          </div>

          <div className="bg-[#1e293b]/80 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
            {/* Step 1: Type the phrase */}
            {unlockStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</div>
                  <span>Step 1 of 3</span>
                </div>
                <h2 className="text-lg font-medium text-white">Type this phrase exactly</h2>
                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-600/50">
                  <p className="text-amber-300 text-center leading-relaxed">&quot;{unlockPhrase}&quot;</p>
                </div>
                <textarea
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  className="w-full p-4 bg-[#0f172a] border border-slate-600/50 rounded-xl text-white resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
                  rows={3}
                  placeholder="Type the phrase here..."
                />
                {errorMessage && (
                  <p className="text-red-400 text-center text-sm">{errorMessage}</p>
                )}
                <button
                  onClick={handlePhraseSubmit}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Wait period */}
            {unlockStep === 2 && (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-4">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</div>
                  <span>Step 2 of 3</span>
                </div>
                <h2 className="text-lg font-medium text-white">Reflection Period</h2>
                <p className="text-slate-400 text-sm">Consider going back to sleep instead...</p>
                <div className="text-5xl font-light text-amber-300 my-8 font-mono">
                  {waitTimeRemaining > 0 ? (
                    <span>0:{waitTimeRemaining.toString().padStart(2, '0')}</span>
                  ) : (
                    <span className="text-emerald-400">Ready</span>
                  )}
                </div>
                <button
                  onClick={handleStartMathChallenge}
                  disabled={waitTimeRemaining > 0}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    waitTimeRemaining > 0
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {waitTimeRemaining > 0 ? 'Please wait...' : 'Continue'}
                </button>
              </div>
            )}

            {/* Step 3: Math problem */}
            {unlockStep === 3 && mathProblem && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</div>
                  <span>Step 3 of 3</span>
                </div>
                <h2 className="text-lg font-medium text-white text-center">Solve this problem</h2>
                <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-600/50 text-center">
                  <p className="text-3xl font-mono text-amber-300">{mathProblem.question} = ?</p>
                </div>
                <input
                  type="number"
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  className="w-full p-4 bg-[#0f172a] border border-slate-600/50 rounded-xl text-white text-center text-2xl font-mono focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="?"
                />
                {errorMessage && (
                  <p className="text-red-400 text-center text-sm">{errorMessage}</p>
                )}
                <button
                  onClick={handleMathSubmit}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
            )}
          </div>

          <p className="text-slate-500 text-center mt-6 text-sm">
            Or just go to sleep - lockdown ends automatically at {formatBedtime(wakeTime)}
          </p>
        </div>
      </main>
    )
  }

  // Settings Modal
  if (showSettings) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2744] p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-white">Settings</h1>
            <button
              onClick={() => setShowSettings(false)}
              className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Bedtime */}
            <div className="bg-[#1e293b]/80 rounded-2xl p-4 border border-slate-700/50">
              <label className="flex items-center gap-3 text-slate-400 text-sm mb-3">
                <span className="text-amber-400">🌙</span>
                Bedtime
              </label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="w-full p-3 bg-[#0f172a] border border-slate-600/50 rounded-xl text-white text-center text-lg focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            {/* Wake Time */}
            <div className="bg-[#1e293b]/80 rounded-2xl p-4 border border-slate-700/50">
              <label className="flex items-center gap-3 text-slate-400 text-sm mb-3">
                <span className="text-amber-400">☀️</span>
                Lockdown Ends At
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full p-3 bg-[#0f172a] border border-slate-600/50 rounded-xl text-white text-center text-lg focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              <p className="text-slate-500 text-xs mt-2 text-center">Lockdown automatically ends at this time</p>
            </div>

            {/* Auto-Lockdown Toggle */}
            <div className="bg-[#1e293b]/80 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Auto-Lockdown</p>
                  <p className="text-slate-400 text-sm">Start at bedtime</p>
                </div>
                <button
                  onClick={() => setAutoLockEnabled(!autoLockEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    autoLockEnabled ? 'bg-amber-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                      autoLockEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Your Code */}
            <div className="bg-[#1e293b]/80 rounded-2xl p-4 border border-slate-700/50">
              <label className="flex items-center gap-3 text-slate-400 text-sm mb-3">
                <span className="text-amber-400">🔗</span>
                Your Friend Code
              </label>
              <div className="bg-[#0f172a] p-3 rounded-xl text-center">
                <span className="text-2xl font-mono text-amber-300 tracking-widest">{myCode}</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 text-center">Share this code with friends to connect</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Main App Screen
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2744] p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xl">🌙</span>
            <span className="text-white font-semibold text-lg">On Time</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Moon and Greeting */}
        <div className="flex flex-col items-center mt-4 mb-8">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.3)] relative mb-6">
            <div className="absolute top-5 left-7 w-4 h-4 rounded-full bg-amber-300/50"></div>
            <div className="absolute top-10 right-8 w-3 h-3 rounded-full bg-amber-300/50"></div>
          </div>
          <h1 className="text-2xl font-semibold text-amber-200">{getGreeting()}</h1>
          <p className="text-slate-400">Your body will thank you tomorrow</p>
        </div>

        {/* Countdown Card */}
        <div className="bg-[#1e293b]/80 backdrop-blur rounded-2xl p-6 mb-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <span className="text-amber-400">🌙</span>
            <span>Bedtime at {formatBedtime(bedtime)}</span>
          </div>

          <div className="text-center mb-6">
            <div className="text-6xl font-light text-white mb-1 tracking-tight">
              {timeUntilBed.hours.toString().padStart(2, '0')}
              <span className="text-amber-400">:</span>
              {timeUntilBed.minutes.toString().padStart(2, '0')}
            </div>
            <p className="text-slate-400 text-sm">Time until bedtime</p>
          </div>

          <button
            onClick={activateLockdown}
            className="w-full py-4 bg-slate-700/80 hover:bg-slate-600/80 rounded-xl font-medium transition-colors text-white"
          >
            Start Bedtime Mode
          </button>
        </div>

        {/* Sleep Streak */}
        <div className="bg-[#1e293b]/80 backdrop-blur rounded-2xl p-5 mb-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">🔥</span>
              <span className="text-white font-medium">Sleep Streak</span>
            </div>
            <span className="text-slate-400"><span className="text-white font-semibold">{currentStreak}</span> nights</span>
          </div>

          <div className="flex justify-between mb-4">
            {weekDays.map(({ day, dateStr, isToday, completed }) => (
              <button
                key={dateStr}
                onClick={() => {
                  setSleepRecords(prev => ({
                    ...prev,
                    [dateStr]: !prev[dateStr]
                  }))
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  completed
                    ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50'
                    : isToday
                    ? 'bg-slate-700 text-white ring-2 ring-amber-500/50'
                    : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="text-center pt-3 border-t border-slate-700/50">
            <span className="text-slate-400 text-sm">Best streak: </span>
            <span className="text-white font-semibold">{bestStreak} nights</span>
          </div>
        </div>

        {/* Your Future Self */}
        <div className="bg-[#1e293b]/80 backdrop-blur rounded-2xl p-5 mb-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400">✨</span>
            <span className="text-white font-medium">Your Future Self</span>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            After {currentStreak} days of consistent sleep, you&apos;ll experience:
          </p>

          <div className="space-y-4">
            {/* Sharper Focus */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <span className="text-amber-400">🎯</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm">Sharper Focus</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">+12%</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-medium">+{benefits.focusBoost}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(benefits.focusBoost / 25) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Better Mood */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <span className="text-rose-400">💖</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm">Better Mood</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">+8%</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-medium">+{benefits.moodBoost}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(benefits.moodBoost / 40) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* More Energy */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <span className="text-orange-400">⚡</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm">More Energy</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">+15%</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-medium">+{benefits.energyBoost}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(benefits.energyBoost / 35) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accountability Circle */}
        <div className="bg-[#1e293b]/80 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">👥</span>
              <span className="text-white font-medium">Accountability Circle</span>
            </div>
            <button
              onClick={() => setShowAddFriend(true)}
              className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {showAddFriend && (
            <div className="mb-4 p-4 bg-[#0f172a] rounded-xl border border-slate-600/50">
              <p className="text-slate-400 text-sm mb-3">Enter friend&apos;s code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="flex-1 p-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white text-center font-mono uppercase tracking-widest focus:outline-none focus:border-amber-500/50"
                  maxLength={6}
                />
                <button
                  onClick={addFriend}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg font-medium text-black transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {circleMmbers.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm">No friends yet</p>
              <p className="text-slate-500 text-xs mt-1">Add friends to track each other&apos;s progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {circleMmbers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <span>{member.emoji}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{member.name}</p>
                      <p className="text-slate-400 text-xs">{member.streak} night streak</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    member.status === 'on-track'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {member.status === 'on-track' ? 'On track' : 'Missed'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-slate-500 text-xs text-center mt-4 pt-4 border-t border-slate-700/50">
            Your circle is notified if you miss bedtime
          </p>
        </div>
      </div>
    </main>
  )
}
