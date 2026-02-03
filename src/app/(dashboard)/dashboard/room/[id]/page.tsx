'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Copy, 
  Check, 
  LogOut, 
  Play, 
  Crown,
  Loader2,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useRoom } from '@/hooks/useRoom'
import { useGame } from '@/hooks/useGame'
import { useChat } from '@/hooks/useChat'
import { useToast } from '@/hooks/useToast'
import { useUserStore } from '@/store/userStore'
import { GameArena } from '@/components/game/GameArena'
import { ChatPanel } from '@/components/game/ChatPanel'
import { cn } from '@/lib/utils'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const { user } = useUserStore()
  const { room, subscribeToRoom, leaveRoom, toggleReady } = useRoom()
  const { game, startGame } = useGame(roomId)
  const { messages, sendMessage } = useChat(roomId)
  const { toast } = useToast()
  
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (roomId) {
      const unsubscribe = subscribeToRoom(roomId)
      return () => unsubscribe()
    }
  }, [roomId, subscribeToRoom])

  const handleCopyCode = async () => {
    if (room?.code) {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      toast({
        title: 'Code copied!',
        description: 'Share this code with your friends',
        variant: 'success',
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLeaveRoom = async () => {
    setIsLeaving(true)
    try {
      await leaveRoom(roomId)
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Failed to leave room',
        description: error.message,
        variant: 'destructive',
      })
      setIsLeaving(false)
    }
  }

  const handleToggleReady = async () => {
    try {
      await toggleReady(roomId)
    } catch (error: any) {
      toast({
        title: 'Failed to toggle ready',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleStartGame = async () => {
    setIsStarting(true)
    try {
      await startGame(roomId)
      toast({
        title: 'Game started!',
        description: 'Good luck!',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to start game',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsStarting(false)
    }
  }

  const isHost = room?.hostId === user?.id
  const currentPlayer = room?.players.find(p => p.id === user?.id)
  const allReady = room?.players.every(p => p.isReady) ?? false
  const canStart = isHost && allReady && (room?.players.length ?? 0) >= 2

  if (!room) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70">Loading room...</p>
        </div>
      </div>
    )
  }

  // Game is active
  if (room.status === 'active' && game) {
    return (
      <div className="h-[calc(100vh-3rem)] flex gap-6">
        {/* Game Arena */}
        <div className="flex-1">
          <GameArena game={game} room={room} />
        </div>
        
        {/* Chat Panel */}
        <div className="w-[350px]">
          <ChatPanel 
            messages={messages} 
            onSendMessage={sendMessage}
            roomCode={room.code}
          />
        </div>
      </div>
    )
  }

  // Waiting room
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-white/60">Room Code:</span>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 font-mono text-xl text-neon-purple">
              {room.code}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={handleLeaveRoom}
          disabled={isLeaving}
        >
          {isLeaving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5 mr-2" />
          )}
          Leave Room
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Players List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-neon-purple" />
                Players
                <span className="ml-2 px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple text-sm">
                  {room.players.length}/{room.maxPlayers}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {room.players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl transition-all',
                        player.isReady 
                          ? 'bg-green-500/10 border border-green-500/30' 
                          : 'bg-white/5 border border-white/10',
                        player.id === user?.id && 'ring-2 ring-neon-purple'
                      )}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={player.avatarUrl || undefined} />
                        <AvatarFallback>
                          {player.nickname.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">
                            {player.nickname}
                          </p>
                          {player.isHost && (
                            <Crown className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-white/50">#{player.suffix}</p>
                      </div>
                      <div className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium',
                        player.isReady 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/10 text-white/50'
                      )}>
                        {player.isReady ? 'Ready' : 'Not Ready'}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Empty slots */}
                  {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                    <motion.div
                      key={`empty-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-white/10 h-[88px]"
                    >
                      <p className="text-white/30">Waiting for player...</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Ready Status */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-white">Your Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant={currentPlayer?.isReady ? 'ghost' : 'neon'}
                size="lg"
                className="w-full"
                onClick={handleToggleReady}
              >
                {currentPlayer?.isReady ? 'Cancel Ready' : 'Ready Up'}
              </Button>
              
              {isHost && (
                <>
                  <Separator className="bg-white/10" />
                  <Button
                    variant="neon"
                    size="lg"
                    className="w-full"
                    onClick={handleStartGame}
                    disabled={!canStart || isStarting}
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Start Game
                      </>
                    )}
                  </Button>
                  {!canStart && (
                    <p className="text-sm text-white/40 text-center">
                      {(room.players.length ?? 0) < 2 
                        ? 'Need at least 2 players'
                        : 'Waiting for all players to be ready'}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Chat Preview */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-neon-cyan" />
                Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChatPanel 
                messages={messages} 
                onSendMessage={sendMessage}
                roomCode={room.code}
                compact
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
