'use client'

import { useGEDStore } from '@/store/ged-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Upload,
  Search,
  Settings,
  Users,
  Shield,
  FolderTree,
  FileCheck,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Database,
  Key,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'search', label: 'Busca Avançada', icon: Search },
  { id: 'categories', label: 'Categorias', icon: FolderTree },
  { id: 'signatures', label: 'Assinaturas', icon: FileCheck },
]

const adminItems = [
  { id: 'admin', label: 'Usuários', icon: Users },
  { id: 'audit', label: 'Auditoria', icon: History },
  { id: 'backup', label: 'Backup', icon: Database },
  { id: 'apikeys', label: 'API Keys', icon: Key },
  { id: 'tasks', label: 'Tarefas', icon: Clock },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const { user, sidebarOpen, setSidebarOpen, setCurrentView, currentView, logout } = useGEDStore()
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      MANAGER: 'Gerente',
      USER: 'Usuário',
      VIEWER: 'Visualizador'
    }
    return labels[role] || role
  }
  
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {sidebarOpen ? (
          <div className="flex items-center gap-2">
            <Image 
              src="/logo-dark.png" 
              alt="Sigma DOCs" 
              width={40} 
              height={40}
              className="h-10 w-auto"
            />
            <span className="font-bold text-lg">Sigma DOCs</span>
          </div>
        ) : (
          <Image 
            src="/logo-dark.png" 
            alt="Sigma DOCs" 
            width={32} 
            height={32}
            className="h-8 w-auto"
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* User Info */}
      {sidebarOpen && user && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-emerald-600 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{getRoleLabel(user.role)}</p>
            </div>
          </div>
          {user.department && (
            <p className="text-xs text-slate-500 mt-2 truncate">
              {user.department}
            </p>
          )}
        </div>
      )}
      
      {/* Menu Principal */}
      <nav className="flex-1 overflow-y-auto p-2">
        <TooltipProvider delayDuration={0}>
          <div className="space-y-1">
            {sidebarOpen && (
              <p className="text-xs text-slate-500 px-2 py-2 font-medium uppercase tracking-wider">
                Principal
              </p>
            )}
            {menuItems.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setCurrentView(item.id as any)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      currentView === item.id
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
          
          {/* Menu Admin */}
          {isAdmin && (
            <div className="mt-6 space-y-1">
              {sidebarOpen && (
                <p className="text-xs text-slate-500 px-2 py-2 font-medium uppercase tracking-wider">
                  Administração
                </p>
              )}
              {adminItems.map((item) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCurrentView(item.id as any)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        currentView === item.id
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          )}
        </TooltipProvider>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full text-slate-300 hover:text-white hover:bg-slate-800',
                  !sidebarOpen && 'justify-center px-0'
                )}
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
                {sidebarOpen && <span className="ml-2">Sair</span>}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">
                Sair
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  )
}
