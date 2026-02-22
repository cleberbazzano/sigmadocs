'use client'

import { useState, useEffect } from 'react'
import { useGEDStore } from '@/store/ged-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  FileText,
  FileCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  HardDrive,
  Shield,
  Upload,
  Search,
  ArrowRight,
  Database,
  Key,
  Calendar,
  GitBranch,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Play
} from 'lucide-react'

interface DashboardStats {
  documents: {
    total: number
    signed: number
    pending: number
    expiring: number
    archived: number
  }
  storage: {
    used: number
    total: number
    byType: { type: string; size: number }[]
  }
  backups: {
    total: number
    latestDate: string | null
    totalSize: number
  }
  tasks: {
    total: number
    active: number
    nextRun: string | null
  }
  apiKeys: {
    total: number
    active: number
  }
  workflows: {
    total: number
    active: number
    completed: number
  }
  comments: {
    total: number
    unresolved: number
  }
}

interface RecentDocument {
  id: string
  title: string
  type: string
  status: string
  date: string
  author: string
}

interface ExpiringDocument {
  id: string
  title: string
  expirationDate: string
  daysRemaining: number
}

const statusColors: Record<string, string> = {
  SIGNED: 'bg-emerald-100 text-emerald-800',
  PENDING: 'bg-amber-100 text-amber-800',
  DRAFT: 'bg-slate-100 text-slate-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-red-100 text-red-800'
}

const statusLabels: Record<string, string> = {
  SIGNED: 'Assinado',
  PENDING: 'Pendente',
  DRAFT: 'Rascunho',
  APPROVED: 'Aprovado',
  ARCHIVED: 'Arquivado',
  EXPIRED: 'Expirado'
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(date: string | Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

export function Dashboard() {
  const { setCurrentView, user } = useGEDStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([])
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      // Fetch all dashboard data from unified API
      const response = await fetch('/api/dashboard/stats')
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setRecentDocs(data.recentDocuments || [])
        setExpiringDocs(data.expiringDocuments || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Visão geral do sistema Sigma DOCs</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('search')}>
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          <Button onClick={() => setCurrentView('upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Novo Documento
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('documents')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total de Documentos</p>
                <p className="text-2xl font-bold mt-1">{stats?.documents.total || 0}</p>
                <Badge variant="outline" className="mt-2 border-emerald-200 text-emerald-700">
                  <FileCheck className="h-3 w-3 mr-1" />
                  {stats?.documents.signed || 0} assinados
                </Badge>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('signatures')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pendentes de Assinatura</p>
                <p className="text-2xl font-bold mt-1">{stats?.documents.pending || 0}</p>
                <Badge variant="outline" className="mt-2 border-amber-200 text-amber-700">
                  <Clock className="h-3 w-3 mr-1" />
                  Aguardando
                </Badge>
              </div>
              <div className="p-3 rounded-full bg-amber-50">
                <FileCheck className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('documents')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Vencendo em 30 dias</p>
                <p className="text-2xl font-bold mt-1">{stats?.documents.expiring || 0}</p>
                <Badge variant="outline" className={cn(
                  "mt-2",
                  (stats?.documents.expiring || 0) > 0 ? "border-red-200 text-red-700" : "border-emerald-200 text-emerald-700"
                )}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {(stats?.documents.expiring || 0) > 0 ? 'Atenção' : 'Em dia'}
                </Badge>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('backup')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Backups</p>
                <p className="text-2xl font-bold mt-1">{stats?.backups.total || 0}</p>
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                  <Database className="h-3 w-3 mr-1" />
                  {formatBytes(stats?.backups.totalSize || 0)}
                </Badge>
              </div>
              <div className="p-3 rounded-full bg-emerald-50">
                <Database className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Stats Row */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('apikeys')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Key className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">API Keys</p>
                  <p className="text-xl font-bold">{stats?.apiKeys.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('tasks')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-50 rounded-lg">
                  <Play className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tarefas Ativas</p>
                  <p className="text-xl font-bold">{stats?.tasks.active || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <GitBranch className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Workflows</p>
                  <p className="text-xl font-bold">{stats?.workflows.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-50 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Comentários</p>
                  <p className="text-xl font-bold">{stats?.comments.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Documentos Recentes</CardTitle>
              <CardDescription>Últimos documentos adicionados ou modificados</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('documents')}>
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentDocs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nenhum documento encontrado</p>
                <Button className="mt-4" onClick={() => setCurrentView('upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Primeiro Documento
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocs.slice(0, 5).map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setCurrentView('documents')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded">
                        <FileText className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-slate-500">
                          {doc.typeName || 'Documento'} • {doc.authorName || 'Autor'} • {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[doc.status] || statusColors.DRAFT}>
                      {statusLabels[doc.status] || doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Expiring Documents Alert */}
          {expiringDocs.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Documentos Vencendo
                </CardTitle>
                <CardDescription className="text-red-600">
                  {expiringDocs.length} documento(s) próximos do vencimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringDocs.slice(0, 3).map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-red-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-slate-500">
                          {doc.daysRemaining <= 0 ? 'Vencido' : `Vence em ${doc.daysRemaining} dias`}
                        </p>
                      </div>
                      <Badge variant={doc.daysRemaining <= 0 ? "destructive" : "outline"} className="ml-2">
                        {doc.daysRemaining}d
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 border-red-200 text-red-700 hover:bg-red-100"
                  onClick={() => setCurrentView('documents')}
                >
                  Ver Todos
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Storage Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Armazenamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Utilizado</span>
                    <span className="font-medium">
                      {formatBytes(stats?.storage?.used || 0)} / {formatBytes(stats?.storage?.total || 100 * 1024 * 1024 * 1024)}
                    </span>
                  </div>
                  <Progress 
                    value={((stats?.storage?.used || 0) / (stats?.storage?.total || 1)) * 100} 
                    className="h-2" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-blue-600 font-medium">PDFs</p>
                    <p className="text-slate-600 text-xs">~{formatBytes((stats?.storage?.used || 0) * 0.4)}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <p className="text-emerald-600 font-medium">Imagens</p>
                    <p className="text-slate-600 text-xs">~{formatBytes((stats?.storage?.used || 0) * 0.27)}</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <p className="text-amber-600 font-medium">Docs</p>
                    <p className="text-slate-600 text-xs">~{formatBytes((stats?.storage?.used || 0) * 0.18)}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-slate-600 font-medium">Outros</p>
                    <p className="text-slate-600 text-xs">~{formatBytes((stats?.storage?.used || 0) * 0.15)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                  <span className="text-sm">Certificados</span>
                  <Badge className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                  <span className="text-sm">Backup</span>
                  <Badge className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>
                </div>
                <div 
                  className="flex items-center justify-between p-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100"
                  onClick={() => setCurrentView('tasks')}
                >
                  <span className="text-sm">Tarefas Ativas</span>
                  <Badge className="bg-blue-600">{stats?.tasks.active || 0}</Badge>
                </div>
                {stats?.backups.latestDate && (
                  <div className="text-xs text-slate-500 mt-2">
                    Último backup: {formatDate(stats.backups.latestDate)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => setCurrentView('upload')}>
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => setCurrentView('signatures')}>
                  <FileCheck className="h-5 w-5" />
                  <span className="text-xs">Assinar</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => setCurrentView('search')}>
                  <Search className="h-5 w-5" />
                  <span className="text-xs">Buscar</span>
                </Button>
                {isAdmin && (
                  <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => setCurrentView('backup')}>
                    <Database className="h-5 w-5" />
                    <span className="text-xs">Backup</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
