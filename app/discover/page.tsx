'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, PenLine, Sparkles, RotateCcw, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { ChatMessage } from '@/components/ChatMessage'
import { TypingIndicator } from '@/components/TypingIndicator'
import type { ChatMessage as ChatMessageType, Preferences } from '@/types'

const OPENING_MESSAGE: ChatMessageType = {
  role: 'assistant',
  content: "Where's your mind wandering?",
}

const GUIDED_STEPS = [
  {
    question: 'What kind of escape?',
    choices: ['Sun & beaches', 'Mountains & wild', 'City & culture', 'Ancient & historic'],
  },
  {
    question: 'Who are you traveling with?',
    choices: ['Solo', 'Couple', 'Family with kids', 'Group of friends'],
  },
  {
    question: 'How long is the trip?',
    choices: ['A long weekend', 'One week', 'Two weeks', 'Open-ended'],
  },
  {
    question: 'What kind of culture?',
    choices: ['Traditional & ancient', 'Modern & cosmopolitan', 'Spiritual & sacred', 'Artistic & bohemian'],
  },
  {
    question: 'Which part of the world?',
    choices: ['Europe', 'Asia & Pacific', 'Americas', 'Africa & Middle East'],
  },
  {
    question: "What's the vibe?",
    choices: ['Slow & relaxed', 'Action-packed', 'Romantic', 'Off the beaten path'],
  },
  {
    question: "What's the weather like?",
    choices: ['Hot & tropical', 'Cool & dramatic', 'Warm & dry', 'Mild & fresh'],
  },
  {
    question: "What's your budget?",
    choices: ['Budget-friendly', 'Mid-range', 'Luxury', 'No limit'],
  },
]

// One-tap examples shown in free mode before the first message, so an empty
// text box isn't the only way in.
const STARTER_PROMPTS = [
  'A food-focused week somewhere in Asia',
  'Quiet beaches on a low budget',
  'Hiking and hot springs in autumn',
  'A romantic city break in Europe',
]

interface ChatResponse {
  ready: boolean
  message: string
  preferences?: Preferences
}

type Mode = 'selecting' | 'free' | 'guided'

