'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChatMessage } from '@/types'
import { useUserStore } from '@/store/userStore'
import { cn, formatTimestamp } from '@/lib/utils'

interface ChatPanelProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  roomCode: string
  compact?: boolean
}

export function ChatPanel({ messages, onSendMessage, roomCode, compact = false }: ChatPanelProps) {
  const { user } = useUserStore()
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(newMessage)
      setNewMessage('')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div 
          ref={scrollRef}
          className="h-[200px] overflow-y-auto space-y-2 pr-2"
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/30 text-sm">
              No messages yet
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.slice(-10).map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm"
                >
                  <span className={cn(
                    'font-medium',
                    msg.userId === user?.id ? 'text-neon-purple' : 'text-neon-cyan'
                  )}>
                    {msg.nickname}:
                  </span>
                  <span className="text-white/80 ml-2">{msg.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            variant="glass"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
          <Button
            variant="neon"
            size="icon"
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col glass-dark rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-semibold text-white">Live Chat</h3>
        </div>
        <p className="text-xs text-white/40 mt-1">Room: {roomCode}</p>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <MessageCircle className="w-12 h-12 mb-2" />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Be the first to say hello!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.userId === user?.id
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-3',
                    isOwn && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={cn(
                      'text-xs',
                      isOwn 
                        ? 'bg-gradient-to-br from-neon-purple to-neon-pink' 
                        : 'bg-gradient-to-br from-neon-cyan to-neon-blue'
                    )}>
                      {msg.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn(
                    'max-w-[75%]',
                    isOwn && 'text-right'
                  )}>
                    <div className={cn(
                      'flex items-baseline gap-2',
                      isOwn && 'flex-row-reverse'
                    )}>
                      <span className={cn(
                        'text-sm font-medium',
                        isOwn ? 'text-neon-purple' : 'text-neon-cyan'
                      )}>
                        {msg.nickname}
                      </span>
                      <span className="text-xs text-white/30">
                        {msg.createdAt?.toDate && formatTimestamp(msg.createdAt.toDate())}
                      </span>
                    </div>
                    <div className={cn(
                      'mt-1 px-4 py-2 rounded-2xl inline-block',
                      isOwn 
                        ? 'bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-tr-sm'
                        : 'bg-white/10 rounded-tl-sm'
                    )}>
                      <p className="text-white text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            variant="glass"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="neon"
            size="icon"
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
