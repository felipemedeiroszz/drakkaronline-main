-- Adiciona 'upholstery_package' ao item_type da dealer_pricing -----------------

-- 1. Remover a restrição atual
ALTER TABLE public.dealer_pricing
  DROP CONSTRAINT IF EXISTS dealer_pricing_item_type_check;

-- 2. Criar nova restrição com a lista atualizada
ALTER TABLE public.dealer_pricing
  ADD CONSTRAINT dealer_pricing_item_type_check
  CHECK (
    item_type IN (
      'boat_model',
      'engine_package',
      'hull_color',
      'upholstery_package',   -- ← novo tipo
      'additional_option'
    )
  );

-- 3. Verificação
SELECT 'Restrição atualizada! item_type agora aceita upholstery_package.' AS status;
