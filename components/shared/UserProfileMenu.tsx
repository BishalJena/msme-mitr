'use client'

/**
 * User Profile Menu Component
 * 
 * Reusable dropdown menu for user profile with options:
 * - Edit Profile
 * - Logout
 */

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, ChevronDown } from 'lucide-react'

interface UserProfileMenuProps {
  language?: 'en' | 'hi'
  showRole?: boolean
  align?: 'start' | 'center' | 'end'
  fullWidth?: boolean
}

export function UserProfileMenu({ 
  language = 'en', 
  showRole = false,
  align = 'end',
  fullWidth = false
}: UserProfileMenuProps) {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const isHindi = language === 'hi'

  const getUserInitials = () => {
    if (!profile?.full_name) {
      return user?.email?.substring(0, 2).toUpperCase() || 'U'
    }
    
    const names = profile.full_name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return profile.full_name.substring(0, 2).toUpperCase()
  }

  const getRoleBadgeVariant = () => {
    if (profile?.role === 'super_admin') return 'default'
    if (profile?.role === 'admin') return 'secondary'
    return 'outline'
  }

  const getRoleText = () => {
    if (profile?.role === 'super_admin') return 'Super Admin'
    if (profile?.role === 'admin') return 'Admin'
    return 'User'
  }

  const handleEditProfile = () => {
    router.push('/profile')
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`${fullWidth ? 'w-full' : 'w-auto'} flex items-center gap-3 hover:bg-accent rounded-lg px-3 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring`}>
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm font-medium leading-tight truncate">
              {profile?.full_name || user?.email || 'User'}
            </p>
            {showRole && profile?.role && (
              <Badge 
                variant={getRoleBadgeVariant()} 
                className="text-xs h-5 mt-0.5 w-fit"
              >
                {getRoleText()}
              </Badge>
            )}
            {!showRole && (
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                {user?.email}
              </p>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        {/* User Info Header */}
        <div className="px-2 py-1.5 space-y-3">
          <p className="text-sm font-medium truncate leading-none">
            {profile?.full_name || 'User'}
          </p>
          <p className="text-xs text-muted-foreground truncate leading-none">
            {user?.email}
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Edit Profile */}
        <DropdownMenuItem onClick={handleEditProfile} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>{isHindi ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isHindi ? 'लॉग आउट' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
