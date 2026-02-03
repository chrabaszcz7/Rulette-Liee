'use client'

import { motion } from 'framer-motion'
import { Trophy, Crown, Medal, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useUserStore } from '@/store/userStore'
import { cn } from '@/lib/utils'

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-yellow-400" />
    case 2:
      return <Medal className="w-6 h-6 text-gray-300" />
    case 3:
      return <Award className="w-6 h-6 text-amber-600" />
    default:
      return <span className="w-6 h-6 flex items-center justify-center text-white/60 font-bold">{rank}</span>
  }
}

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30'
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30'
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30'
    default:
      return 'bg-white/5 border-white/10'
  }
}

export default function TrophyPage() {
  const { leaderboard, loading } = useLeaderboard(10)
  const { user } = useUserStore()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <Trophy className="w-10 h-10 text-yellow-400" />
        </div>
        <p className="text-white/60">
          Top 10 players with the most victories
        </p>
      </motion.div>

      {/* Top 3 Podium */}
      {!loading && leaderboard.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-end justify-center gap-4 h-64"
        >
          {/* 2nd Place */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <Avatar className="w-16 h-16 ring-4 ring-gray-400 mb-2">
              <AvatarImage src={leaderboard[1]?.avatarUrl || undefined} />
              <AvatarFallback className="text-xl">
                {leaderboard[1]?.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-white font-medium text-sm">{leaderboard[1]?.nickname}</p>
            <p className="text-white/50 text-xs">#{leaderboard[1]?.suffix}</p>
            <div className="w-24 h-32 bg-gradient-to-t from-gray-500/30 to-gray-400/10 rounded-t-lg mt-2 flex items-end justify-center pb-4">
              <Medal className="w-8 h-8 text-gray-300" />
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <Crown className="w-8 h-8 text-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" />
              <Avatar className="w-20 h-20 ring-4 ring-yellow-400 mb-2">
                <AvatarImage src={leaderboard[0]?.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {leaderboard[0]?.nickname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="text-white font-bold">{leaderboard[0]?.nickname}</p>
            <p className="text-white/50 text-xs">#{leaderboard[0]?.suffix}</p>
            <div className="w-28 h-44 bg-gradient-to-t from-yellow-500/30 to-yellow-400/10 rounded-t-lg mt-2 flex items-end justify-center pb-4">
              <Trophy className="w-10 h-10 text-yellow-400" />
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center"
          >
            <Avatar className="w-14 h-14 ring-4 ring-amber-600 mb-2">
              <AvatarImage src={leaderboard[2]?.avatarUrl || undefined} />
              <AvatarFallback className="text-lg">
                {leaderboard[2]?.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-white font-medium text-sm">{leaderboard[2]?.nickname}</p>
            <p className="text-white/50 text-xs">#{leaderboard[2]?.suffix}</p>
            <div className="w-20 h-24 bg-gradient-to-t from-amber-600/30 to-amber-500/10 rounded-t-lg mt-2 flex items-end justify-center pb-4">
              <Award className="w-7 h-7 text-amber-600" />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Full Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-neon-purple" />
              Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">No players yet</p>
                <p className="text-white/30 text-sm mt-1">
                  Be the first to win a game!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all',
                      getRankStyle(entry.rank),
                      user?.id === entry.userId && 'ring-2 ring-neon-purple'
                    )}
                  >
                    <div className="w-10 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <Avatar className={cn(
                      'ring-2',
                      entry.rank === 1 && 'ring-yellow-400',
                      entry.rank === 2 && 'ring-gray-400',
                      entry.rank === 3 && 'ring-amber-600',
                      entry.rank > 3 && 'ring-white/20'
                    )}>
                      <AvatarImage src={entry.avatarUrl || undefined} />
                      <AvatarFallback>
                        {entry.nickname.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">
                          {entry.nickname}
                        </p>
                        {user?.id === entry.userId && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-neon-purple/20 text-neon-purple">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/50 font-mono">
                        #{entry.suffix}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-green-400">{entry.wins} wins</p>
                      <p className="text-sm text-white/50">
                        {entry.winrate}% win rate
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
