'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  Crosshair, 
  Skull, 
  Trophy,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Game, Room, RoleBadge } from '@/types'
import { useGame } from '@/hooks/useGame'
import { useUserStore } from '@/store/userStore'
import { cn } from '@/lib/utils'

interface GameArenaProps {
  game: Game
  room: Room
}

const roleBadgeEmoji: Record<RoleBadge, string> = {
  '🐴': '🐴',
  '🎭': '🎭',
  '🐺': '🐺',
}

export function GameArena({ game, room }: GameArenaProps) {
  const { user } = useUserStore()
  const { makeDecision, getCurrentRound, isMyTurn } = useGame(room.id)
  const [isDeciding, setIsDeciding] = useState(false)
  const [showRoulette, setShowRoulette] = useState(false)
  const [rouletteResult, setRouletteResult] = useState<number | null>(null)

  const currentRound = getCurrentRound()
  const isMissionPlayer = currentRound?.missionPlayerId === user?.id
  const isDecisionPlayer = currentRound?.decisionPlayerId === user?.id

  useEffect(() => {
    if (game.state === 'roulette_phase' && currentRound?.rouletteResult !== null) {
      setShowRoulette(true)
      setTimeout(() => {
        setRouletteResult(currentRound.rouletteResult)
      }, 3000)
    }
  }, [game.state, currentRound?.rouletteResult])

  const handleDecision = async (decision: 'TRUTH' | 'LIE') => {
    setIsDeciding(true)
    try {
      await makeDecision(decision)
    } finally {
      setIsDeciding(false)
    }
  }

  const getMissionPlayer = () => {
    if (!currentRound) return null
    return room.players.find(p => p.id === currentRound.missionPlayerId)
  }

  const getDecisionPlayer = () => {
    if (!currentRound) return null
    return room.players.find(p => p.id === currentRound.decisionPlayerId)
  }

  // Game finished
  if (game.state === 'finished') {
    const winner = room.players.find(p => p.id === game.winnerId)
    const isWinner = game.winnerId === user?.id

    return (
      <Card variant="glass" className="h-full flex items-center justify-center">
        <CardContent className="text-center space-y-8 py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className={cn(
              'w-32 h-32 rounded-full mx-auto flex items-center justify-center',
              isWinner 
                ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
                : 'bg-gradient-to-br from-gray-600 to-gray-700'
            )}
          >
            {isWinner ? (
              <Trophy className="w-16 h-16 text-white" />
            ) : (
              <Skull className="w-16 h-16 text-white" />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className={cn(
              'text-4xl font-bold mb-4',
              isWinner ? 'text-yellow-400' : 'text-white'
            )}>
              {isWinner ? 'Victory!' : 'Game Over'}
            </h2>
            
            <div className="flex items-center justify-center gap-4">
              <Avatar className="w-16 h-16 ring-4 ring-yellow-400">
                <AvatarImage src={winner?.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {winner?.nickname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-white/60 text-sm">Winner</p>
                <p className="text-2xl font-bold text-white">{winner?.nickname}</p>
                <p className="text-white/50">#{winner?.suffix}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button 
              variant="neon" 
              size="lg"
              onClick={() => window.location.href = '/dashboard'}
            >
              Back to Dashboard
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  // Roulette phase
  if (game.state === 'roulette_phase' && showRoulette) {
    const eliminated = rouletteResult === game.chamber
    const targetPlayer = currentRound?.decision !== currentRound?.mission 
      ? getDecisionPlayer() 
      : getMissionPlayer()

    return (
      <Card variant="glass" className="h-full flex items-center justify-center">
        <CardContent className="text-center space-y-8">
          <motion.div
            animate={{ rotate: rouletteResult ? 0 : 360 }}
            transition={{ 
              duration: 3, 
              ease: 'easeOut',
              repeat: rouletteResult ? 0 : Infinity
            }}
            className="w-48 h-48 mx-auto"
          >
            <div className="relative w-full h-full">
              {/* Revolver cylinder */}
              <div className="absolute inset-0 rounded-full border-8 border-white/20 flex items-center justify-center">
                {[1, 2, 3, 4, 5, 6].map((chamber) => (
                  <motion.div
                    key={chamber}
                    className={cn(
                      'absolute w-8 h-8 rounded-full',
                      chamber === game.chamber ? 'bg-red-500' : 'bg-white/20',
                      rouletteResult === chamber && 'ring-4 ring-yellow-400'
                    )}
                    style={{
                      transform: `rotate(${chamber * 60}deg) translateY(-60px)`,
                    }}
                  />
                ))}
              </div>
              <Crosshair className="absolute inset-0 m-auto w-16 h-16 text-neon-purple" />
            </div>
          </motion.div>

          <AnimatePresence>
            {rouletteResult !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {eliminated ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Skull className="w-20 h-20 text-red-500 mx-auto" />
                    </motion.div>
                    <p className="text-3xl font-bold text-red-400">
                      BANG! {targetPlayer?.nickname} is eliminated!
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-20 h-20 text-green-400 mx-auto" />
                    <p className="text-3xl font-bold text-green-400">
                      Click! {targetPlayer?.nickname} survives!
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="glass" className="h-full">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="w-5 h-5 text-neon-purple" />
            Round {game.currentRound}
          </span>
          <span className="text-sm font-normal text-white/60">
            {game.alivePlayers.length} players alive
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Game State Display */}
        <div className="text-center">
          <motion.p
            key={game.state}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white capitalize"
          >
            {game.state.replace(/_/g, ' ')}
          </motion.p>
        </div>

        {/* Players */}
        <div className="grid grid-cols-2 gap-6">
          {/* Mission Player */}
          <div className="space-y-4">
            <h3 className="text-center text-white/60 text-sm uppercase tracking-wider">
              Mission Player
            </h3>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'p-6 rounded-2xl text-center',
                isMissionPlayer 
                  ? 'bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border-2 border-neon-purple/50'
                  : 'bg-white/5'
              )}
            >
              <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-neon-purple/50">
                <AvatarImage src={getMissionPlayer()?.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {getMissionPlayer()?.nickname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-white text-lg">
                {getMissionPlayer()?.nickname}
              </p>

              {/* Show role badge only to mission player */}
              {isMissionPlayer && currentRound && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 space-y-2"
                >
                  <span className="text-6xl">{currentRound.roleBadge}</span>
                  <p className="text-white/60">Your role badge</p>
                  
                  {/* Show mission */}
                  <div className={cn(
                    'mt-4 p-4 rounded-xl',
                    currentRound.mission === 'TRUTH' 
                      ? 'bg-green-500/20 border border-green-500/50'
                      : 'bg-red-500/20 border border-red-500/50'
                  )}>
                    <p className="text-sm text-white/60 uppercase tracking-wider">Your Mission</p>
                    <p className={cn(
                      'text-3xl font-bold',
                      currentRound.mission === 'TRUTH' ? 'text-green-400' : 'text-red-400'
                    )}>
                      {currentRound.mission}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Decision Player */}
          <div className="space-y-4">
            <h3 className="text-center text-white/60 text-sm uppercase tracking-wider">
              Decision Player
            </h3>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'p-6 rounded-2xl text-center',
                isDecisionPlayer 
                  ? 'bg-gradient-to-br from-neon-cyan/20 to-neon-blue/20 border-2 border-neon-cyan/50'
                  : 'bg-white/5'
              )}
            >
              <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-neon-cyan/50">
                <AvatarImage src={getDecisionPlayer()?.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {getDecisionPlayer()?.nickname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-white text-lg">
                {getDecisionPlayer()?.nickname}
              </p>

              {/* Decision buttons only for decision player */}
              {isDecisionPlayer && game.state === 'decision_phase' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  <p className="text-white/60 text-sm">
                    Is the mission player telling the truth or lying?
                  </p>
                  <div className="flex gap-4">
                    <Button
                      variant="neon"
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400"
                      onClick={() => handleDecision('TRUTH')}
                      disabled={isDeciding}
                    >
                      {isDeciding ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Truth
                        </>
                      )}
                    </Button>
                    <Button
                      variant="neon"
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400"
                      onClick={() => handleDecision('LIE')}
                      disabled={isDeciding}
                    >
                      {isDeciding ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 mr-2" />
                          Lie
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Alive Players */}
        <div className="pt-6 border-t border-white/10">
          <h3 className="text-white/60 text-sm uppercase tracking-wider mb-4">
            Players Alive
          </h3>
          <div className="flex flex-wrap gap-3">
            {room.players.map((player) => {
              const isAlive = game.alivePlayers.includes(player.id)
              return (
                <motion.div
                  key={player.id}
                  animate={{ opacity: isAlive ? 1 : 0.3 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={player.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {player.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    'text-sm font-medium',
                    isAlive ? 'text-white' : 'text-white/40 line-through'
                  )}>
                    {player.nickname}
                  </span>
                  {!isAlive && <Skull className="w-4 h-4 text-red-400" />}
                </motion.div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
