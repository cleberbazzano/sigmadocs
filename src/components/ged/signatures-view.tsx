'use client'

import { useState, useCallback } from 'react'
import { useGEDStore } from '@/store/ged-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  FileCheck,
  Key,
  Upload,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  FileKey,
  Clock,
  User,
  Calendar,
  Building
} from 'lucide-react'

interface CertificateInfo {
  commonName: string
  organization: string
  cpf: string
  validFrom: Date
  validTo: Date
  issuer: string
}

export function SignaturesView() {
  const { documents, currentDocument } = useGEDStore()
  const [activeTab, setActiveTab] = useState('sign')
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [certificatePassword, setCertificatePassword] = useState('')
  const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCertificateFile(file)
      setError('')
      
      // Simular validação do certificado
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCertificateInfo({
        commonName: 'JOÃO DA SILVA:12345678901',
        organization: 'EMPRESA EXEMPLO LTDA',
        cpf: '123.456.789-01',
        validFrom: new Date('2023-01-01'),
        validTo: new Date('2025-01-01'),
        issuer: 'Autoridade Certificadora Raiz Brasileira v10'
      })
      
      setLoading(false)
    }
  }
  
  const handleSign = async () => {
    if (!certificateFile || !certificatePassword) {
      setError('Por favor, forneça o certificado e a senha')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Simular processo de assinatura
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSuccess('Documento assinado com sucesso! A assinatura digital foi aplicada e o documento possui validade jurídica.')
    } catch (err) {
      setError('Erro ao assinar documento')
    } finally {
      setLoading(false)
    }
  }
  
  const pendingSignatures = [
    { id: '1', title: 'Contrato de Prestação de Serviços #1234', requestedBy: 'Maria Santos', date: '2024-01-15' },
    { id: '2', title: 'Acordo de Confidencialidade', requestedBy: 'Carlos Lima', date: '2024-01-14' },
    { id: '3', title: 'Termo de Responsabilidade', requestedBy: 'Ana Costa', date: '2024-01-13' },
  ]
  
  const recentSignatures = [
    { id: '1', title: 'Relatório Financeiro Q4', signedAt: '2024-01-15 14:32', validUntil: '2030-01-15' },
    { id: '2', title: 'Política de Privacidade', signedAt: '2024-01-14 09:15', validUntil: '2030-01-14' },
    { id: '3', title: 'Contrato de Trabalho', signedAt: '2024-01-13 16:45', validUntil: '2030-01-13' },
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assinatura Digital</h1>
          <p className="text-slate-500 mt-1">Assine documentos com certificado digital A1 (ICP-Brasil)</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="sign">Assinar</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        
        {/* Tab: Sign */}
        <TabsContent value="sign" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Certificate Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileKey className="h-5 w-5" />
                  Certificado Digital A1
                </CardTitle>
                <CardDescription>
                  Carregue seu certificado digital ICP-Brasil padrão A1 (arquivo .pfx ou .p12)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={handleCertificateUpload}
                    className="hidden"
                    id="cert-upload"
                  />
                  <label htmlFor="cert-upload" className="cursor-pointer">
                    <Key className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-medium">
                      {certificateFile ? certificateFile.name : 'Clique para carregar o certificado'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Formatos: .pfx, .p12 (máx. 5MB)
                    </p>
                  </label>
                </div>
                
                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Senha do Certificado</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite a senha do certificado"
                    value={certificatePassword}
                    onChange={(e) => setCertificatePassword(e.target.value)}
                  />
                </div>
                
                {/* Certificate Info */}
                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                )}
                
                {certificateInfo && !loading && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-medium">
                      <CheckCircle className="h-5 w-5" />
                      Certificado Válido
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-500">Nome</p>
                        <p className="font-medium">{certificateInfo.commonName}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">CPF</p>
                        <p className="font-medium">{certificateInfo.cpf}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Organização</p>
                        <p className="font-medium">{certificateInfo.organization}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Válido até</p>
                        <p className="font-medium">{certificateInfo.validTo.toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Document to Sign */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Documento para Assinar
                </CardTitle>
                <CardDescription>
                  Selecione um documento pendente de assinatura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Selection */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium">Contrato de Prestação de Serviços #1234</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Enviado por Maria Santos • 15/01/2024
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Pendente de Assinatura
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Alerts */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="text-emerald-800">Sucesso</AlertTitle>
                    <AlertDescription className="text-emerald-700">{success}</AlertDescription>
                  </Alert>
                )}
                
                {/* Sign Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSign}
                  disabled={!certificateInfo || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assinando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Assinar Documento
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-slate-500 text-center">
                  Ao assinar, você concorda com os termos do documento e confirma sua autenticidade.
                  A assinatura digital possui validade jurídica conforme MP 2.200-2/2001.
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Sobre a Assinatura Digital</p>
                  <p className="mt-1">
                    A assinatura digital com certificado A1 ICP-Brasil garante a autenticidade, 
                    integridade e não-repúdio do documento, conferindo validade jurídica equivalente 
                    à assinatura manuscrita conforme a Medida Provisória 2.200-2/2001.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Pending */}
        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Pendentes de Assinatura</CardTitle>
              <CardDescription>
                Documentos que aguardam sua assinatura digital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingSignatures.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-slate-500">
                          Solicitado por {doc.requestedBy} • {new Date(doc.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setActiveTab('sign')}>
                      Assinar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: History */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Assinaturas</CardTitle>
              <CardDescription>
                Documentos assinados digitalmente por você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSignatures.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Assinado em {doc.signedAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Válido até {doc.validUntil}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Válido
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
