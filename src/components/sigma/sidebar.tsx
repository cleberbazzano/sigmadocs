'use client'

import { useState, useEffect } from 'react'
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
  FileBarChart,
  Scan,
  Building,
  Database,
  Key,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import Image from 'next/image'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'scan', label: 'Digitalização', icon: Scan },
  { id: 'search', label: 'Busca Avançada', icon: Search },
  { id: 'categories', label: 'Categorias', icon: FolderTree },
  { id: 'signatures', label: 'Assinaturas', icon: FileCheck },
  { id: 'reports', label: 'Relatórios', icon: FileBarChart },
]

const adminItems = [
  { id: 'company', label: 'Empresa', icon: Building },
  { id: 'admin', label: 'Usuários', icon: Users },
  { id: 'audit', label: 'Auditoria', icon: History },
  { id: 'backup', label: 'Backup', icon: Database },
  { id: 'apikeys', label: 'API Keys', icon: Key },
  { id: 'tasks', label: 'Tarefas', icon: Clock },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'settings', label: 'Configurações', icon: Settings },
]

interface SystemConfig {
  logoUrl: string
  logoUrlDark: string
  systemName: string
}

export function Sidebar() {
  const { user, sidebarOpen, setSidebarOpen, setCurrentView, currentView, logout } = useGEDStore()
  const [config, setConfig] = useState<SystemConfig>({
    logoUrl: '/logo-light.png',
    logoUrlDark: '/logo-dark.png',
    systemName: 'Sigma DOCs'
  })
  
  // Carregar configurações do sistema
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setConfig(data.config)
        }
      })
      .catch(() => {})
  }, [])
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  
  // Sidebar tem fundo escuro, usa logo para fundo escuro
  const logoUrl = config.logoUrlDark
  
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
        'fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {sidebarOpen && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image 
                src={logoUrl} 
                alt="Sigma DOCs" 
                fill
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-lg text-white">
                Sigma DOCs
              </span>
              <p className="text-[10px] text-slate-400 -mt-1">Gestão Documental</p>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 relative mx-auto">
            <Image 
              src={logoUrl} 
              alt="Sigma DOCs" 
              fill
              className="object-contain"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "text-slate-300 hover:text-white hover:bg-slate-800",
            !sidebarOpen && "absolute right-2 top-4"
          )}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* User Info */}
      {sidebarOpen && user && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-teal-500 ring-offset-2 ring-offset-slate-900">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
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
                    onClick={() => setCurrentView(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                      currentView === item.id
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25'
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
                      onClick={() => setCurrentView(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                        currentView === item.id
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25'
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
