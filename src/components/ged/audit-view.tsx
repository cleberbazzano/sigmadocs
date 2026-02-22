'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  History,
  Search,
  Download,
  FileText,
  User,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  FileCheck,
  LogIn,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditLog {
  id: string
  action: string
  userId: string | null
  user?: { name: string; email: string } | null
  entityType: string
  entityId: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
}

const actionLabels: Record<string, string> = {
  CREATE: 'Criação',
  READ: 'Leitura',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  SIGN: 'Assinatura',
  APPROVE: 'Aprovação',
  REJECT: 'Rejeição',
  SHARE: 'Compartilhamento',
  DOWNLOAD: 'Download',
  EXPORT: 'Exportação',
  EMAIL: 'Envio Email',
  ARCHIVE: 'Arquivamento',
  RESTORE: 'Restauração',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Login Falhou',
  SCAN: 'Digitalização',
  REPORT: 'Relatório'
}

const actionIcons: Record<string, any> = {
  CREATE: FileText,
  READ: Eye,
  UPDATE: Edit,
  DELETE: Trash2,
  SIGN: FileCheck,
  APPROVE: FileCheck,
  REJECT: Trash2,
  SHARE: User,
  DOWNLOAD: Download,
  EXPORT: Download,
  EMAIL: User,
  ARCHIVE: FileText,
  RESTORE: FileText,
  LOGIN: LogIn,
  LOGOUT: LogIn,
  LOGIN_FAILED: AlertTriangle,
  SCAN: FileText,
  REPORT: FileText
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  READ: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  UPDATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  SIGN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  APPROVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  SHARE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DOWNLOAD: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
  EXPORT: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
  EMAIL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ARCHIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  RESTORE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  LOGIN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  LOGOUT: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
  LOGIN_FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  SCAN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  REPORT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
}

export function AuditView() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterAction !== 'all') params.append('action', filterAction)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      
      const response = await fetch(`/api/audit?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar logs de auditoria',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const userName = log.user?.name || 'Sistema'
    const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.details?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    return matchesSearch
  })
  
  const exportLogs = () => {
    const csv = [
      ['Data', 'Ação', 'Usuário', 'Entidade', 'Detalhes', 'IP'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss'),
        actionLabels[log.action] || log.action,
        log.user?.name || 'Sistema',
        log.entityType + (log.entityId ? ` (${log.entityId.slice(0, 8)})` : ''),
        `"${(log.details || '').replace(/"/g, '""')}"`,
        log.ipAddress || '-'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Sucesso',
      description: 'Relatório de auditoria exportado com sucesso'
    })
  }

  const getEntityLabel = (log: AuditLog) => {
    const labels: Record<string, string> = {
      Document: 'Documento',
      User: 'Usuário',
      Session: 'Sessão',
      Notification: 'Notificação',
      DocumentAlert: 'Alerta de Vencimento',
      SystemConfig: 'Configuração'
    }
    return labels[log.entityType] || log.entityType
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Auditoria</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Logs de todas as ações realizadas no sistema</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadLogs}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportLogs} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{logs.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total de Ações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded">
                <FileCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{logs.filter(l => l.action === 'SIGN').length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Assinaturas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded">
                <LogIn className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{logs.filter(l => l.action === 'LOGIN').length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{logs.filter(l => l.action === 'LOGIN_FAILED').length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Falhas de Login</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por usuário, entidade ou detalhes..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="CREATE">Criação</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
                <SelectItem value="SIGN">Assinatura</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGIN_FAILED">Login Falhou</SelectItem>
                <SelectItem value="DOWNLOAD">Download</SelectItem>
                <SelectItem value="EXPORT">Exportação</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              className="w-40"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="De"
            />
            
            <Input
              type="date"
              className="w-40"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Até"
            />

            <Button onClick={loadLogs} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Filtrar'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || FileText
                  const userName = log.user?.name || 'Sistema'
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className={cn('p-2 rounded', actionColors[log.action] || 'bg-slate-100')}>
                          <ActionIcon className="h-4 w-4" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || 'bg-slate-100'}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                            {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="dark:text-white">{userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-slate-300">{getEntityLabel(log)}</TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {log.details ? JSON.parse(log.details).reason || log.details.slice(0, 50) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress || '-'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
