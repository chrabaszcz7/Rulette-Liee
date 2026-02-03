'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Trophy, Target, Percent, Loader2 } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc } from 'firebase/firestore'
import { storage, db } from '@/lib/firebase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserStore } from '@/store/userStore'
import { useToast } from '@/hooks/useToast'
import { calculateWinrate, formatNickname } from '@/lib/utils'

export default function ProfilePage() {
  const { user, updateUser } = useUserStore()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.id}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      // Update Firestore
      await updateDoc(doc(db, 'users', user.id), {
        avatarUrl: downloadURL,
      })

      // Update local state
      updateUser({ avatarUrl: downloadURL })

      toast({
        title: 'Avatar updated!',
        description: 'Your profile picture has been updated',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (!user) return null

  const stats = {
    wins: user.wins,
    losses: user.losses,
    totalGames: user.totalGames,
    winrate: calculateWinrate(user.wins, user.losses),
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" className="overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan" />
          
          <CardContent className="relative pt-0">
            {/* Avatar */}
            <div className="absolute -top-16 left-8">
              <div className="relative group">
                <Avatar className="w-32 h-32 ring-4 ring-background">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="text-4xl">
                    {user.nickname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-neon-purple text-white flex items-center justify-center shadow-lg hover:bg-neon-pink transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="pt-20 pb-4">
              <h1 className="text-3xl font-bold text-white">
                {user.nickname}
              </h1>
              <p className="text-white/50 text-lg font-mono">
                #{user.suffix}
              </p>
              <p className="text-white/40 mt-2">
                Full ID: <span className="text-white/60">{formatNickname(user.nickname, user.suffix)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card variant="glass" className="text-center">
          <CardContent className="pt-6">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.wins}</p>
            <p className="text-sm text-white/60">Wins</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="text-center">
          <CardContent className="pt-6">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-red-400">{stats.losses}</p>
            <p className="text-sm text-white/60">Losses</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="text-center">
          <CardContent className="pt-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.totalGames}</p>
            <p className="text-sm text-white/60">Total Games</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="text-center">
          <CardContent className="pt-6">
            <div className="w-12 h-12 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center mx-auto mb-3">
              <Percent className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-neon-purple">{stats.winrate}%</p>
            <p className="text-sm text-white/60">Win Rate</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-white">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Win Rate</span>
                <span className="text-white">{stats.winrate}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.winrate}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-neon-purple to-neon-pink rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-sm text-white/60">Games Won</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-green-400">{stats.wins}</span>
                  <span className="text-white/40 text-sm mb-1">/ {stats.totalGames}</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-sm text-white/60">Games Lost</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-red-400">{stats.losses}</span>
                  <span className="text-white/40 text-sm mb-1">/ {stats.totalGames}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
