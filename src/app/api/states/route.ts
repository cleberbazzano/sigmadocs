import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { estados, cidadesPorEstado } from '@/lib/brazil-data'

export async function GET() {
  try {
    // Buscar estados do banco ou retornar dados estáticos
    let estadosDb = await db.estado.findMany({
      orderBy: { nome: 'asc' }
    })
    
    // Se não houver estados, popular o banco
    if (estadosDb.length === 0) {
      // Criar estados
      for (const estado of estados) {
        await db.estado.create({
          data: { sigla: estado.sigla, nome: estado.nome }
        })
        
        // Criar cidades do estado
        const cidades = cidadesPorEstado[estado.sigla] || []
        for (const nomeCidade of cidades) {
          await db.cidade.create({
            data: {
              nome: nomeCidade,
              uf: estado.sigla
            }
          })
        }
      }
      
      estadosDb = await db.estado.findMany({ orderBy: { nome: 'asc' } })
    }
    
    return NextResponse.json({ estados: estadosDb })
  } catch (error) {
    console.error('Erro ao buscar estados:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estados' },
      { status: 500 }
    )
  }
}
