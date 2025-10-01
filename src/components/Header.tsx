import Link from 'next/link'
import AuthStatus from './AuthStatus'
import NotificationBell from './NotificationBell'
import { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User | null;
  isAdmin?: boolean;
  title?: string;
  showBackToSite?: boolean;
}

export default function Header({ user, isAdmin = false, title = "Portail Bénévoles - Festival du Film Court", showBackToSite = false }: HeaderProps) {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎬</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">Festival du Film Court</h1>
                <p className="text-sm text-gray-600">Portail Bénévoles</p>
              </div>
            </Link>
            
            {/* Navigation principale */}
            <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Missions
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link 
                  href="/profile" 
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Mon Profil
                </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {title !== "Portail Bénévoles - Festival du Film Court" && (
              <h2 className="hidden lg:block text-lg font-semibold text-gray-700">{title}</h2>
            )}
            {showBackToSite && (
              <Link 
                href="/" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                ← Retour au site
              </Link>
            )}
            {/* Notifications */}
            {user && <NotificationBell userId={user.id} />}
            {/* Auth status (client) */}
            <AuthStatus />
            {/* Navigation mobile */}
            {user && (
              <Link 
                href="/" 
                className="md:hidden text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center space-x-1"
              >
                <span>📋</span>
                <span>Missions</span>
              </Link>
            )}
            {user && (
              <Link 
                href="/profile" 
                className="md:hidden text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center space-x-1"
              >
                <span>👤</span>
                <span>Profil</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
} 