'use client'

import { useState, useEffect } from 'react'
import { useGEDStore } from '@/store/ged-store'
import { cn } from '@/lib/utils'
import { Bell, Search, AlertTriangle, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExpirationAlertPopup } from './expiration-alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link?: string
  read: boolean
  createdAt: string
}

export function Header() {
  const { user, sidebarOpen, setSearchQuery, logout, setCurrentView } = useGEDStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showExpirationAlert, setShowExpirationAlert] = useState(false)
  const [hasExpirationAlerts, setHasExpirationAlerts] = useState(false)
  const [alertChecked, setAlertChecked] = useState(false) // Controle para não reabrir automaticamente
  const { toast } = useToast()

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications()
      // Só verifica alertas na primeira vez
      if (!alertChecked) {
        checkExpirationAlerts()
      }
    }
  }, [user, alertChecked])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkExpirationAlerts = async () => {
    try {
      const response = await fetch('/api/documents/expiring?expired=true')
      if (response.ok) {
        const data = await response.json()
        const hasAlerts = (data.expired?.length > 0 || data.expiring?.length > 0)
        setHasExpirationAlerts(hasAlerts)
        
        // Só mostra popup automaticamente se não foi verificado ainda
        if (!alertChecked) {
          const hasUnacknowledged = [...(data.expired || []), ...(data.expiring || [])]
            .some((d: any) => !d.alertAcknowledged)
          if (hasUnacknowledged) {
            setShowExpirationAlert(true)
          }
        }
      }
    } catch (error) {
      console.error('Error checking expiration alerts:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao marcar notificação como lida',
        variant: 'destructive'
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      
      toast({
        title: 'Sucesso',
        description: 'Todas as notificações marcadas como lidas'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao marcar todas as lidas',
        variant: 'destructive'
      })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    if (notification.link) {
      setCurrentView('documents')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Fechar alerta sem reabrir automaticamente
  const handleCloseExpirationAlert = () => {
    setShowExpirationAlert(false)
    setAlertChecked(true) // Marcar como verificado para não reabrir
    loadNotifications() // Apenas recarregar notificações
  }
  
  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 z-30 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-all duration-300',
          sidebarOpen ? 'left-64' : 'left-16'
        )}
      >
        <div className="flex items-center justify-between h-full px-6">
          {/* Search */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar documentos..."
                className="pl-10"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Expiration Alerts Button */}
            {hasExpirationAlerts && (
              <Button
                variant="ghost"
                size="icon"
                className="relative text-amber-500 hover:text-amber-600"
                onClick={() => setShowExpirationAlert(true)}
              >
                <AlertTriangle className="h-5 w-5" />
              </Button>
            )}

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-1">
                  <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-1 text-xs"
                      onClick={handleMarkAllAsRead}
                    >
                      Marcar todas como lidas
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-80">
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-4 text-center text-sm text-slate-500">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-3 p-3 cursor-pointer",
                          !notification.read && "bg-slate-50 dark:bg-slate-800/50"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "font-medium text-sm truncate",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="justify-center text-sm text-blue-600"
                      onClick={() => setCurrentView('documents')}
                    >
                      Ver todos os documentos
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-600 text-white text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-slate-500">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Meu Perfil</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('documents')}>Meus Documentos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('settings')}>Configurações</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Expiration Alert Popup */}
      <ExpirationAlertPopup
        isOpen={showExpirationAlert}
        onClose={handleCloseExpirationAlert}
      />
    </>
  )
}
