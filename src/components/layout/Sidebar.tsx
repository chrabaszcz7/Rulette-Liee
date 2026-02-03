'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Home, 
  Trophy, 
  Users, 
  Settings, 
  LogOut,
  Crosshair
} from 'lucide-react'
import { cn, formatNickname } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/trophy', icon: Trophy, label: 'Leaderboard' },
  { href: '/dashboard/friends', icon: Users, label: 'Friends' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <TooltipProvider>
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 bottom-0 w-[280px] glass-dark flex flex-col"
      >
        {/* User Avatar Section */}
        <div className="p-6">
          <Link href="/dashboard/profile">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Avatar className="w-14 h-14 ring-2 ring-neon-purple/50">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {user?.nickname?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {user?.nickname}
                </p>
                <p className="text-sm text-white/50 truncate">
                  #{user?.suffix}
                </p>
              </div>
            </motion.div>
          </Link>
        </div>

        <Separator className="bg-white/10" />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 text-white neon-border'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <item.icon className={cn(
                        'w-5 h-5',
                        isActive && 'text-neon-purple'
                      )} />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="ml-auto w-2 h-2 rounded-full bg-neon-purple"
                        />
                      )}
                    </motion.div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        <Separator className="bg-white/10" />

        {/* Logo & Sign Out */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-white/40">
            <Crosshair className="w-5 h-5" />
            <span className="text-sm font-medium">Rulette Lie</span>
          </div>
          
          <Button
            variant="ghost"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
