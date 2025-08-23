-- Atualizar pedidos existentes que não têm upholstery_package definido
-- (opcional - apenas se você quiser definir um valor padrão)

UPDATE orders 
SET upholstery_package = 'Standard Package'
WHERE upholstery_package IS NULL OR upholstery_package = '';

-- Ou se preferir deixar em branco:
-- UPDATE orders 
-- SET upholstery_package = ''
-- WHERE upholstery_package IS NULL;
