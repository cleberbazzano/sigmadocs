'use client'

import { useState, useEffect } from 'react'
import { useGEDStore } from '@/store/ged-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Scan,
  FileText,
  Settings,
  Play,
  StopCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileKey,
  Shield,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Printer
} from 'lucide-react'

interface Scanner {
  id: string
  name: string
  manufacturer?: string
  model?: string
  driver?: string
  ipAddress?: string
  isNetwork: boolean
  isDefault: boolean
  isActive: boolean
  lastUsedAt?: string
}

interface ScanPreview {
  id: string
  fileName: string
  preview: string
  scannedAt: string
}

export function ScanView() {
  const { setCurrentView } = useGEDStore()
  const [activeTab, setActiveTab] = useState('scan')
  
  // Scanners
  const [scanners, setScanners] = useState<Scanner[]>([
    { id: '1', name: 'Scanner Local', manufacturer: 'HP', model: 'ScanJet Pro 3000', isNetwork: false, isDefault: true, isActive: true },
    { id: '2', name: 'Scanner Rede', manufacturer: 'Canon', model: 'imageFORMULA DR-G2140', ipAddress: '192.168.1.50', isNetwork: true, isDefault: false, isActive: true },
  ])
  const [selectedScanner, setSelectedScanner] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scannedDocs, setScannedDocs] = useState<ScanPreview[]>([])
  
  // Configurações de digitalização
  const [scanSettings, setScanSettings] = useState({
    resolution: '300',
    colorMode: 'color',
    duplex: true,
    format: 'PDF',
    quality: 'high'
  })
  
  // Assinatura na digitalização
  const [signOnScan, setSignOnScan] = useState(false)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [certificatePassword, setCertificatePassword] = useState('')
  const [certificateInfo, setCertificateInfo] = useState<any>(null)
  
  // Formulário de novo scanner
  const [showScannerForm, setShowScannerForm] = useState(false)
  const [newScanner, setNewScanner] = useState({
    name: '',
    manufacturer: '',
    model: '',
    driver: '',
    ipAddress: '',
    isNetwork: false
  })
  
  const startScan = async () => {
    if (!selectedScanner) {
      alert('Selecione um scanner')
      return
    }
    
    setIsScanning(true)
    setScanProgress(0)
    
    // Simular progresso de digitalização
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 300)
    
    // Simular digitalização
    await new Promise(resolve => setTimeout(resolve, 3500))
    
    // Adicionar documento digitalizado
    const newDoc: ScanPreview = {
      id: Math.random().toString(36).substr(2, 9),
      fileName: `documento-${Date.now()}.pdf`,
      preview: '/placeholder-document.png',
      scannedAt: new Date().toLocaleString('pt-BR')
    }
    
    setScannedDocs(prev => [...prev, newDoc])
    setIsScanning(false)
    setScanProgress(0)
    
    // Se assinatura automática estiver ativa
    if (signOnScan && certificateInfo) {
      // Simular assinatura
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCertificateFile(file)
      
      // Simular validação do certificado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setCertificateInfo({
        commonName: 'JOÃO DA SILVA:12345678901',
        organization: 'EMPRESA EXEMPLO LTDA',
        cpf: '123.456.789-01',
        validTo: new Date('2025-01-01')
      })
    }
  }
  
  const addScanner = () => {
    const scanner: Scanner = {
      id: Math.random().toString(36).substr(2, 9),
      ...newScanner,
      isDefault: false,
      isActive: true
    }
    setScanners(prev => [...prev, scanner])
    setShowScannerForm(false)
    setNewScanner({ name: '', manufacturer: '', model: '', driver: '', ipAddress: '', isNetwork: false })
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Digitalização</h1>
          <p className="text-slate-500 mt-1">Digitalize documentos com scanner e assinatura digital opcional</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="scan">Digitalizar</TabsTrigger>
          <TabsTrigger value="scanners">Scanners</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        {/* Tab: Digitalizar */}
        <TabsContent value="scan" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scanner Selection & Controls */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selecionar Scanner */}
                <div className="space-y-2">
                  <Label>Selecione o Scanner</Label>
                  <Select value={selectedScanner} onValueChange={setSelectedScanner}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {scanners.filter(s => s.isActive).map((scanner) => (
                        <SelectItem key={scanner.id} value={scanner.id}>
                          <div className="flex items-center gap-2">
                            {scanner.name}
                            {scanner.isDefault && (
                              <Badge variant="outline" className="text-xs">Padrão</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Configurações rápidas */}
                <div className="space-y-3">
                  <Label>Resolução</Label>
                  <Select value={scanSettings.resolution} onValueChange={(v) => setScanSettings({...scanSettings, resolution: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="150">150 dpi (Rápido)</SelectItem>
                      <SelectItem value="200">200 dpi (Normal)</SelectItem>
                      <SelectItem value="300">300 dpi (Alta)</SelectItem>
                      <SelectItem value="600">600 dpi (Máxima)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label>Modo de Cor</Label>
                  <Select value={scanSettings.colorMode} onValueChange={(v) => setScanSettings({...scanSettings, colorMode: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Colorido</SelectItem>
                      <SelectItem value="grayscale">Escala de Cinza</SelectItem>
                      <SelectItem value="bw">Preto e Branco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Frente e Verso (Duplex)</Label>
                  <Switch
                    checked={scanSettings.duplex}
                    onCheckedChange={(v) => setScanSettings({...scanSettings, duplex: v})}
                  />
                </div>
                
                <Separator />
                
                {/* Assinatura na digitalização */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        Assinar ao Digitalizar
                      </Label>
                      <p className="text-xs text-slate-500 mt-1">
                        Assina automaticamente com certificado A1
                      </p>
                    </div>
                    <Switch
                      checked={signOnScan}
                      onCheckedChange={setSignOnScan}
                    />
                  </div>
                  
                  {signOnScan && (
                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="cert">Certificado Digital A1</Label>
                        <Input
                          id="cert"
                          type="file"
                          accept=".pfx,.p12"
                          onChange={handleCertificateUpload}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pass">Senha do Certificado</Label>
                        <Input
                          id="pass"
                          type="password"
                          value={certificatePassword}
                          onChange={(e) => setCertificatePassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      
                      {certificateInfo && (
                        <Alert className="bg-emerald-50 border-emerald-200">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <AlertTitle className="text-emerald-800">Certificado Válido</AlertTitle>
                          <AlertDescription className="text-emerald-700 text-xs">
                            {certificateInfo.commonName}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Botão Digitalizar */}
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={startScan}
                  disabled={isScanning || !selectedScanner}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Digitalizando... {scanProgress}%
                    </>
                  ) : (
                    <>
                      <Scan className="h-5 w-5 mr-2" />
                      Iniciar Digitalização
                    </>
                  )}
                </Button>
                
                {isScanning && (
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Preview Area */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos Digitalizados
                  </span>
                  {scannedDocs.length > 0 && (
                    <Button size="sm" onClick={() => setCurrentView('upload')}>
                      Enviar para o Sistema
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scannedDocs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Scan className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <p>Nenhum documento digitalizado</p>
                    <p className="text-sm mt-1">Selecione um scanner e clique em "Iniciar Digitalização"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {scannedDocs.map((doc) => (
                      <div 
                        key={doc.id}
                        className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="aspect-[3/4] bg-slate-100 rounded mb-2 flex items-center justify-center">
                          <FileText className="h-12 w-12 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium truncate">{doc.fileName}</p>
                        <p className="text-xs text-slate-500">{doc.scannedAt}</p>
                        {signOnScan && (
                          <Badge variant="outline" className="mt-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Assinado
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab: Scanners */}
        <TabsContent value="scanners" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Scanners Cadastrados</span>
                <Button onClick={() => setShowScannerForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Scanner
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scanners.map((scanner) => (
                  <div 
                    key={scanner.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'p-3 rounded-full',
                        scanner.isActive ? 'bg-emerald-100' : 'bg-slate-100'
                      )}>
                        <Printer className={cn(
                          'h-5 w-5',
                          scanner.isActive ? 'text-emerald-600' : 'text-slate-400'
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{scanner.name}</p>
                          {scanner.isDefault && (
                            <Badge className="bg-emerald-100 text-emerald-800">Padrão</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {scanner.manufacturer} {scanner.model}
                          {scanner.isNetwork && ` • IP: ${scanner.ipAddress}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={scanner.isActive ? 'border-emerald-200 text-emerald-700' : ''}>
                        {scanner.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Form novo scanner */}
          {showScannerForm && (
            <Card>
              <CardHeader>
                <CardTitle>Novo Scanner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={newScanner.name}
                      onChange={(e) => setNewScanner({...newScanner, name: e.target.value})}
                      placeholder="Nome identificador"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fabricante</Label>
                    <Input
                      value={newScanner.manufacturer}
                      onChange={(e) => setNewScanner({...newScanner, manufacturer: e.target.value})}
                      placeholder="Ex: HP, Canon, Epson"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      value={newScanner.model}
                      onChange={(e) => setNewScanner({...newScanner, model: e.target.value})}
                      placeholder="Modelo do scanner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Driver</Label>
                    <Input
                      value={newScanner.driver}
                      onChange={(e) => setNewScanner({...newScanner, driver: e.target.value})}
                      placeholder="Caminho do driver (Windows)"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newScanner.isNetwork}
                      onCheckedChange={(v) => setNewScanner({...newScanner, isNetwork: v})}
                    />
                    <Label>Scanner de Rede</Label>
                  </div>
                  
                  {newScanner.isNetwork && (
                    <div className="flex-1 space-y-2">
                      <Label>Endereço IP</Label>
                      <Input
                        value={newScanner.ipAddress}
                        onChange={(e) => setNewScanner({...newScanner, ipAddress: e.target.value})}
                        placeholder="192.168.1.100"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={addScanner}>Salvar</Button>
                  <Button variant="outline" onClick={() => setShowScannerForm(false)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Tab: Configurações */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Digitalização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Configurações Padrão</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Formato de Saída</Label>
                      <Select value={scanSettings.format} onValueChange={(v) => setScanSettings({...scanSettings, format: v})}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDF">PDF</SelectItem>
                          <SelectItem value="TIFF">TIFF</SelectItem>
                          <SelectItem value="JPEG">JPEG</SelectItem>
                          <SelectItem value="PNG">PNG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Qualidade</Label>
                      <Select value={scanSettings.quality} onValueChange={(v) => setScanSettings({...scanSettings, quality: v})}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Pós-Processamento</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>OCR Automático</Label>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Auto-roteamento de página</Label>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Remover páginas em branco</Label>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Compressão automática</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
