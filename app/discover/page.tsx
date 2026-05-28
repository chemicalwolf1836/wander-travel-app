'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, PenLine, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { ChatMessage } from '@/components/ChatMessage'
import { TypingIndicator } from '@/components/TypingIndicator'
import type { ChatMessage as ChatMessageType, Preferences } from '@/types'

const OPENING_MESSAGE: ChatMessageType = {
  role: 'assistant',
  content: "Where's your mind wandering?",
}

interface ChatResponse {
  ready: boolean
  message: string
  choices?: string[]
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
  const [choices, setChoices] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, choices])

  async function callChat(msgs: ChatMessageType[], m: Mode) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs, mode: m }),
    })
    if (!res.ok) return null
    return res.json() as Promise<ChatResponse>
  }

  async function handleModeSelect(selected: 'free' | 'guided') {
    setMode(selected)
    if (selected === 'free') {
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }
    // Guided: kick off with a silent trigger so Claude asks the first question with choices
    setLoading(true)
    const kickoff: ChatMessageType[] = [...messages, { role: 'user', content: 'guide me' }]
    const data = await callChat(kickoff, 'guided')
    setLoading(false)
    if (!data) return
    setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
    setChoices(data.choices ?? [])
  }

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    setChoices([])
    const userMessage: ChatMessageType = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const data = await callChat(newMessages, mode === 'selecting' ? 'free' : mode)
    setLoading(false)

    if (!data) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
      return
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
    if (data.choices?.length) setChoices(data.choices)

    if (data.ready && data.preferences) {
      setSearching(true)
      const suggestRes = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: data.preferences }),
      })
      if (!suggestRes.ok) {
        setSearching(false)
        setMessages((prev) => [...prev, { role: 'assistant', content: "I had trouble finding destinations. Let's try again." }])
        return
      }
      const suggestions: unknown = await suggestRes.json()
      sessionStorage.setItem('wander_destinations', JSON.stringify(suggestions))
      router.push('/results')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const showInput = mode !== 'selecting'

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      {/* Message list */}
      <div className={`flex-1 overflow-y-auto pt-20 px-4 max-w-2xl mx-auto w-full ${showInput ? 'pb-36' : 'pb-10'}`}>
        <div className="flex flex-col gap-4 py-6">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} index={i} />
          ))}
          {loading && <TypingIndicator />}

          {/* Mode selection — shown once, inline after opening message */}
          <AnimatePresence>
            {mode === 'selecting' && !loading && (
              <motion.div
                className="flex gap-3 mt-1 ml-11"
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

          {/* Choice chips — shown after AI messages in guided mode */}
          <AnimatePresence>
            {choices.length > 0 && !loading && (
              <motion.div
                className="flex flex-wrap gap-2 ml-11"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {choices.map((c) => (
                  <motion.button
                    key={c}
                    onClick={() => sendMessage(c)}
                    className="text-xs px-4 py-2 rounded-full"
                    style={{
                      color: 'var(--color-accent)',
                      backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
                    }}
                    whileHover={{ scale: 1.04, backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    {c}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {searching && (
            <p className="text-center text-sm animate-pulse mt-4" style={{ color: 'var(--color-subtle)' }}>
              Finding your perfect destinations...
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Fixed input — only shown once mode is selected */}
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'guided' ? 'or type freely...' : 'Tell me about your dream trip...'}
                rows={1}
                className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-card-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
                  maxHeight: '120px',
                }}
                disabled={loading || searching}
              />
              <button
                onClick={() => sendMessage()}
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
      whileHover={{
        borderColor: 'var(--color-accent)',
        scale: 1.02,
      }}
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
