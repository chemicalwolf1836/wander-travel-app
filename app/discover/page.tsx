'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ChatMessage } from '@/components/ChatMessage'
import { TypingIndicator } from '@/components/TypingIndicator'
import type { ChatMessage as ChatMessageType, Preferences } from '@/types'

const OPENING_MESSAGE: ChatMessageType = {
  role: 'assistant',
  content:
    'Welcome to Wander. Tell me about your dream trip - the kind of climate you love, your budget, food preferences, travel style, anything at all. The more you share, the better I can guide you.',
}

interface ChatResponse {
  ready: boolean
  message: string
  preferences?: Preferences
}

export default function DiscoverPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessageType[]>([OPENING_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: ChatMessageType = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Send full conversation history with every request
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    })

    const data: ChatResponse = await res.json()
    setLoading(false)

    const aiMessage: ChatMessageType = { role: 'assistant', content: data.message }
    setMessages((prev) => [...prev, aiMessage])

    if (data.ready && data.preferences) {
      setSearching(true)
      // Fetch destination suggestions then hand off to results page
      const suggestRes = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: data.preferences }),
      })
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

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <Navbar />

      {/* Message list */}
      <div className="flex-1 overflow-y-auto pt-20 pb-36 px-4 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-4 py-6">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} index={i} />
          ))}
          {loading && <TypingIndicator />}
          {searching && (
            <p
              className="text-center text-sm animate-pulse mt-4"
              style={{ color: 'var(--color-subtle)' }}
            >
              Finding your perfect destinations...
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Fixed input */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-md"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-bg) 90%, transparent)',
          borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
        }}
      >
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about your dream trip..."
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
            onClick={sendMessage}
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
      </div>
    </div>
  )
}
