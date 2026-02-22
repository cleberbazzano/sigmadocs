'use client'

import { useState } from 'react'
import { useGEDStore } from '@/store/ged-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Search,
  Filter,
  Sparkles,
  FileText,
  Calendar,
  User,
  Building,
  Tag,
  Clock,
  Shield,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  snippet: string
  category: string
  type: string
  status: string
  confidentiality: string
  author: string
  date: string
  relevance: number
  aiMatch: boolean
}

const mockResults: SearchResult[] = [
  { id: '1', title: 'Contrato de Prestação de Serviços - ABC Ltda', snippet: '...cláusula primeira do objeto deste contrato de prestação de serviços técnicos especializados...', category: 'Contratos', type: 'Contrato', status: 'SIGNED', confidentiality: 'RESTRICTED', author: 'Maria Santos', date: '2024-01-15', relevance: 98, aiMatch: true },
  { id: '2', title: 'Acordo de Confidencialidade - Projeto X', snippet: '...o receptor se compromete a manter sigilo sobre todas as informações confidenciais...', category: 'Jurídico', type: 'Acordo', status: 'SIGNED', confidentiality: 'CONFIDENTIAL', author: 'Carlos Lima', date: '2024-01-14', relevance: 85, aiMatch: true },
  { id: '3', title: 'Política de Segurança da Informação', snippet: '...esta política estabelece diretrizes para proteção de dados e sistemas de informação...', category: 'Políticas', type: 'Política', status: 'APPROVED', confidentiality: 'INTERNAL', author: 'Ana Costa', date: '2024-01-13', relevance: 72, aiMatch: false },
  { id: '4', title: 'Relatório Financeiro Q4 2023', snippet: '...análise detalhada dos resultados financeiros do quarto trimestre com projeções...', category: 'Financeiro', type: 'Relatório', status: 'APPROVED', confidentiality: 'CONFIDENTIAL', author: 'Pedro Alves', date: '2024-01-12', relevance: 65, aiMatch: false },
  { id: '5', title: 'Ata de Reunião - Diretoria', snippet: '...foram discutidos os principais pontos da pauta incluindo orçamento e estratégias...', category: 'Corporativo', type: 'Ata', status: 'SIGNED', confidentiality: 'RESTRICTED', author: 'João Silva', date: '2024-01-11', relevance: 58, aiMatch: false },
]

export function SearchView() {
  const { setCurrentView } = useGEDStore()
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'keyword' | 'semantic'>('semantic')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Filters
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [confidentiality, setConfidentiality] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  const handleSearch = async () => {
    if (!query.trim()) return
    
    setSearching(true)
    setHasSearched(true)
    
    // Simular busca
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Filtrar resultados mock baseado nos filtros
    let filtered = [...mockResults]
    
    if (category !== 'all') {
      filtered = filtered.filter(r => r.category.toLowerCase() === category.toLowerCase())
    }
    if (status !== 'all') {
      filtered = filtered.filter(r => r.status === status)
    }
    if (confidentiality !== 'all') {
      filtered = filtered.filter(r => r.confidentiality === confidentiality)
    }
    
    setResults(filtered)
    setSearching(false)
  }
  
  const statusColors: Record<string, string> = {
    SIGNED: 'bg-emerald-100 text-emerald-800',
    PENDING: 'bg-amber-100 text-amber-800',
    DRAFT: 'bg-slate-100 text-slate-800',
    APPROVED: 'bg-blue-100 text-blue-800',
  }
  
  const statusLabels: Record<string, string> = {
    SIGNED: 'Assinado',
    PENDING: 'Pendente',
    DRAFT: 'Rascunho',
    APPROVED: 'Aprovado',
  }
  
  const confidentialityColors: Record<string, string> = {
    PUBLIC: 'text-green-600',
    INTERNAL: 'text-blue-600',
    RESTRICTED: 'text-amber-600',
    CONFIDENTIAL: 'text-orange-600',
    SECRET: 'text-red-600'
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Busca Avançada</h1>
        <p className="text-slate-500 mt-1">Pesquise documentos por conteúdo, metadados ou busca semântica com IA</p>
      </div>
      
      {/* Search Box */}
      <Card className="border-2 border-emerald-100">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                {searchType === 'semantic' && (
                  <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                )}
                <Search className={cn(
                  'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4',
                  searchType === 'semantic' ? 'text-purple-500 left-10' : 'text-slate-400'
                )} />
                <Input
                  placeholder={searchType === 'semantic' 
                    ? 'Busca inteligente: "contratos de prestação de serviços do último trimestre"'
                    : 'Buscar por palavras-chave, número do documento, autor...'
                  }
                  className={cn('pl-10', searchType === 'semantic' && 'pl-16')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button size="lg" onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
            
            {/* Search Type */}
            <div className="flex items-center gap-4">
              <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)} className="w-auto">
                <TabsList className="grid grid-cols-2 w-64">
                  <TabsTrigger value="semantic" className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Semântica (IA)
                  </TabsTrigger>
                  <TabsTrigger value="keyword">Palavra-chave</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Categoria</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="contratos">Contratos</SelectItem>
                    <SelectItem value="jurídico">Jurídico</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="políticas">Políticas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="SIGNED">Assinado</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                    <SelectItem value="APPROVED">Aprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Confidencialidade</label>
                <Select value={confidentiality} onValueChange={setConfidentiality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PUBLIC">Público</SelectItem>
                    <SelectItem value="INTERNAL">Interno</SelectItem>
                    <SelectItem value="RESTRICTED">Restrito</SelectItem>
                    <SelectItem value="CONFIDENTIAL">Confidencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Data Inicial</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Data Final</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {results.length} documento(s) encontrado(s)
            </p>
          </div>
          
          {results.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-600">Nenhum documento encontrado</p>
                <p className="text-slate-500 mt-1">Tente ajustar os filtros ou a busca</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {result.aiMatch && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <Sparkles className="h-3 w-3 mr-1" />
                              IA
                            </Badge>
                          )}
                          <Badge className={statusColors[result.status]}>
                            {statusLabels[result.status]}
                          </Badge>
                          <span className={cn('text-sm', confidentialityColors[result.confidentiality])}>
                            <Shield className="h-3 w-3 inline mr-1" />
                            {result.confidentiality}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
                        <p className="text-slate-600 text-sm mb-3 bg-yellow-50 px-2 py-1 rounded inline">
                          {result.snippet}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {result.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {result.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(result.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm">
                          <span className="text-slate-500">Relevância: </span>
                          <span className="font-bold text-emerald-600">{result.relevance}%</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Initial State */}
      {!hasSearched && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex justify-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-full">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Busca Avançada de Documentos</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Utilize a busca semântica com IA para encontrar documentos por significado, 
              não apenas por palavras-chave. O sistema entende contexto e intenções.
            </p>
            
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="py-2 px-3 cursor-pointer hover:bg-slate-50" onClick={() => { setQuery('contratos assinados este mês'); handleSearch(); }}>
                "contratos assinados este mês"
              </Badge>
              <Badge variant="outline" className="py-2 px-3 cursor-pointer hover:bg-slate-50" onClick={() => { setQuery('documentos confidenciais sobre financeiro'); handleSearch(); }}>
                "documentos confidenciais sobre financeiro"
              </Badge>
              <Badge variant="outline" className="py-2 px-3 cursor-pointer hover:bg-slate-50" onClick={() => { setQuery('políticas de segurança'); handleSearch(); }}>
                "políticas de segurança"
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
