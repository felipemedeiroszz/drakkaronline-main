# Portal ATT - RENDER Deployment

Este projeto foi migrado do Vercel para o **RENDER** com integração completa do **Uploadcare** para upload de imagens.

## 🚀 Deploy no RENDER

### 1. Preparação
Certifique-se de que você tem:
- Conta no [RENDER](https://render.com)
- Credenciais do Uploadcare configuradas
- Credenciais do Supabase (banco de dados)

### 2. Configuração das Variáveis de Ambiente

No painel do RENDER, configure as seguintes variáveis de ambiente:

#### Uploadcare (já configurado)
```
NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY=283e132f34f9b2d44934
```

#### Supabase (configure com suas credenciais)
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase
```

### 3. Deploy

1. Conecte seu repositório GitHub ao RENDER
2. Configure o serviço como "Web Service"
3. Use os seguintes comandos:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Configure as variáveis de ambiente listadas acima
5. Faça o deploy!

## 🔧 Alterações Realizadas

### ✅ Migração Completa
- ❌ Removido `@vercel/blob` 
- ✅ Adicionado `@uploadcare/upload-client` para upload de imagens
- ✅ Criado `/api/upload-image` com integração Uploadcare
- ✅ Atualizadas todas as URLs de imagem hardcoded
- ✅ Removidas referências ao Vercel
- ✅ Criado `render.yaml` para configuração automática
- ✅ Configurado `next.config.mjs` para RENDER

### 📁 Arquivos Principais Modificados
- `package.json` - Dependências atualizadas
- `app/api/upload-image/route.ts` - Nova implementação Uploadcare
- `next.config.mjs` - Configuração para RENDER
- `render.yaml` - Configuração de deploy
- `.env.local` - Variáveis de ambiente
- `components/deployment-checklist.tsx` - Links atualizados

### 🌟 Funcionalidades
- Upload de imagens via Uploadcare
- Interface administrativa completa
- Dashboard de dealers
- Sistema de pós-venda
- Produção de fábrica
- Gestão de inventário

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## 📚 Tecnologias

- **Framework**: Next.js 14
- **UI**: Radix UI + Tailwind CSS
- **Banco de Dados**: Supabase
- **Upload de Imagens**: Uploadcare
- **Deploy**: RENDER
- **Linguagem**: TypeScript

## 🔗 Links Úteis

- [Dashboard RENDER](https://dashboard.render.com/)
- [Documentação Uploadcare](https://uploadcare.com/docs/)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Next.js](https://nextjs.org/docs)

---

**Status**: ✅ Pronto para deploy no RENDER