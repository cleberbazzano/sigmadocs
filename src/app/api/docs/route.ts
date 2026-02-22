import { NextRequest, NextResponse } from 'next/server'

// API Documentation
const apiDocs = {
  openapi: '3.0.0',
  info: {
    title: 'Sigma DOCs API',
    version: '1.0.0',
    description: 'API para integração com sistemas externos (ERP, CRM, etc.)',
    contact: {
      name: 'Sigma DOCs Support',
      email: 'suporte@sigmadocs.com.br'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'API Server'
    }
  ],
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    '/documents': {
      get: {
        summary: 'Listar documentos',
        description: 'Retorna lista de documentos com filtros opcionais',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Busca por título ou descrição' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'PENDING', 'SIGNED', 'APPROVED', 'ARCHIVED', 'EXPIRED'] } },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'ID da categoria' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          '200': {
            description: 'Lista de documentos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    documents: {
                      type: 'array',
                      items: { '$ref': '#/components/schemas/Document' }
                    },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/documents/{id}': {
      get: {
        summary: 'Obter documento',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Documento encontrado' },
          '404': { description: 'Documento não encontrado' }
        }
      }
    },
    '/documents/expiring': {
      get: {
        summary: 'Documentos vencendo',
        description: 'Lista documentos próximos do vencimento ou vencidos',
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30 }, description: 'Dias de antecedência' }
        ],
        responses: {
          '200': { description: 'Lista de documentos' }
        }
      }
    },
    '/notifications': {
      get: {
        summary: 'Listar notificações',
        responses: {
          '200': {
            description: 'Lista de notificações',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notifications: {
                      type: 'array',
                      items: { '$ref': '#/components/schemas/Notification' }
                    },
                    unreadCount: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/categories': {
      get: {
        summary: 'Listar categorias',
        responses: {
          '200': { description: 'Lista de categorias' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API Key no formato sk_xxxxx'
      }
    },
    schemas: {
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['DRAFT', 'PENDING', 'SIGNED', 'APPROVED', 'ARCHIVED', 'EXPIRED', 'CANCELLED'] },
          confidentiality: { type: 'string', enum: ['PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL', 'SECRET'] },
          expirationDate: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string', enum: ['info', 'warning', 'error', 'success'] },
          read: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
}

// GET - API Documentation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  if (format === 'openapi') {
    return NextResponse.json(apiDocs)
  }

  // HTML Documentation
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sigma DOCs API - Documentação</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { color: #0f172a; margin-bottom: 1rem; }
    h2 { color: #334155; margin: 2rem 0 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    h3 { color: #475569; margin: 1.5rem 0 0.5rem; }
    .endpoint { background: white; border-radius: 8px; padding: 1rem; margin: 1rem 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .method { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; font-size: 0.875rem; margin-right: 0.5rem; }
    .get { background: #dbeafe; color: #1e40af; }
    .post { background: #dcfce7; color: #166534; }
    .put { background: #fef3c7; color: #92400e; }
    .delete { background: #fee2e2; color: #991b1b; }
    code { background: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875rem; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1rem 0; }
    .auth-box { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 2rem; border-radius: 12px; margin: 2rem 0; }
    .auth-box h2 { color: white; border-color: #475569; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📄 Sigma DOCs API</h1>
    <p>Sistema de Gestão Eletrônica de Documentos - API para integração</p>
    <p>Version: 1.0.0 | <a href="?format=openapi">OpenAPI Spec</a></p>
    
    <div class="auth-box">
      <h2>🔐 Autenticação</h2>
      <p>Todas as requisições devem incluir o header Authorization com a API Key:</p>
      <pre>Authorization: Bearer sk_sua_api_key_aqui</pre>
      <p style="margin-top: 1rem;">Obtenha sua API Key em: <code>Administração → API Keys</code></p>
    </div>
    
    <h2>Endpoints</h2>
    
    <h3>Documentos</h3>
    <div class="endpoint">
      <span class="method get">GET</span> <code>/api/documents</code>
      <p>Lista documentos com filtros opcionais</p>
      <table>
        <tr><th>Parâmetro</th><th>Tipo</th><th>Descrição</th></tr>
        <tr><td>q</td><td>string</td><td>Busca por título ou descrição</td></tr>
        <tr><td>status</td><td>string</td><td>Filtrar por status</td></tr>
        <tr><td>limit</td><td>integer</td><td>Limite de resultados (padrão: 50)</td></tr>
      </table>
    </div>
    
    <div class="endpoint">
      <span class="method get">GET</span> <code>/api/documents/{id}</code>
      <p>Obtém detalhes de um documento específico</p>
    </div>
    
    <div class="endpoint">
      <span class="method get">GET</span> <code>/api/documents/expiring</code>
      <p>Lista documentos próximos do vencimento ou vencidos</p>
    </div>
    
    <h3>Notificações</h3>
    <div class="endpoint">
      <span class="method get">GET</span> <code>/api/notifications</code>
      <p>Lista notificações do usuário autenticado</p>
    </div>
    
    <h3>Categorias</h3>
    <div class="endpoint">
      <span class="method get">GET</span> <code>/api/categories</code>
      <p>Lista todas as categorias de documentos</p>
    </div>
    
    <h2>Códigos de Erro</h2>
    <table>
      <tr><th>Código</th><th>Descrição</th></tr>
      <tr><td>400</td><td>Requisição inválida</td></tr>
      <tr><td>401</td><td>Não autenticado</td></tr>
      <tr><td>403</td><td>Sem permissão</td></tr>
      <tr><td>404</td><td>Recurso não encontrado</td></tr>
      <tr><td>429</td><td>Rate limit excedido</td></tr>
      <tr><td>500</td><td>Erro interno</td></tr>
    </table>
    
    <h2>Rate Limiting</h2>
    <p>Por padrão, cada API Key tem limite de <strong>1000 requisições por hora</strong>.</p>
  </div>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
