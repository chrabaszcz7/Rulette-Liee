'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Users, Crosshair, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useRoom } from '@/hooks/useRoom'
import { useToast } from '@/hooks/useToast'
import { useUserStore } from '@/store/userStore'
import { calculateWinrate } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const { createRoom, joinRoom } = useRoom()
  const { toast } = useToast()
  
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)

  const handleCreateRoom = async () => {
    setIsCreating(true)
    try {
      const { id, code } = await createRoom(6)
      setCreatedRoomCode(code)
      toast({
        title: 'Room created!',
        description: `Room code: ${code}`,
        variant: 'success',
      })
      router.push(`/dashboard/room/${id}`)
    } catch (error: any) {
      toast({
        title: 'Failed to create room',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: 'Enter room code',
        description: 'Please enter a valid room code',
        variant: 'destructive',
      })
      return
    }

    setIsJoining(true)
    try {
      const roomId = await joinRoom(roomCode.trim().toUpperCase())
      toast({
        title: 'Joined room!',
        description: 'Get ready to play!',
        variant: 'success',
      })
      router.push(`/dashboard/room/${roomId}`)
    } catch (error: any) {
      toast({
        title: 'Failed to join room',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsJoining(false)
    }
  }

  const stats = user ? {
    wins: user.wins,
    losses: user.losses,
    totalGames: user.totalGames,
    winrate: calculateWinrate(user.wins, user.losses),
  } : null

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan bg-clip-text text-transparent">
          Welcome back, {user?.nickname}!
        </h1>
        <p className="text-white/60 text-lg">
          Ready to test your luck?
        </p>
      </motion.div>

      {/* Quick Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4"
        >
          {[
            { label: 'Wins', value: stats.wins, color: 'from-green-500 to-emerald-500' },
            { label: 'Losses', value: stats.losses, color: 'from-red-500 to-rose-500' },
            { label: 'Total Games', value: stats.totalGames, color: 'from-blue-500 to-cyan-500' },
            { label: 'Win Rate', value: `${stats.winrate}%`, color: 'from-neon-purple to-neon-pink' },
          ].map((stat, i) => (
            <Card key={stat.label} variant="glass" className="text-center">
              <CardContent className="pt-6">
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
                <p className="text-sm text-white/60 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Main Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Create Room */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card 
                variant="glass" 
                className="cursor-pointer hover:border-neon-purple/50 transition-all group h-full"
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">Create Room</CardTitle>
                  <CardDescription className="text-white/60">
                    Start a new game and invite your friends
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="glass border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Room</DialogTitle>
              <DialogDescription className="text-white/60">
                A room code will be generated for your friends to join
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center animate-pulse">
                  <Crosshair className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button variant="neon" onClick={handleCreateRoom} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Room'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join Room */}
        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card 
                variant="glass" 
                className="cursor-pointer hover:border-neon-cyan/50 transition-all group h-full"
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">Join Room</CardTitle>
                  <CardDescription className="text-white/60">
                    Enter a room code to join an existing game
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="glass border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Join Room</DialogTitle>
              <DialogDescription className="text-white/60">
                Enter the room code shared by your friend
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode" className="text-white/80">Room Code</Label>
                <Input
                  id="roomCode"
                  variant="glass"
                  placeholder="ROOM-XXXXX"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="text-center text-xl tracking-wider font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowJoinDialog(false)}>
                Cancel
              </Button>
              <Button variant="neon" onClick={handleJoinRoom} disabled={isJoining}>
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Room'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Game Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-neon-purple" />
              How to Play
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/70">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-sm">1</span>
                  Roles
                </h4>
                <p className="text-sm pl-8">
                  Each round, one player becomes the <span className="text-neon-purple font-medium">Mission Player</span> and another becomes the <span className="text-neon-pink font-medium">Decision Player</span>.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-sm">2</span>
                  Mission
                </h4>
                <p className="text-sm pl-8">
                  The Mission Player receives a secret mission: <span className="text-green-400">TRUTH</span> or <span className="text-red-400">LIE</span>.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-sm">3</span>
                  Decision
                </h4>
                <p className="text-sm pl-8">
                  The Decision Player must guess whether the Mission Player is telling the truth or lying.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-sm">4</span>
                  Roulette
                </h4>
                <p className="text-sm pl-8">
                  Wrong guess? Time for Russian Roulette! If the chamber fires, you&apos;re eliminated.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
