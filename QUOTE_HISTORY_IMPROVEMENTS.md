# Melhorias no Histórico de Orçamentos

## Problema
Os novos orçamentos estavam sendo gerados corretamente, mas o usuário precisava que eles aparecessem de forma mais visível na seção de histórico de orçamentos.

## Soluções Implementadas

### 1. Scroll Automático
- Após gerar um novo orçamento, a página automaticamente faz scroll até a seção de histórico
- Implementado com `scrollIntoView` com animação suave após 500ms
- Garante que o usuário veja imediatamente o novo orçamento na lista

### 2. Destaque Visual do Novo Orçamento
- O orçamento recém-criado é destacado com fundo verde claro (`bg-green-50`)
- Animação de pulso (`animate-pulse`) para chamar atenção
- O destaque é removido automaticamente após 5 segundos
- Transição suave de cores para uma experiência visual agradável

### 3. Tabela com Scroll Vertical
- Adicionada altura máxima de 384px (`max-h-96`) para a tabela
- Scroll vertical automático quando há muitos orçamentos
- Permite visualizar todos os orçamentos sem ocupar muito espaço na tela

### 4. Cabeçalho Fixo
- O cabeçalho da tabela permanece fixo no topo durante o scroll
- Implementado com `sticky top-0` e `z-10` para garantir visibilidade
- Facilita a identificação das colunas mesmo ao rolar a lista

## Comportamento Atual

1. **Ao gerar um novo orçamento:**
   - O formulário é resetado
   - A lista de orçamentos é recarregada
   - A página faz scroll automático até o histórico
   - O novo orçamento aparece no topo da lista (ordenação por data decrescente)
   - O novo orçamento é destacado visualmente por 5 segundos

2. **Visualização do histórico:**
   - Tabela com altura máxima e scroll vertical
   - Cabeçalho sempre visível durante o scroll
   - Orçamentos mais recentes aparecem primeiro
   - Interface responsiva com scroll horizontal quando necessário

## Notas Técnicas

- Os orçamentos já estavam sendo ordenados corretamente no backend (`order by created_at desc`)
- A função `loadQuotes()` já era chamada após gerar um orçamento
- As melhorias focaram na experiência do usuário e visibilidade dos novos orçamentos