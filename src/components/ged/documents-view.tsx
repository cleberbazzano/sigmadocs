'use client'

import { useState, useEffect } from 'react'
import { useGEDStore, Document } from '@/store/ged-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  FileCheck,
  Share2,
  Archive,
  RefreshCw,
  Plus
} from 'lucide-react'

const statusColors: Record<string, string> = {
  SIGNED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  DRAFT: 'bg-slate-100 text-slate-800 border-slate-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200'
}

const statusLabels: Record<string, string> = {
  SIGNED: 'Assinado',
  PENDING: 'Pendente',
  DRAFT: 'Rascunho',
  APPROVED: 'Aprovado',
  ARCHIVED: 'Arquivado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado'
}

const confidentialityLabels: Record<string, string> = {
  PUBLIC: 'Público',
  INTERNAL: 'Interno',
  RESTRICTED: 'Restrito',
  CONFIDENTIAL: 'Confidencial',
  SECRET: 'Secreto'
}

const confidentialityColors: Record<string, string> = {
  PUBLIC: 'text-green-600',
  INTERNAL: 'text-blue-600',
  RESTRICTED: 'text-amber-600',
  CONFIDENTIAL: 'text-orange-600',
  SECRET: 'text-red-600'
}

export function DocumentsView() {
  const { setCurrentView, searchQuery, filters, setFilters } = useGEDStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  
  useEffect(() => {
    fetchDocuments()
  }, [searchQuery, filters])
  
  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      
      const response = await fetch(`/api/documents?${params}`)
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Erro ao buscar documentos:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documentos</h1>
          <p className="text-slate-500 mt-1">Gerencie todos os documentos do sistema</p>
        </div>
        <Button onClick={() => setCurrentView('upload')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por título, número ou conteúdo..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {/* searchQuery is managed by store */}}
              />
            </div>
            
            <Select value={filters.status || 'all'} onValueChange={(v) => setFilters({ status: v === 'all' ? null : v })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="DRAFT">Rascunho</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="SIGNED">Assinado</SelectItem>
                <SelectItem value="APPROVED">Aprovado</SelectItem>
                <SelectItem value="ARCHIVED">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.confidentiality || 'all'} onValueChange={(v) => setFilters({ confidentiality: v === 'all' ? null : v })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Confidencialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PUBLIC">Público</SelectItem>
                <SelectItem value="INTERNAL">Interno</SelectItem>
                <SelectItem value="RESTRICTED">Restrito</SelectItem>
                <SelectItem value="CONFIDENTIAL">Confidencial</SelectItem>
                <SelectItem value="SECRET">Secreto</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={fetchDocuments}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Título / Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidencialidade</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando documentos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    Nenhum documento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                    <TableCell>
                      <FileText className="h-5 w-5 text-slate-400" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-slate-500">{doc.fileName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{doc.typeName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[doc.status]}>
                        {statusLabels[doc.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={confidentialityColors[doc.confidentiality]}>
                        {confidentialityLabels[doc.confidentiality]}
                      </span>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell>{doc.authorName}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Assinar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartilhar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
