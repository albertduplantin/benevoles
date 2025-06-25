import Link from 'next/link'
import AuthButton from './AuthButton'
import NotificationBell from './NotificationBell'
import MessagesUnreadBadge from './MessagesUnreadBadge'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'

interface HeaderProps {
  user: User | null;
  title?: string;
  showBackToSite?: boolean;
}

export default function Header({ user, title = "Portail Bénévoles - Festival du Film Court", showBackToSite = false }: HeaderProps) {
  return (
    <>
      {/* Header principal */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-2xl sticky top-0 z-50">
        {/* Effet de lumière subtil */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-between items-center py-4">
            {/* Logo et titre */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-amber-500/25 transition-all duration-300 p-2">
                    <Image 
                      src="/festival-logo.svg" 
                      alt="Festival Logo" 
                      width={32} 
                      height={32}
                      className="transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-all duration-300"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent leading-tight">
                    Festival du Film Court
                  </h1>
                  <p className="text-sm text-gray-400 font-medium">Portail Bénévoles</p>
                </div>
              </Link>
              
              {/* Navigation principale */}
              {user && (
                <div className="hidden lg:flex items-center space-x-1">
                  <NavLink href="/" icon="🎯" text="Missions" />
                  <MessagesUnreadBadge userId={user.id} />
                  <NavLink href="/profile" icon="👤" text="Mon Profil" />
                  <NavLink href="/planning" icon="📅" text="Planning" />
                </div>
              )}
            </div>
            
            {/* Titre de page et actions */}
            <div className="flex items-center space-x-6">
              {title !== "Portail Bénévoles - Festival du Film Court" && (
                <div className="hidden xl:block">
                  <h2 className="text-lg font-semibold text-white/90 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    {title}
                  </h2>
                </div>
              )}
              
              {showBackToSite && (
                <Link 
                  href="/" 
                  className="group flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                  <span>Retour au site</span>
                </Link>
              )}
              
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                {user && (
                  <div className="relative">
                    <NotificationBell userId={user.id} />
                  </div>
                )}
                
                {/* Menu mobile */}
                {user && (
                  <div className="lg:hidden flex items-center space-x-2">
                    <MobileNavButton href="/" icon="🎯" />
                    <MobileNavButton href="/communication" icon="💬" />
                    <MobileNavButton href="/profile" icon="👤" />
                    <MobileNavButton href="/planning" icon="📅" />
                  </div>
                )}
                
                {/* Bouton d'authentification */}
                <div className="relative">
                  <AuthButton user={user} />
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>
      
      {/* Effet de dégradé sous le header */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
    </>
  )
}

// Composant pour les liens de navigation
function NavLink({ href, icon, text }: { href: string; icon: string; text: string }) {
  return (
    <Link 
      href={href}
      className="group flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200 relative overflow-hidden"
    >
      <span className="text-base group-hover:scale-110 transition-transform duration-200">{icon}</span>
      <span>{text}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
    </Link>
  )
}

// Composant pour les boutons de navigation mobile
function MobileNavButton({ href, icon }: { href: string; icon: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 relative group"
    >
      <span className="text-lg group-hover:scale-110 transition-transform duration-200">{icon}</span>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"></div>
    </Link>
  )
} 