'use client'

/**
 * Admin Navigation Component
 * 
 * Provides navigation sidebar for the admin dashboard with:
 * - Navigation links (Dashboard, Users, Schemes, Settings)
 * - Active route highlighting
 * - User profile display with role badge
 * - Styled with Tailwind CSS
 * 
 * Requirements: 3.1, 3.4
 * 
 * @module components/admin/AdminNav
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserProfileMenu } from '@/components/shared/UserProfileMenu'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

// ============================================================================
// Navigation Items
// ============================================================================

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Schemes',
    href: '/admin/schemes',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

// ============================================================================
// Component
// ============================================================================

export function AdminNav() {
  const pathname = usePathname()

  /**
   * Check if a nav item is active
   */
  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`)
  }



  return (
    <div className="flex items-center justify-between px-6 py-3 bg-background">
      {/* Logo and Brand */}
      <div className="flex items-center gap-8">
        <div>
          <h1 className="text-xl font-bold text-primary">MSME Mitr</h1>
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm
                  ${active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile Menu */}
      <UserProfileMenu showRole={true} align="end" />
    </div>
  )
}
