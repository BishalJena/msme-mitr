'use client'

/**
 * User Profile Page
 * 
 * Displays user profile information with logout functionality
 */

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, User, Mail, Briefcase, MapPin } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getUserInitials = () => {
    if (!profile?.full_name) return user?.email?.substring(0, 2).toUpperCase() || 'U'
    
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">
                  {profile?.full_name || 'User'}
                </h2>
                <Badge variant={getRoleBadgeVariant()} className="mt-2">
                  {getRoleText()}
                </Badge>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4 pt-4 border-t">
              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || 'Not provided'}</p>
                </div>
              </div>

              {/* Phone */}
              {profile?.phone && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                </div>
              )}

              {/* Business Name */}
              {profile?.business_name && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Business</p>
                    <p className="font-medium">{profile.business_name}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {(profile?.state || profile?.district) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {[profile.district, profile.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
