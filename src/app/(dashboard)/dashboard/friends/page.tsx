'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserPlus, 
  Users, 
  Search, 
  Check, 
  X, 
  Loader2,
  Mail,
  Clock,
  UserMinus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useFriends } from '@/hooks/useFriends'
import { useToast } from '@/hooks/useToast'
import { formatNickname } from '@/lib/utils'

export default function FriendsPage() {
  const { 
    friends, 
    pendingRequests, 
    sentRequests,
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest,
    removeFriend 
  } = useFriends()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddFriend = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Enter a nickname',
        description: 'Please enter a full nickname (e.g., player#A1B2C)',
        variant: 'destructive',
      })
      return
    }

    setIsAdding(true)
    try {
      await sendFriendRequest(searchQuery.trim())
      toast({
        title: 'Friend request sent!',
        description: `Request sent to ${searchQuery}`,
        variant: 'success',
      })
      setSearchQuery('')
    } catch (error: any) {
      toast({
        title: 'Failed to send request',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId)
      toast({
        title: 'Friend added!',
        description: 'You are now friends',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to accept',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId)
      toast({
        title: 'Request rejected',
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to reject',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    try {
      await removeFriend(friendId)
      toast({
        title: 'Friend removed',
        description: `${friendName} has been removed from your friends`,
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to remove friend',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-neon-purple" />
            Friends
          </h1>
          <p className="text-white/60 mt-1">
            Manage your friends and send requests
          </p>
        </div>
      </motion.div>

      {/* Add Friend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-neon-purple" />
              Add Friend
            </CardTitle>
            <CardDescription className="text-white/60">
              Enter your friend&apos;s full nickname including the tag
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  variant="glass"
                  placeholder="nickname#A1B2C"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                  className="pl-10 font-mono"
                />
              </div>
              <Button 
                variant="neon" 
                onClick={handleAddFriend}
                disabled={isAdding}
              >
                {isAdding ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-neon-pink" />
                Pending Requests
                <span className="ml-2 px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink text-sm">
                  {pendingRequests.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {request.fromNickname.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{request.fromNickname}</p>
                        <p className="text-sm text-white/50 font-mono">#{request.fromSuffix}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        onClick={() => handleAccept(request.id)}
                      >
                        <Check className="w-5 h-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleReject(request.id)}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Sent Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white/60">Pending...</p>
                      <p className="text-sm text-white/40">Waiting for response</p>
                    </div>
                  </div>
                  <span className="text-yellow-400 text-sm">Pending</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Friends List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-cyan" />
              Your Friends
              <span className="ml-2 px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan text-sm">
                {friends.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">No friends yet</p>
                <p className="text-white/30 text-sm mt-1">
                  Add friends using their nickname#tag
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {friends.map((friend) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="ring-2 ring-neon-cyan/30">
                          <AvatarImage src={friend.avatarUrl || undefined} />
                          <AvatarFallback>
                            {friend.nickname.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{friend.nickname}</p>
                          <p className="text-sm text-white/50 font-mono">#{friend.suffix}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                        onClick={() => handleRemoveFriend(friend.id, friend.nickname)}
                      >
                        <UserMinus className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
