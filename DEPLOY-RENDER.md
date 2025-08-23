# 🚀 Guia de Deploy no RENDER

## Pré-requisitos
- Conta no GitHub
- Conta no [RENDER](https://render.com)
- Credenciais do Supabase

## Passo a Passo

### 1. Preparar o Repositório
```bash
# O projeto já está pronto para RENDER!
# Apenas faça push para o GitHub se ainda não fez
git add .
git commit -m "Migração completa para RENDER com Uploadcare"
git push origin main
```

### 2. Configurar no RENDER

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `portalatt`
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)` ou mais próximo
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 3. Variáveis de Ambiente

Na seção "Environment", adicione:

#### ✅ Uploadcare (já configurado)
```
NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY=283e132f34f9b2d44934
```

#### ⚠️ Supabase (adicione suas credenciais)
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_supabase_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico_supabase_aqui
```

#### 🔧 Node.js
```
NODE_ENV=production
```

### 4. Deploy

1. Clique em "Create Web Service"
2. O RENDER iniciará o build automaticamente
3. Aguarde alguns minutos
4. Seu app estará disponível em: `https://portalatt.onrender.com`

## 🔍 Verificação

Após o deploy, teste:

1. **Upload de Imagens**: Teste na área administrativa
2. **Conexão Supabase**: Verifique `/test-database`
3. **Funcionalidades**: Dashboard de dealers, pós-venda, etc.

## 🐛 Solução de Problemas

### Build falha
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que `NEXT_PUBLIC_SUPABASE_URL` está preenchida

### Upload de imagens não funciona
- Verifique as credenciais do Uploadcare
- Confirme que `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` está correto

### Erro de banco de dados
- Verifique as credenciais do Supabase
- Confirme que o Supabase está ativo

## 📱 Configuração de Domínio Customizado

1. Na dashboard do RENDER, vá para "Settings"
2. Clique em "Custom Domains"
3. Adicione seu domínio
4. Configure os DNS conforme instruções

## 💡 Dicas

- **Auto-Deploy**: RENDER faz deploy automático a cada push no GitHub
- **Logs**: Acesse logs em tempo real na dashboard
- **SSL**: HTTPS automático para todos os deployments
- **Escalabilidade**: Upgrade do plano conforme necessário

---

✅ **Projeto pronto para RENDER!**
🔧 **Uploadcare configurado!**
🚀 **Deploy em poucos cliques!**