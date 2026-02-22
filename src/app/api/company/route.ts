import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    // Buscar dados da empresa (geralmente apenas uma)
    const company = await db.company.findFirst()
    
    return NextResponse.json({ company })
  } catch (error) {
    console.error('Erro ao buscar empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados da empresa' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    })
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      )
    }
    
    const formData = await request.formData()
    
    // Dados da empresa
    const razaoSocial = formData.get('razaoSocial') as string
    const nomeFantasia = formData.get('nomeFantasia') as string
    const cnpj = formData.get('cnpj') as string
    const inscricaoEstadual = formData.get('inscricaoEstadual') as string
    const inscricaoMunicipal = formData.get('inscricaoMunicipal') as string
    
    // Representante
    const representanteNome = formData.get('representanteNome') as string
    const representanteCpf = formData.get('representanteCpf') as string
    const representanteCargo = formData.get('representanteCargo') as string
    const representanteTelefone = formData.get('representanteTelefone') as string
    const representanteCelular = formData.get('representanteCelular') as string
    const representanteEmail = formData.get('representanteEmail') as string
    
    // Contato
    const telefoneComercial = formData.get('telefoneComercial') as string
    const email = formData.get('email') as string
    const site = formData.get('site') as string
    
    // Endereço
    const cep = formData.get('cep') as string
    const logradouro = formData.get('logradouro') as string
    const numero = formData.get('numero') as string
    const complemento = formData.get('complemento') as string
    const bairro = formData.get('bairro') as string
    const cidadeId = formData.get('cidadeId') as string
    const uf = formData.get('uf') as string
    
    // Logo
    const logoFile = formData.get('logo') as File | null
    let logoPath: string | null = null
    
    if (logoFile && logoFile.size > 0) {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'logos')
      await mkdir(uploadsDir, { recursive: true })
      
      const fileName = `logo-${Date.now()}${path.extname(logoFile.name)}`
      const filePath = path.join(uploadsDir, fileName)
      
      const bytes = await logoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      
      logoPath = `/uploads/logos/${fileName}`
    }
    
    // Verificar se já existe empresa
    const existingCompany = await db.company.findFirst()
    
    let company
    if (existingCompany) {
      // Atualizar
      company = await db.company.update({
        where: { id: existingCompany.id },
        data: {
          razaoSocial,
          nomeFantasia,
          cnpj,
          inscricaoEstadual,
          inscricaoMunicipal,
          representanteNome,
          representanteCpf,
          representanteCargo,
          representanteTelefone,
          representanteCelular,
          representanteEmail,
          telefoneComercial,
          email,
          site,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidadeId,
          uf,
          ...(logoPath && { logo: logoPath })
        }
      })
    } else {
      // Criar
      company = await db.company.create({
        data: {
          razaoSocial,
          nomeFantasia,
          cnpj,
          inscricaoEstadual,
          inscricaoMunicipal,
          representanteNome,
          representanteCpf,
          representanteCargo,
          representanteTelefone,
          representanteCelular,
          representanteEmail,
          telefoneComercial,
          email,
          site,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidadeId,
          uf,
          ...(logoPath && { logo: logoPath })
        }
      })
    }
    
    // Log de auditoria
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Company',
        entityId: company.id,
        details: JSON.stringify({ razaoSocial, cnpj }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })
    
    return NextResponse.json({ success: true, company })
    
  } catch (error) {
    console.error('Erro ao salvar empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar dados da empresa' },
      { status: 500 }
    )
  }
}
