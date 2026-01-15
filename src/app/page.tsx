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

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [bedtime, setBedtime] = useState('22:00')
  const [isLockdown, setIsLockdown] = useState(false)
  const [autoLockEnabled, setAutoLockEnabled] = useState(true)

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
    const savedAutoLock = localStorage.getItem('autoLockEnabled')
    const savedLockdown = localStorage.getItem('isLockdown')

    if (savedBedtime) setBedtime(savedBedtime)
    if (savedAutoLock) setAutoLockEnabled(savedAutoLock === 'true')
    if (savedLockdown === 'true') {
      setIsLockdown(true)
      startUnlockChallenge()
    }
  }, [])

  // Save settings
  useEffect(() => {
    localStorage.setItem('bedtime', bedtime)
  }, [bedtime])

  useEffect(() => {
    localStorage.setItem('autoLockEnabled', String(autoLockEnabled))
  }, [autoLockEnabled])

  useEffect(() => {
    localStorage.setItem('isLockdown', String(isLockdown))
  }, [isLockdown])

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

  const activateLockdown = () => {
    setIsLockdown(true)
    startUnlockChallenge()
  }

  const handlePhraseSubmit = () => {
    if (typedPhrase.trim().toLowerCase() === unlockPhrase.toLowerCase()) {
      setUnlockStep(2)
      setWaitTimeRemaining(30) // 30 second wait
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
    } else {
      setErrorMessage('Wrong answer. Try again with a new problem.')
      setMathProblem(generateMathProblem())
      setMathAnswer('')
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
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

  const timeUntilBed = getTimeUntilBedtime()

  // Lockdown Screen
  if (isLockdown) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-2xl w-full bg-slate-800/50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-slate-700">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌙</div>
            <h1 className="text-3xl font-bold text-purple-400 mb-2">Lockdown Mode Active</h1>
            <p className="text-slate-400">It&apos;s time for bed. Complete the challenges to unlock.</p>
          </div>

          {/* Step 1: Type the phrase */}
          {unlockStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center">Step 1 of 3: Type this phrase exactly</h2>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                <p className="text-yellow-300 text-lg text-center italic">&quot;{unlockPhrase}&quot;</p>
              </div>
              <textarea
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:border-purple-500"
                rows={3}
                placeholder="Type the phrase here..."
              />
              {errorMessage && (
                <p className="text-red-400 text-center">{errorMessage}</p>
              )}
              <button
                onClick={handlePhraseSubmit}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
              >
                Submit Phrase
              </button>
            </div>
          )}

          {/* Step 2: Wait period */}
          {unlockStep === 2 && (
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-semibold">Step 2 of 3: Reflection Period</h2>
              <p className="text-slate-400">Take a moment to reflect on why you set this bedtime.</p>
              <div className="text-6xl font-mono text-purple-400 my-8">
                {waitTimeRemaining > 0 ? (
                  <span>{waitTimeRemaining}s</span>
                ) : (
                  <span className="text-green-400">Ready!</span>
                )}
              </div>
              <button
                onClick={handleStartMathChallenge}
                disabled={waitTimeRemaining > 0}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  waitTimeRemaining > 0
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {waitTimeRemaining > 0 ? 'Please Wait...' : 'Continue to Final Step'}
              </button>
            </div>
          )}

          {/* Step 3: Math problem */}
          {unlockStep === 3 && mathProblem && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center">Step 3 of 3: Solve This Problem</h2>
              <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-600 text-center">
                <p className="text-3xl font-mono text-yellow-300">{mathProblem.question} = ?</p>
              </div>
              <input
                type="number"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg text-white text-center text-2xl font-mono focus:outline-none focus:border-purple-500"
                placeholder="Your answer"
              />
              {errorMessage && (
                <p className="text-red-400 text-center">{errorMessage}</p>
              )}
              <button
                onClick={handleMathSubmit}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
              >
                Submit Answer
              </button>
            </div>
          )}

          <p className="text-slate-500 text-center mt-8 text-sm">
            Tip: Go to sleep instead of trying to unlock. Your future self will thank you.
          </p>
        </div>
      </main>
    )
  }

  // Main App Screen
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">😴</div>
          <h1 className="text-3xl font-bold text-purple-400">On Time</h1>
          <p className="text-slate-400">Your bedtime accountability app</p>
        </div>

        {/* Current Time */}
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm uppercase tracking-wide">Current Time</p>
          <p className="text-4xl font-mono text-white">{formatTime(currentTime)}</p>
        </div>

        {/* Time Until Bedtime */}
        <div className="bg-slate-900/50 rounded-xl p-6 mb-6">
          <p className="text-slate-400 text-sm uppercase tracking-wide text-center mb-2">Time Until Bedtime</p>
          <p className="text-3xl font-bold text-center text-purple-400">
            {timeUntilBed.hours}h {timeUntilBed.minutes}m
          </p>
        </div>

        {/* Bedtime Setting */}
        <div className="mb-6">
          <label className="block text-slate-400 text-sm uppercase tracking-wide mb-2">
            Set Bedtime
          </label>
          <input
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-center text-xl focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Auto-lock Toggle */}
        <div className="flex items-center justify-between mb-6 p-4 bg-slate-900/50 rounded-lg">
          <div>
            <p className="text-white font-medium">Auto-Lockdown</p>
            <p className="text-slate-400 text-sm">Activate at bedtime</p>
          </div>
          <button
            onClick={() => setAutoLockEnabled(!autoLockEnabled)}
            className={`w-14 h-8 rounded-full transition-colors relative ${
              autoLockEnabled ? 'bg-purple-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                autoLockEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Manual Lockdown Button */}
        <button
          onClick={activateLockdown}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-purple-500/25"
        >
          🔒 Activate Lockdown Now
        </button>

        <p className="text-slate-500 text-center mt-4 text-sm">
          Warning: Lockdown is intentionally difficult to disable!
        </p>
      </div>
    </main>
  )
}
