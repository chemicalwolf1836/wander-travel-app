'use client'

import { motion } from 'framer-motion'
import type { ChatMessage as ChatMessageType } from '@/types'

interface ChatMessageProps {
  message: ChatMessageType
  index: number
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* AI avatar */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
        >
          W
        </div>
      )}

      <div
        className="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={
          isUser
            ? {
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-bg)',
                borderBottomRightRadius: '4px',
              }
            : {
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)',
                borderBottomLeftRadius: '4px',
                border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
              }
        }
      >
        {message.content}
      </div>
    </motion.div>
  )
}
