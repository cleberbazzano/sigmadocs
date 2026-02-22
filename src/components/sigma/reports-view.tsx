'use client'

import { useState, useRef, useEffect } from 'react'
import { useGEDStore } from '@/store/ged-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  FileBarChart,
  Download,
  Printer,
  Eye,
  Filter,
  Calendar,
  FileText,
  Users,
  FileCheck,
  History,
  Search,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface Company {
  razaoSocial: string
  nomeFantasia?: string
  cnpj: string
  email: string
  site?: string
  telefoneComercial?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: { nome: string }
  uf?: string
  logo?: string
}

interface ReportData {
  title: string
  module: string
  date: string
  filters: string[]
  headers: string[]
  rows: (string | number)[][]
  totalRows: number
}

const reportModules = [
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'signatures', label: 'Assinaturas', icon: FileCheck },
  { id: 'audit', label: 'Auditoria', icon: History },
]

// Dados mock para demonstração
const mockDocumentsReport: ReportData = {
  title: 'Relatório de Documentos',
  module: 'documents',
  date: new Date().toLocaleDateString('pt-BR'),
  filters: ['Status: Todos', 'Período: Últimos 30 dias'],
  headers: ['Título', 'Tipo', 'Status', 'Autor', 'Data', 'Tamanho'],
  rows: [
    ['Contrato de Prestação de Serviços', 'Contrato', 'Assinado', 'Maria Santos', '15/01/2024', '2.5 MB'],
    ['Relatório Financeiro Q4', 'Relatório', 'Aprovado', 'Carlos Lima', '14/01/2024', '1.8 MB'],
    ['Política de Segurança', 'Política', 'Assinado', 'Ana Costa', '13/01/2024', '850 KB'],
    ['Acordo de Confidencialidade', 'Acordo', 'Pendente', 'Pedro Alves', '12/01/2024', '520 KB'],
    ['Ata de Reunião', 'Ata', 'Rascunho', 'João Silva', '11/01/2024', '320 KB'],
  ],
  totalRows: 5
}

