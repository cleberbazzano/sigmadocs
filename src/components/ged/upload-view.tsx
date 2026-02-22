'use client'

import { useState, useCallback } from 'react'
import { useGEDStore } from '@/store/ged-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileImage,
  FileSpreadsheet,
  File,
  FolderOpen,
  Sparkles
} from 'lucide-react'

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error'
  error?: string
  aiProcessed?: boolean
  aiCategory?: string
}

const acceptedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
]

const getFileIcon = (type: string) => {
  if (type.includes('image')) return FileImage
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet
  return FileText
}

export function UploadView() {
  const { setCurrentView } = useGEDStore()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [confidentiality, setConfidentiality] = useState('INTERNAL')
  const [keywords, setKeywords] = useState('')
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }
  
  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => 
      acceptedTypes.includes(file.type) || file.name.endsWith('.p7s') || file.name.endsWith('.cer')
    )
    
    const uploadedFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending'
    }))
    
    setFiles(prev => [...prev, ...uploadedFiles])
  }
  
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }
  
  const uploadFiles = async () => {
    if (files.length === 0) return
    setUploading(true)
    
    for (const uploadedFile of files) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 20 } : f
        ))
        
        const formData = new FormData()
        formData.append('file', uploadedFile.file)
        formData.append('title', title || uploadedFile.file.name)
        formData.append('description', description)
        formData.append('category', category)
        formData.append('documentType', documentType)
        formData.append('confidentiality', confidentiality)
        formData.append('keywords', keywords)
        
        // Simulate progress
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { ...f, progress: 50 } : f
        ))
        
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // Processing with AI
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id ? { ...f, status: 'processing', progress: 80 } : f
          ))
          
          // Simulate AI processing
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id ? { 
              ...f, 
              status: 'success', 
              progress: 100,
              aiProcessed: true,
              aiCategory: result.aiCategory || 'Contratos'
            } : f
          ))
        } else {
          throw new Error('Erro no upload')
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { 
            ...f, 
            status: 'error', 
            error: 'Falha no upload' 
          } : f
        ))
      }
    }
    
    setUploading(false)
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Upload de Documentos</h1>
          <p className="text-slate-500 mt-1">Adicione novos documentos ao sistema com processamento IA</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drop Zone */}
          <Card>
            <CardContent className="p-6">
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer',
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept={acceptedTypes.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center gap-4">
                  <div className={cn(
                    'p-4 rounded-full',
                    isDragging ? 'bg-emerald-100' : 'bg-slate-100'
                  )}>
                    <Upload className={cn(
                      'h-8 w-8',
                      isDragging ? 'text-emerald-600' : 'text-slate-400'
                    )} />
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-slate-700">
                      {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      PDF, Imagens, Word, Excel (máx. 50MB)
                    </p>
                  </div>
                  
                  <Button variant="outline">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Escolher Arquivos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* File List */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Arquivos ({files.length})</span>
                  <Button 
                    size="sm" 
                    onClick={uploadFiles} 
                    disabled={uploading || files.every(f => f.status === 'success')}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Todos
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((uploadedFile) => {
                    const FileIcon = getFileIcon(uploadedFile.file.type)
                    return (
                      <div
                        key={uploadedFile.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="p-2 bg-slate-100 rounded">
                          <FileIcon className="h-6 w-6 text-slate-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{uploadedFile.file.name}</p>
                            {uploadedFile.aiProcessed && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                <Sparkles className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            {formatFileSize(uploadedFile.file.size)}
                          </p>
                          
                          {uploadedFile.status === 'uploading' || uploadedFile.status === 'processing' ? (
                            <Progress value={uploadedFile.progress} className="h-1 mt-2" />
                          ) : null}
                          
                          {uploadedFile.aiCategory && (
                            <p className="text-xs text-purple-600 mt-1">
                              Categoria sugerida: {uploadedFile.aiCategory}
                            </p>
                          )}
                          
                          {uploadedFile.error && (
                            <p className="text-xs text-red-600 mt-1">{uploadedFile.error}</p>
                          )}
                        </div>
                        
                        <div>
                          {uploadedFile.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          ) : uploadedFile.status === 'error' ? (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          ) : uploadedFile.status === 'processing' ? (
                            <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFile(uploadedFile.id)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Metadata Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metadados do Documento</CardTitle>
              <CardDescription>Informações para organização e busca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Título do documento"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição breve do documento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contracts">Contratos</SelectItem>
                    <SelectItem value="reports">Relatórios</SelectItem>
                    <SelectItem value="policies">Políticas</SelectItem>
                    <SelectItem value="financial">Financeiro</SelectItem>
                    <SelectItem value="hr">Recursos Humanos</SelectItem>
                    <SelectItem value="legal">Jurídico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Contrato</SelectItem>
                    <SelectItem value="agreement">Acordo</SelectItem>
                    <SelectItem value="report">Relatório</SelectItem>
                    <SelectItem value="policy">Política</SelectItem>
                    <SelectItem value="procedure">Procedimento</SelectItem>
                    <SelectItem value="certificate">Certificado</SelectItem>
                    <SelectItem value="invoice">Nota Fiscal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Nível de Confidencialidade</Label>
                <Select value={confidentiality} onValueChange={setConfidentiality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Público</SelectItem>
                    <SelectItem value="INTERNAL">Interno</SelectItem>
                    <SelectItem value="RESTRICTED">Restrito</SelectItem>
                    <SelectItem value="CONFIDENTIAL">Confidencial</SelectItem>
                    <SelectItem value="SECRET">Secreto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Palavras-chave</Label>
                <Input
                  id="keywords"
                  placeholder="Separe por vírgulas"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* AI Info */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">Processamento IA</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Os documentos serão automaticamente categorizados, indexados e terão resumos gerados por IA.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
