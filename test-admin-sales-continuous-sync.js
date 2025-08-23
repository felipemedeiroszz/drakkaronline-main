#!/usr/bin/env node

/**
 * Teste de Sincronização Contínua Admin → Sales
 * 
 * Este script testa se o problema de sincronização foi resolvido:
 * - Admin cria/atualiza Engine Packages, Hull Colors, Upholstery Packages, Additional Options, Boat Models
 * - Sales página deve atualizar automaticamente MÚLTIPLAS VEZES (não apenas uma vez)
 * - Teste deve validar sincronização contínua sem necessidade de redeploy
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Função para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Dados de teste
const testData = {
  enginePackages: [
    { name: 'Test Engine Package 1', name_pt: 'Pacote Motor Teste 1', usd: 5000, brl: 25000 },
    { name: 'Test Engine Package 2', name_pt: 'Pacote Motor Teste 2', usd: 7000, brl: 35000 }
  ],
  hullColors: [
    { name: 'Test Hull Color 1', name_pt: 'Cor Casco Teste 1', usd: 1000, brl: 5000 },
    { name: 'Test Hull Color 2', name_pt: 'Cor Casco Teste 2', usd: 1500, brl: 7500 }
  ],
  upholsteryPackages: [
    { name: 'Test Upholstery 1', name_pt: 'Estofamento Teste 1', usd: 2000, brl: 10000 },
    { name: 'Test Upholstery 2', name_pt: 'Estofamento Teste 2', usd: 3000, brl: 15000 }
  ],
  additionalOptions: [
    { name: 'Test Option 1', name_pt: 'Opção Teste 1', usd: 500, brl: 2500 },
    { name: 'Test Option 2', name_pt: 'Opção Teste 2', usd: 800, brl: 4000 }
  ],
  boatModels: [
    { name: 'Test Boat Model 1', name_pt: 'Modelo Barco Teste 1', usd: 50000, brl: 250000 },
    { name: 'Test Boat Model 2', name_pt: 'Modelo Barco Teste 2', usd: 75000, brl: 375000 }
  ]
}

async function cleanupTestData() {
  console.log('🧹 Limpando dados de teste existentes...')
  
  const tables = ['engine_packages', 'hull_colors', 'upholstery_packages', 'additional_options', 'boat_models']
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .like('name', 'Test %')
      
      if (error) {
        console.warn(`⚠️ Erro ao limpar ${table}:`, error.message)
      } else {
        console.log(`✅ ${table} limpo`)
      }
    } catch (err) {
      console.warn(`⚠️ Erro ao limpar ${table}:`, err.message)
    }
  }
}

async function insertTestData(tableName, data, dataTypeName) {
  console.log(`📝 Inserindo dados de teste em ${tableName} (${dataTypeName})...`)
  
  try {
    const { data: insertedData, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
    
    if (error) {
      console.error(`❌ Erro ao inserir em ${tableName}:`, error)
      return []
    }
    
    console.log(`✅ ${insertedData.length} itens inseridos em ${tableName}`)
    return insertedData
  } catch (err) {
    console.error(`❌ Erro ao inserir em ${tableName}:`, err.message)
    return []
  }
}

async function updateTestData(tableName, id, updates, dataTypeName) {
  console.log(`📝 Atualizando ${dataTypeName} ID ${id} em ${tableName}...`)
  
  try {
    const { data: updatedData, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) {
      console.error(`❌ Erro ao atualizar ${tableName}:`, error)
      return null
    }
    
    console.log(`✅ Item atualizado em ${tableName}:`, updatedData[0])
    return updatedData[0]
  } catch (err) {
    console.error(`❌ Erro ao atualizar ${tableName}:`, err.message)
    return null
  }
}

async function testContinuousSync() {
  console.log('\n🚀 INICIANDO TESTE DE SINCRONIZAÇÃO CONTÍNUA ADMIN → SALES')
  console.log('=' .repeat(70))
  
  // Fase 1: Limpeza
  await cleanupTestData()
  await delay(2000)
  
  // Fase 2: Primeira inserção (deve sincronizar)
  console.log('\n📋 FASE 1: Primeira inserção de dados')
  console.log('-' .repeat(50))
  
  const insertedEngines = await insertTestData('engine_packages', testData.enginePackages, 'Engine Packages')
  await delay(3000)
  
  const insertedHulls = await insertTestData('hull_colors', testData.hullColors, 'Hull Colors')
  await delay(3000)
  
  const insertedUpholstery = await insertTestData('upholstery_packages', testData.upholsteryPackages, 'Upholstery Packages')
  await delay(3000)
  
  const insertedOptions = await insertTestData('additional_options', testData.additionalOptions, 'Additional Options')
  await delay(3000)
  
  const insertedBoats = await insertTestData('boat_models', testData.boatModels, 'Boat Models')
  await delay(3000)
  
  // Fase 3: Segunda atualização (TESTE CRÍTICO - deve sincronizar novamente)
  console.log('\n📋 FASE 2: Segunda atualização (TESTE CRÍTICO)')
  console.log('-' .repeat(50))
  console.log('🎯 Esta fase testa se a sincronização continua funcionando após a primeira vez')
  
  if (insertedEngines.length > 0) {
    await updateTestData('engine_packages', insertedEngines[0].id, {
      name: 'Updated Test Engine Package 1',
      usd: 5500,
      brl: 27500
    }, 'Engine Package')
    await delay(4000)
  }
  
  if (insertedHulls.length > 0) {
    await updateTestData('hull_colors', insertedHulls[0].id, {
      name: 'Updated Test Hull Color 1',
      usd: 1200,
      brl: 6000
    }, 'Hull Color')
    await delay(4000)
  }
  
  if (insertedUpholstery.length > 0) {
    await updateTestData('upholstery_packages', insertedUpholstery[0].id, {
      name: 'Updated Test Upholstery 1',
      usd: 2500,
      brl: 12500
    }, 'Upholstery Package')
    await delay(4000)
  }
  
  // Fase 4: Terceira atualização (TESTE FINAL - deve ainda sincronizar)
  console.log('\n📋 FASE 3: Terceira atualização (TESTE FINAL)')
  console.log('-' .repeat(50))
  console.log('🎯 Esta fase confirma que a sincronização é verdadeiramente contínua')
  
  if (insertedOptions.length > 0) {
    await updateTestData('additional_options', insertedOptions[0].id, {
      name: 'Final Updated Test Option 1',
      usd: 600,
      brl: 3000
    }, 'Additional Option')
    await delay(4000)
  }
  
  if (insertedBoats.length > 0) {
    await updateTestData('boat_models', insertedBoats[0].id, {
      name: 'Final Updated Test Boat Model 1',
      usd: 55000,
      brl: 275000
    }, 'Boat Model')
    await delay(4000)
  }
  
  // Fase 5: Inserção final para testar mix de operações
  console.log('\n📋 FASE 4: Inserção final (mix de operações)')
  console.log('-' .repeat(50))
  
  await insertTestData('engine_packages', [{
    name: 'Final Test Engine Package',
    name_pt: 'Pacote Motor Final',
    usd: 8000,
    brl: 40000
  }], 'Engine Package')
  
  await delay(3000)
  
  console.log('\n✅ TESTE DE SINCRONIZAÇÃO CONTÍNUA CONCLUÍDO')
  console.log('=' .repeat(70))
  console.log('📊 RESULTADOS ESPERADOS:')
  console.log('  ✅ Sales página deve ter atualizado MÚLTIPLAS VEZES')
  console.log('  ✅ Cada fase deve ter sido sincronizada automaticamente')
  console.log('  ✅ Não deve ser necessário refresh manual ou redeploy')
  console.log('  ✅ Logs do console devem mostrar eventos de sincronização')
  console.log('\n📋 VERIFICAÇÃO MANUAL:')
  console.log('  1. Abra a aba SALES no painel dealer')
  console.log('  2. Monitore os logs do console do navegador')
  console.log('  3. Verifique se os dados aparecem automaticamente')
  console.log('  4. Confirme que todas as 4 fases foram sincronizadas')
  
  // Limpeza final (opcional)
  console.log('\n🧹 Aguardando 10 segundos antes da limpeza final...')
  await delay(10000)
  
  console.log('🧹 Limpando dados de teste...')
  await cleanupTestData()
  
  console.log('\n✅ TESTE FINALIZADO - Verifique os resultados na interface!')
}

// Executar teste
testContinuousSync().catch(error => {
  console.error('❌ Erro durante o teste:', error)
  process.exit(1)
})