export function ReportsView() {
  const { setCurrentView } = useGEDStore()
  const printRef = useRef<HTMLDivElement>(null)
  
  const [selectedModule, setSelectedModule] = useState('documents')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // Carregar dados da empresa ao montar
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/company')
        const data = await response.json()
        setCompany(data.company)
      } catch (err) {
        console.error('Erro ao carregar empresa:', err)
      }
    })()
  }, [])
  
  const generateReport = async () => {
    setLoading(true)
    
    // Simular geração do relatório
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const moduleConfig = reportModules.find(m => m.id === selectedModule)
    const filters = []
    
    if (status !== 'all') filters.push(`Status: ${status}`)
    if (category !== 'all') filters.push(`Categoria: ${category}`)
    if (dateFrom) filters.push(`De: ${new Date(dateFrom).toLocaleDateString('pt-BR')}`)
    if (dateTo) filters.push(`Até: ${new Date(dateTo).toLocaleDateString('pt-BR')}`)
    
    const report: ReportData = {
      title: `Relatório de ${moduleConfig?.label || 'Documentos'}`,
      module: selectedModule,
      date: new Date().toLocaleDateString('pt-BR'),
      filters: filters.length > 0 ? filters : ['Todos os registros'],
      headers: moduleConfig?.id === 'documents' 
        ? ['Título', 'Tipo', 'Status', 'Autor', 'Data', 'Tamanho']
        : moduleConfig?.id === 'users'
        ? ['Nome', 'Email', 'Perfil', 'Departamento', 'Status', 'Último Acesso']
        : moduleConfig?.id === 'signatures'
        ? ['Documento', 'Signatário', 'Data', 'Certificado', 'Validade', 'Status']
        : ['Ação', 'Usuário', 'Entidade', 'Data/Hora', 'IP', 'Detalhes'],
      rows: generateMockData(selectedModule),
      totalRows: 10
    }
    
    setReportData(report)
    setShowPreview(true)
    setLoading(false)
  }
  
  const generateMockData = (module: string): (string | number)[][] => {
    // Dados mock para cada módulo
    const docsData = [
      ['Contrato de Prestação de Serviços', 'Contrato', 'Assinado', 'Maria Santos', '15/01/2024', '2.5 MB'],
      ['Relatório Financeiro Q4', 'Relatório', 'Aprovado', 'Carlos Lima', '14/01/2024', '1.8 MB'],
      ['Política de Segurança', 'Política', 'Assinado', 'Ana Costa', '13/01/2024', '850 KB'],
      ['Acordo de Confidencialidade', 'Acordo', 'Pendente', 'Pedro Alves', '12/01/2024', '520 KB'],
      ['Ata de Reunião', 'Ata', 'Rascunho', 'João Silva', '11/01/2024', '320 KB'],
      ['Nota Fiscal 12345', 'Nota Fiscal', 'Assinado', 'Maria Santos', '10/01/2024', '150 KB'],
      ['Proposta Comercial', 'Proposta', 'Aprovado', 'Carlos Lima', '09/01/2024', '2.1 MB'],
      ['Termo de Responsabilidade', 'Termo', 'Pendente', 'Ana Costa', '08/01/2024', '280 KB'],
      ['Relatório de Desempenho', 'Relatório', 'Assinado', 'Pedro Alves', '07/01/2024', '1.2 MB'],
      ['Contrato de Trabalho', 'Contrato', 'Arquivado', 'João Silva', '06/01/2024', '950 KB'],
    ]
    
    const usersData = [
      ['Administrador', 'admin@sigmadocs.com', 'Admin', 'TI', 'Ativo', '15/01/2024 14:30'],
      ['Maria Santos', 'maria@sigmadocs.com', 'Gerente', 'Jurídico', 'Ativo', '15/01/2024 10:15'],
      ['Carlos Lima', 'carlos@sigmadocs.com', 'Usuário', 'Financeiro', 'Ativo', '14/01/2024 16:45'],
      ['Ana Costa', 'ana@sigmadocs.com', 'Usuário', 'RH', 'Ativo', '14/01/2024 09:30'],
      ['Pedro Alves', 'pedro@sigmadocs.com', 'Visualizador', 'Comercial', 'Inativo', '10/01/2024 11:00'],
    ]
    
    const signaturesData = [
      ['Contrato #1234', 'João Silva', '15/01/2024', 'Certisign', '2025-01-15', 'Válido'],
      ['Acordo #5678', 'Maria Santos', '14/01/2024', 'Serasa', '2025-06-20', 'Válido'],
      ['Relatório Q4', 'Carlos Lima', '13/01/2024', 'ICP-Brasil', '2024-12-01', 'Válido'],
      ['Política TI', 'Ana Costa', '12/01/2024', 'Certisign', '2025-03-15', 'Válido'],
    ]
    
    const auditData = [
      ['CREATE', 'Maria Santos', 'Documento', '15/01/2024 14:32', '192.168.1.100', 'Novo documento criado'],
      ['SIGN', 'João Silva', 'Documento', '15/01/2024 14:30', '192.168.1.101', 'Documento assinado'],
      ['LOGIN', 'Carlos Lima', 'Sistema', '15/01/2024 10:15', '192.168.1.102', 'Login realizado'],
      ['DOWNLOAD', 'Ana Costa', 'Documento', '14/01/2024 16:45', '192.168.1.103', 'Download realizado'],
      ['UPDATE', 'Pedro Alves', 'Documento', '14/01/2024 09:30', '192.168.1.104', 'Documento atualizado'],
    ]
    
    switch (module) {
      case 'documents': return docsData
      case 'users': return usersData
      case 'signatures': return signaturesData
      case 'audit': return auditData
      default: return docsData
    }
  }
  
  const exportToPDF = () => {
    // Abrir janela de impressão para PDF
    const printWindow = window.open('', '_blank')
    if (!printWindow || !reportData || !company) return
    
    const html = generatePDFHTML(reportData, company)
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }
  
  const generatePDFHTML = (report: ReportData, company: Company): string => {
    const rowsPerPage = 15
    const totalPages = Math.ceil(report.rows.length / rowsPerPage)
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    @media print {
      .page-break { page-break-after: always; }
      .no-break { page-break-inside: avoid; }
    }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 15px; }
    .logo { max-width: 150px; max-height: 60px; }
    .company-info { text-align: right; }
    .company-name { font-size: 14pt; font-weight: bold; color: #10b981; }
    .report-title { font-size: 18pt; font-weight: bold; text-align: center; margin: 20px 0; color: #1e293b; }
    .filters { margin-bottom: 15px; padding: 10px; background: #f1f5f9; border-radius: 5px; }
    .filter-item { display: inline-block; margin-right: 15px; font-size: 9pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #10b981; color: white; padding: 8px; text-align: left; font-size: 9pt; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 20mm; background: #f1f5f9; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8pt; color: #64748b; }
    .page-number { text-align: center; margin-top: 10px; font-size: 9pt; color: #64748b; }
  </style>
</head>
<body>
  ${Array.from({ length: totalPages }).map((_, pageIndex) => {
    const start = pageIndex * rowsPerPage
    const end = start + rowsPerPage
    const pageRows = report.rows.slice(start, end)
    
    return `
      <div class="page-break">
        <div class="header">
          <div>
            ${company.logo ? `<img src="${company.logo}" class="logo" alt="Logo" />` : '<div style="width:150px;height:60px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;border-radius:5px;"><span style="color:#94a3b8;font-size:10pt;">Logo</span></div>'}
          </div>
          <div class="company-info">
            <div class="company-name">${company.razaoSocial}</div>
            <div>CNPJ: ${company.cnpj}</div>
          </div>
        </div>
        
        <h1 class="report-title">${report.title}</h1>
        
        <div class="filters">
          <strong>Filtros aplicados:</strong><br/>
          ${report.filters.map(f => `<span class="filter-item">• ${f}</span>`).join('')}
        </div>
        
        <table>
          <thead>
            <tr>
              ${report.headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${pageRows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="page-number">Página ${pageIndex + 1} de ${totalPages}</div>
        
        <div class="footer">
          <div>
            ${company.logradouro || ''} ${company.numero || ''} ${company.bairro || ''} ${company.cidade?.nome || ''} ${company.uf || ''}
          </div>
          <div>
            ${company.site || ''} | ${company.telefoneComercial || ''} | ${company.email}
          </div>
        </div>
      </div>
    `
  }).join('')}
</body>
</html>
    `
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-500 mt-1">Gere relatórios com filtros personalizados</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Módulo */}
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportModules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      <div className="flex items-center gap-2">
                        <module.icon className="h-4 w-4" />
                        {module.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            {/* Período */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Período
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="De"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Até"
                />
              </div>
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="SIGNED">Assinado</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="contracts">Contratos</SelectItem>
                  <SelectItem value="reports">Relatórios</SelectItem>
                  <SelectItem value="policies">Políticas</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            {/* Botões */}
            <div className="space-y-2">
              <Button className="w-full" onClick={generateReport} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Preview */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visualização
              </CardTitle>
              <CardDescription>
                {reportData ? `${reportData.totalRows} registro(s) encontrado(s)` : 'Gere um relatório para visualizar'}
              </CardDescription>
            </div>
            {reportData && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToPDF}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir / PDF
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!reportData ? (
              <div className="text-center py-12 text-slate-500">
                <FileBarChart className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p>Selecione os filtros e clique em "Gerar Relatório"</p>
              </div>
            ) : (
              <div className="space-y-4" ref={printRef}>
                {/* Filtros aplicados */}
                <div className="flex flex-wrap gap-2">
                  {reportData.filters.map((f, i) => (
                    <Badge key={i} variant="outline">{f}</Badge>
                  ))}
                </div>
                
                {/* Tabela */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-600">
                        {reportData.headers.map((h, i) => (
                          <TableHead key={i} className="text-white font-semibold">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.rows.map((row, i) => (
                        <TableRow key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Total */}
                <div className="text-right text-sm text-slate-500">
                  Total: {reportData.rows.length} registro(s)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
