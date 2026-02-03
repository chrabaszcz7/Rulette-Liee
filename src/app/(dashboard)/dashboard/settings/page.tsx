'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Bell, Shield, Palette, Volume2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useUserStore } from '@/store/userStore'
import { useToast } from '@/hooks/useToast'

export default function SettingsPage() {
  const { user } = useUserStore()
  const { toast } = useToast()
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated',
      variant: 'success',
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-neon-purple" />
          Settings
        </h1>
        <p className="text-white/60 mt-1">
          Manage your account and preferences
        </p>
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-neon-purple" />
              Account
            </CardTitle>
            <CardDescription className="text-white/60">
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white/80">Email</Label>
                <Input
                  variant="glass"
                  value={user?.email || ''}
                  disabled
                  className="opacity-50"
                />
                <p className="text-xs text-white/40">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Nickname</Label>
                <Input
                  variant="glass"
                  value={user?.nickname || ''}
                  disabled
                  className="opacity-50"
                />
                <p className="text-xs text-white/40">
                  Your unique tag: #{user?.suffix}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sound Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-neon-cyan" />
              Sound
            </CardTitle>
            <CardDescription className="text-white/60">
              Audio preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="font-medium text-white">Game Sounds</p>
                <p className="text-sm text-white/50">
                  Enable sound effects during gameplay
                </p>
              </div>
              <Button
                variant={soundEnabled ? 'neon' : 'ghost'}
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-neon-pink" />
              Notifications
            </CardTitle>
            <CardDescription className="text-white/60">
              Notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div>
                <p className="font-medium text-white">Friend Requests</p>
                <p className="text-sm text-white/50">
                  Get notified when someone sends you a friend request
                </p>
              </div>
              <Button
                variant={notificationsEnabled ? 'neon' : 'ghost'}
                size="sm"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Security
            </CardTitle>
            <CardDescription className="text-white/60">
              Keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Password</p>
                  <p className="text-sm text-white/50">
                    Change your password
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Change
                </Button>
              </div>
            </div>
            
            <Separator className="bg-white/10" />
            
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-400">Delete Account</p>
                  <p className="text-sm text-white/50">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end"
      >
        <Button variant="neon" size="lg" onClick={handleSave}>
          Save Changes
        </Button>
      </motion.div>
    </div>
  )
}
