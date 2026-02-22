'use client'

import { useState, useEffect } from 'react'
import { useGEDStore } from '@/store/ged-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  Building,
  Upload,
  Save,
  CheckCircle,
  Loader2,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText
} from 'lucide-react'

interface Estado {
  id: string
  sigla: string
  nome: string
}

interface Cidade {
  id: string
  nome: string
  uf: string
}

export function CompanyView() {
  const { setCurrentView } = useGEDStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  // Estados e cidades
  const [estados, setEstados] = useState<Estado[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  
  // Dados da empresa
  const [formData, setFormData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    representanteNome: '',
    representanteCpf: '',
    representanteCargo: '',
    representanteTelefone: '',
    representanteCelular: '',
    representanteEmail: '',
    telefoneComercial: '',
    email: '',
    site: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidadeId: '',
    uf: '',
    logo: ''
  })
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  // Carregar estados
  useEffect(() => {
    fetchEstados()
    fetchCompany()
  }, [])
  
  // Carregar cidades quando UF muda
  useEffect(() => {
    if (formData.uf) {
      fetchCidades(formData.uf)
    }
  }, [formData.uf])
  
  const fetchEstados = async () => {
    try {
      const response = await fetch('/api/states')
      const data = await response.json()
      setEstados(data.estados || [])
    } catch (err) {
      console.error('Erro ao carregar estados:', err)
    }
  }
  
  const fetchCidades = async (uf: string) => {
    try {
      const response = await fetch(`/api/states/${uf}/cities`)
      const data = await response.json()
      setCidades(data.cidades || [])
    } catch (err) {
      console.error('Erro ao carregar cidades:', err)
    }
  }
  
  const fetchCompany = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/company')
      const data = await response.json()
      
      if (data.company) {
        setFormData({
          razaoSocial: data.company.razaoSocial || '',
          nomeFantasia: data.company.nomeFantasia || '',
          cnpj: data.company.cnpj || '',
          inscricaoEstadual: data.company.inscricaoEstadual || '',
          inscricaoMunicipal: data.company.inscricaoMunicipal || '',
          representanteNome: data.company.representanteNome || '',
          representanteCpf: data.company.representanteCpf || '',
          representanteCargo: data.company.representanteCargo || '',
          representanteTelefone: data.company.representanteTelefone || '',
          representanteCelular: data.company.representanteCelular || '',
          representanteEmail: data.company.representanteEmail || '',
          telefoneComercial: data.company.telefoneComercial || '',
          email: data.company.email || '',
          site: data.company.site || '',
          cep: data.company.cep || '',
          logradouro: data.company.logradouro || '',
          numero: data.company.numero || '',
          complemento: data.company.complemento || '',
          bairro: data.company.bairro || '',
          cidadeId: data.company.cidadeId || '',
          uf: data.company.uf || '',
          logo: data.company.logo || ''
        })
        if (data.company.logo) {
          setLogoPreview(data.company.logo)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar empresa:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError('')
    
    try {
      const formDataToSend = new FormData()
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value)
      })
      
      if (logoFile) {
        formDataToSend.append('logo', logoFile)
      }
      
      const response = await fetch('/api/company', {
        method: 'POST',
        body: formDataToSend
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Erro ao salvar dados')
      }
    } catch (err) {
      setError('Erro ao salvar dados da empresa')
    } finally {
      setSaving(false)
    }
  }
  
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }
  
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
      .slice(0, 14)
  }
  
  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }
  
  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dados da Empresa</h1>
          <p className="text-slate-500 mt-1">Configure os dados da empresa para uso em relatórios e documentos</p>
        </div>
      </div>
      
      {success && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800">Sucesso!</AlertTitle>
          <AlertDescription className="text-emerald-700">
            Dados da empresa salvos com sucesso.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="representative">Representante</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
          </TabsList>
          
          {/* Dados Básicos */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informações da Empresa
                </CardTitle>
                <CardDescription>
                  Dados cadastrais da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razaoSocial">Razão Social *</Label>
                    <Input
                      id="razaoSocial"
                      value={formData.razaoSocial}
                      onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                      placeholder="Nome completo da empresa"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                    <Input
                      id="nomeFantasia"
                      value={formData.nomeFantasia}
                      onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                      placeholder="Nome fantasia da empresa"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricaoEstadual"
                      value={formData.inscricaoEstadual}
                      onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                      placeholder="Inscrição estadual"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                    <Input
                      id="inscricaoMunicipal"
                      value={formData.inscricaoMunicipal}
                      onChange={(e) => setFormData({ ...formData, inscricaoMunicipal: e.target.value })}
                      placeholder="Inscrição municipal"
                    />
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefoneComercial">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Telefone Comercial
                    </Label>
                    <Input
                      id="telefoneComercial"
                      value={formData.telefoneComercial}
                      onChange={(e) => setFormData({ ...formData, telefoneComercial: formatPhone(e.target.value) })}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="empresa@email.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="site">
                      <Globe className="h-4 w-4 inline mr-1" />
                      Site
                    </Label>
                    <Input
                      id="site"
                      value={formData.site}
                      onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                      placeholder="www.empresa.com.br"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Representante */}
          <TabsContent value="representative">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Representante Legal
                </CardTitle>
                <CardDescription>
                  Dados do representante legal da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="representanteNome">Nome Completo *</Label>
                    <Input
                      id="representanteNome"
                      value={formData.representanteNome}
                      onChange={(e) => setFormData({ ...formData, representanteNome: e.target.value })}
                      placeholder="Nome do representante"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="representanteCargo">Cargo</Label>
                    <Input
                      id="representanteCargo"
                      value={formData.representanteCargo}
                      onChange={(e) => setFormData({ ...formData, representanteCargo: e.target.value })}
                      placeholder="Ex: Diretor, Sócio, Gerente"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="representanteCpf">CPF</Label>
                    <Input
                      id="representanteCpf"
                      value={formData.representanteCpf}
                      onChange={(e) => setFormData({ ...formData, representanteCpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="representanteTelefone">Telefone</Label>
                    <Input
                      id="representanteTelefone"
                      value={formData.representanteTelefone}
                      onChange={(e) => setFormData({ ...formData, representanteTelefone: formatPhone(e.target.value) })}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="representanteCelular">Celular</Label>
                    <Input
                      id="representanteCelular"
                      value={formData.representanteCelular}
                      onChange={(e) => setFormData({ ...formData, representanteCelular: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="representanteEmail">Email do Representante</Label>
                    <Input
                      id="representanteEmail"
                      type="email"
                      value={formData.representanteEmail}
                      onChange={(e) => setFormData({ ...formData, representanteEmail: e.target.value })}
                      placeholder="representante@email.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Endereço */}
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </CardTitle>
                <CardDescription>
                  Endereço completo da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                      placeholder="00000-000"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={formData.logradouro}
                      onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Nº"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      placeholder="Sala, Andar, etc."
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>UF (Estado)</Label>
                    <Select 
                      value={formData.uf} 
                      onValueChange={(v) => setFormData({ ...formData, uf: v, cidadeId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map((estado) => (
                          <SelectItem key={estado.sigla} value={estado.sigla}>
                            {estado.sigla} - {estado.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>Cidade</Label>
                    <Select 
                      value={formData.cidadeId} 
                      onValueChange={(v) => setFormData({ ...formData, cidadeId: v })}
                      disabled={!formData.uf}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.uf ? "Selecione a cidade" : "Selecione a UF primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cidades.map((cidade) => (
                          <SelectItem key={cidade.id} value={cidade.id}>
                            {cidade.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Logo */}
          <TabsContent value="logo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Logo da Empresa
                </CardTitle>
                <CardDescription>
                  Faça upload da logo que será exibida nos relatórios e documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Sem logo</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Upload */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor="logo" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                          <Upload className="h-4 w-4" />
                          <span>Selecionar imagem</span>
                        </div>
                      </Label>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <p className="text-sm text-slate-500 mt-2">
                        Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB
                      </p>
                    </div>
                    
                    {logoFile && (
                      <p className="text-sm text-slate-600">
                        Arquivo selecionado: {logoFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Botões */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => setCurrentView('dashboard')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Dados
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