export default function DiscoverPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessageType[]>([OPENING_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [mode, setMode] = useState<Mode>('selecting')
  const [inputFocused, setInputFocused] = useState(false)

  // Guided mode state
  const [guidedStep, setGuidedStep] = useState(0)
  const [guidedAnswers, setGuidedAnswers] = useState<string[]>([])
  const [showGuideChoices, setShowGuideChoices] = useState(false)
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [retryFn, setRetryFn] = useState<(() => void) | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, showGuideChoices])

  function handleModeSelect(selected: 'free' | 'guided') {
    setMode(selected)
    if (selected === 'free') {
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }
    // Guided: immediately show first question — no API call needed
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: GUIDED_STEPS[0].question }])
      setGuidedStep(0)
      setShowGuideChoices(true)
    }, 150)
  }

  async function runSuggest(preferences: Preferences) {
    setRetryFn(null)
    setSearching(true)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      })
      if (!res.ok) {
        setSearching(false)
        setMessages((prev) => [...prev, { role: 'assistant', content: "I had trouble finding destinations." }])
        setRetryFn(() => () => runSuggest(preferences))
        return
      }
      const suggestions: unknown = await res.json()
      sessionStorage.setItem('wander_destinations', JSON.stringify(suggestions))
      sessionStorage.setItem('wander_preferences', JSON.stringify(preferences))
      router.push('/results')
    } catch {
      setSearching(false)
      setMessages((prev) => [...prev, { role: 'assistant', content: "I had trouble finding destinations." }])
      setRetryFn(() => () => runSuggest(preferences))
    }
  }

  async function handleChipClick(choice: string) {
    setSelectedChip(choice)
    await new Promise(r => setTimeout(r, 240))
    setSelectedChip(null)
    handleGuidedChoice(choice)
  }

  async function handleGuidedChoice(choice: string) {
    setShowGuideChoices(false)
    setRetryFn(null)
    const newAnswers = [...guidedAnswers, choice]
    setGuidedAnswers(newAnswers)
    setMessages((prev) => [...prev, { role: 'user', content: choice }])

    const nextStep = guidedStep + 1

    if (nextStep < GUIDED_STEPS.length) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'assistant', content: GUIDED_STEPS[nextStep].question }])
        setGuidedStep(nextStep)
        setShowGuideChoices(true)
      }, 280)
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Perfect — finding your destinations now…' }])
      const [escape, travelers, duration, culture, continent, vibe, weather, budget] = newAnswers
      const preferences: Preferences = {
        summary: `${escape}, traveling ${travelers}, ${duration}, ${culture} culture, ${continent}, ${vibe}, ${weather} weather, ${budget} budget`,
        climate: weather,
        budget,
        travelStyle: `${escape}, ${vibe}, ${travelers}`,
        foodPreferences: '',
        other: `${culture} culture, ${continent}, trip length: ${duration}`,
      }
      await runSuggest(preferences)
    }
  }

  // Free mode: full chat flow
  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    setRetryFn(null)
    const userMessage: ChatMessageType = { role: 'user', content }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) {
        setLoading(false)
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
        setRetryFn(() => () => sendMessage(content))
        return
      }

      const data: ChatResponse = await res.json()
      setLoading(false)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])

      if (data.ready && data.preferences) {
        await runSuggest(data.preferences)
      }
    } catch {
      setLoading(false)
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
      setRetryFn(() => () => sendMessage(content))
    }
  }

  // Undo the last guided answer: drop the current question and the previous
  // answer, then show the previous question's choices again.
  function handleGuidedBack() {
    if (guidedAnswers.length === 0 || !showGuideChoices || searching) return
    setMessages((prev) => prev.slice(0, -2))
    setGuidedAnswers((prev) => prev.slice(0, -1))
    setGuidedStep((s) => s - 1)
    setRetryFn(null)
  }

  function resizeInput(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  function handleStartOver() {
    setMode('selecting')
    setMessages([OPENING_MESSAGE])
    setGuidedStep(0)
    setGuidedAnswers([])
    setShowGuideChoices(false)
    setRetryFn(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const showInput = mode === 'free'
  const currentChoices = mode === 'guided' && showGuideChoices ? GUIDED_STEPS[guidedStep]?.choices ?? [] : []

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <div className={`flex-1 overflow-y-auto pt-20 px-4 max-w-2xl mx-auto w-full ${showInput ? 'pb-36' : 'pb-10'}`}>
        <div className="flex flex-col gap-4 py-6">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} index={i} />
          ))}
          {loading && <TypingIndicator />}

          {/* Mode selection */}
          <AnimatePresence>
            {mode === 'selecting' && !loading && (
              <motion.div
                className="flex flex-wrap gap-3 mt-1 ml-11"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <ModeCard
                  icon={<PenLine size={16} />}
                  label="Describe it"
                  sub="Type freely"
                  onClick={() => handleModeSelect('free')}
                />
                <ModeCard
                  icon={<Sparkles size={16} />}
                  label="Guide me"
                  sub="Tap choices"
                  onClick={() => handleModeSelect('guided')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guided choice chips */}
          <AnimatePresence>
            {currentChoices.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-2 ml-11"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
              >
                {currentChoices.map((c) => (
                  <motion.button
                    key={c}
                    onClick={() => handleChipClick(c)}
                    className="text-xs px-4 py-2 rounded-full"
                    style={{
                      color: c === selectedChip ? 'var(--color-bg)' : 'var(--color-accent)',
                      backgroundColor: c === selectedChip
                        ? 'var(--color-accent)'
                        : 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
                    }}
                    whileHover={{ scale: 1.05, backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    {c}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress + back / start over — guided mode only */}
          {mode === 'guided' && !searching && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 ml-11 mt-1">
              <div
                className="flex gap-1.5"
                role="progressbar"
                aria-label="Guided questions"
                aria-valuemin={0}
                aria-valuemax={GUIDED_STEPS.length}
                aria-valuenow={guidedAnswers.length}
              >
                {GUIDED_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i < guidedAnswers.length ? 16 : 5,
                      height: 5,
                      backgroundColor: i < guidedAnswers.length
                        ? 'var(--color-accent)'
                        : i === guidedStep && showGuideChoices
                        ? 'color-mix(in srgb, var(--color-accent) 40%, transparent)'
                        : 'color-mix(in srgb, var(--color-text) 15%, transparent)',
                    }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--color-subtle)' }}>
                Step {Math.min(guidedStep + 1, GUIDED_STEPS.length)} of {GUIDED_STEPS.length}
              </span>
              {guidedAnswers.length > 0 && (
                <>
                  <button
                    onClick={handleGuidedBack}
                    disabled={!showGuideChoices}
                    className="flex items-center gap-1 text-xs min-h-8 px-2 rounded-full opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <ArrowLeft size={12} aria-hidden="true" /> Back
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="text-xs min-h-8 px-2 rounded-full opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Start over
                  </button>
                </>
              )}
            </div>
          )}

          {/* Try again button — appears after a failed API call */}
          <AnimatePresence>
            {retryFn && !searching && (
              <motion.div
                className="ml-11"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={retryFn}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                    color: 'var(--color-accent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
                  }}
                >
                  <RotateCcw size={11} />
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Starter prompts — free mode, before the first message */}
          <AnimatePresence>
            {mode === 'free' && messages.length === 1 && !loading && (
              <motion.div
                className="flex flex-col gap-2 ml-11"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-xs" style={{ color: 'var(--color-subtle)' }}>
                  Not sure where to start? Try one of these:
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="text-xs min-h-9 px-4 rounded-full transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]"
                      style={{
                        color: 'var(--color-text)',
                        backgroundColor: 'color-mix(in srgb, var(--color-text) 6%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--color-text) 14%, transparent)',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {searching && (
            <p role="status" className="text-center text-sm animate-pulse mt-4" style={{ color: 'var(--color-subtle)' }}>
              Finding your perfect destinations…
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Text input — free mode only */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-md"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-bg) 90%, transparent)',
              borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
            }}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="max-w-2xl mx-auto flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); resizeInput(e.target) }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Tell me about your dream trip…"
                aria-label="Describe your dream trip"
                rows={1}
                className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-card-bg)',
                  color: 'var(--color-text)',
                  border: `1px solid ${inputFocused
                    ? 'var(--color-accent)'
                    : 'color-mix(in srgb, var(--color-primary) 30%, transparent)'}`,
                  boxShadow: inputFocused
                    ? '0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent)'
                    : 'none',
                  maxHeight: '120px',
                }}
                disabled={loading || searching}
              />
              <button
                onClick={() => sendMessage()}
                aria-label="Send"
                disabled={loading || searching || !input.trim()}
                className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                  boxShadow: `0 0 20px color-mix(in srgb, var(--color-accent) 50%, transparent)`,
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModeCard({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-left"
      style={{
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
        color: 'var(--color-text)',
      }}
      whileHover={{ borderColor: 'var(--color-accent)', scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
      <div>
        <p className="text-sm font-medium leading-none mb-0.5">{label}</p>
        <p className="text-xs" style={{ color: 'var(--color-subtle)' }}>{sub}</p>
      </div>
    </motion.button>
  )
}
