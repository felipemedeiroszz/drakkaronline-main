-- Tabela completa (atualizada) – útil em novos ambientes
CREATE TABLE IF NOT EXISTS public.dealer_pricing (
  id               SERIAL PRIMARY KEY,
  dealer_id        TEXT NOT NULL,
  item_type        TEXT NOT NULL CHECK (item_type IN ('boat_model','engine_package','hull_color','upholstery_package','additional_option')),
  item_id          TEXT         NOT NULL,               -- ← agora TEXT
  item_name        TEXT NOT NULL,
  sale_price_usd   DECIMAL(10,2) DEFAULT 0 NOT NULL,
  sale_price_brl   DECIMAL(10,2) DEFAULT 0 NOT NULL,
  margin_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
  created_at       TIMESTAMP  DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at       TIMESTAMP  DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE (dealer_id, item_type, item_id)                -- evita duplicidade
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dealer_pricing_dealer_id ON public.dealer_pricing(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_pricing_item_type ON public.dealer_pricing(item_type);
CREATE INDEX IF NOT EXISTS idx_dealer_pricing_item_id ON public.dealer_pricing(item_id);

-- Comentários para documentação
COMMENT ON TABLE public.dealer_pricing IS 'Preços de venda específicos configurados por cada dealer';
COMMENT ON COLUMN public.dealer_pricing.item_id IS 'Identificador do item (pode ser UUID, número ou texto)';
COMMENT ON COLUMN public.dealer_pricing.sale_price_usd IS 'Preço de venda em USD configurado pelo dealer';
COMMENT ON COLUMN public.dealer_pricing.sale_price_brl IS 'Preço de venda em BRL configurado pelo dealer';
COMMENT ON COLUMN public.dealer_pricing.margin_percentage IS 'Margem de lucro do dealer sobre o preço de custo';

-- Verificar se a tabela foi criada corretamente
SELECT 'Tabela dealer_pricing criada com sucesso' as status;
