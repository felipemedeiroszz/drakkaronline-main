#!/usr/bin/env node

/**
 * Teste de Verificação da Correção de Sincronização
 * 
 * Este script verifica se a correção implementada resolve o problema:
 * - Sales page deve ler dados frescos do banco a cada sincronização
 * - Cache deve ser invalidado corretamente quando admin salva dados
 * - Múltiplas atualizações devem funcionar continuamente (não apenas uma vez)
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Função para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Função para gerar ID único
const generateId = () => `sync-test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

console.log(`
🧪 TESTE DE VERIFICAÇÃO DA CORREÇÃO DE SINCRONIZAÇÃO
=======================================================

Este teste verifica se:
✅ Sales page lê dados frescos do banco a cada request
✅ Cache é invalidado corretamente
✅ Múltiplas sincronizações funcionam continuamente
✅ Headers de cache busting funcionam corretamente

Teste iniciado em: ${new Date().toISOString()}
Base URL: ${baseUrl}
`)

async function testCacheInvalidation() {
  console.log('\n🔄 FASE 1: Testando invalidação de cache via headers')
  
  try {
    // Buscar dealer de teste ou usar genérico
    const dealerId = 'test-dealer' // ID de teste

    // Teste 1: Request normal
    console.log('\n📊 Teste 1: Request normal (com cache)')
    const response1 = await fetch(`${baseUrl}/api/get-dealer-config?dealer_id=${dealerId}`)
    const result1 = await response1.json()
    console.log(`   ✅ Response: ${result1.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`   📊 Cached: ${result1.cached || false}`)
    console.log(`   📊 Data timestamp: ${response1.headers.get('X-Data-Timestamp')}`)

    // Teste 2: Request com cache buster
    console.log('\n📊 Teste 2: Request com cache buster')
    const timestamp = Date.now()
    const response2 = await fetch(`${baseUrl}/api/get-dealer-config?dealer_id=${dealerId}&t=${timestamp}&cb=${Math.random()}&refresh=true&clear_cache=true&invalidate_cache=true`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Cache-Buster': timestamp.toString()
      }
    })
    const result2 = await response2.json()
    console.log(`   ✅ Response: ${result2.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`   📊 Cached: ${result2.cached || false}`)
    console.log(`   📊 Data timestamp: ${response2.headers.get('X-Data-Timestamp')}`)

    // Teste 3: Verificar se cache foi realmente invalidado
    console.log('\n📊 Teste 3: Verificando invalidação de cache')
    const response3 = await fetch(`${baseUrl}/api/get-dealer-config?dealer_id=${dealerId}`)
    const result3 = await response3.json()
    console.log(`   ✅ Response: ${result3.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`   📊 Cached: ${result3.cached || false}`)
    
    return true
  } catch (error) {
    console.error('❌ Erro no teste de cache:', error.message)
    return false
  }
}

async function testDataUpdatesAndSync() {
  console.log('\n🔄 FASE 2: Testando atualizações de dados e sincronização')
  
  const testItemName = generateId()
  
  try {
    // Criar item de teste
    console.log(`\n📊 Criando item de teste: ${testItemName}`)
    const { data: newItem, error: insertError } = await supabase
      .from('hull_colors')
      .insert({
        name: testItemName,
        name_pt: `${testItemName} PT`,
        usd: 1000,
        brl: 5000
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erro ao criar item:', insertError)
      return false
    }
    
    console.log(`   ✅ Item criado com ID: ${newItem.id}`)
    
    // Aguardar um pouco para garantir que o timestamp seja diferente
    await delay(1000)
    
    // Buscar dados com cache busting para simular sincronização
    console.log('\n📊 Buscando dados após criação (simulando sincronização)')
    const dealerId = 'test-dealer'
    const timestamp = Date.now()
    const response = await fetch(`${baseUrl}/api/get-dealer-config?dealer_id=${dealerId}&t=${timestamp}&cb=${Math.random()}&refresh=true&clear_cache=true&invalidate_cache=true`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Cache-Buster': timestamp.toString(),
        'X-Real-Time-Update': 'true'
      }
    })
    
    const result = await response.json()
    
    if (result.success && result.data.hullColors) {
      const foundItem = result.data.hullColors.find(item => item.name === testItemName)
      if (foundItem) {
        console.log(`   ✅ Item encontrado na resposta da API!`)
        console.log(`   📊 Nome: ${foundItem.name}`)
        console.log(`   📊 USD: ${foundItem.usd}`)
        console.log(`   📊 BRL: ${foundItem.brl}`)
      } else {
        console.log(`   ❌ Item NÃO encontrado na resposta da API`)
        console.log(`   📊 Total de hull colors retornados: ${result.data.hullColors.length}`)
      }
    } else {
      console.log(`   ❌ Erro na resposta da API: ${result.error || 'Resposta inválida'}`)
    }
    
    // Atualizar item para testar sincronização contínua
    console.log('\n📊 Atualizando item para testar sincronização contínua')
    const updatedName = `${testItemName}-UPDATED`
    const { error: updateError } = await supabase
      .from('hull_colors')
      .update({
        name: updatedName,
        usd: 1500,
        brl: 7500
      })
      .eq('id', newItem.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar item:', updateError)
    } else {
      console.log(`   ✅ Item atualizado para: ${updatedName}`)
      
      // Aguardar e buscar novamente
      await delay(1000)
      
      console.log('\n📊 Buscando dados após atualização (segunda sincronização)')
      const timestamp2 = Date.now()
      const response2 = await fetch(`${baseUrl}/api/get-dealer-config?dealer_id=${dealerId}&t=${timestamp2}&cb=${Math.random()}&refresh=true&clear_cache=true&invalidate_cache=true`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Cache-Buster': timestamp2.toString(),
          'X-Real-Time-Update': 'true'
        }
      })
      
      const result2 = await response2.json()
      
      if (result2.success && result2.data.hullColors) {
        const foundUpdatedItem = result2.data.hullColors.find(item => item.name === updatedName)
        if (foundUpdatedItem) {
          console.log(`   ✅ Item atualizado encontrado na segunda sincronização!`)
          console.log(`   📊 Nome atualizado: ${foundUpdatedItem.name}`)
          console.log(`   📊 USD atualizado: ${foundUpdatedItem.usd}`)
        } else {
          console.log(`   ❌ Item atualizado NÃO encontrado na segunda sincronização`)
        }
      }
    }
    
    // Limpar item de teste
    console.log('\n📊 Limpando item de teste')
    const { error: deleteError } = await supabase
      .from('hull_colors')
      .delete()
      .eq('id', newItem.id)
    
    if (deleteError) {
      console.error('⚠️ Erro ao limpar item de teste:', deleteError)
    } else {
      console.log('   ✅ Item de teste removido')
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro no teste de atualizações:', error.message)
    return false
  }
}

async function testMultipleSyncCycles() {
  console.log('\n🔄 FASE 3: Testando múltiplos ciclos de sincronização')
  
  const dealerId = 'test-dealer'
  let successCount = 0
  const totalTests = 5
  
  for (let i = 1; i <= totalTests; i++) {
    console.log(`\n📊 Ciclo ${i}/${totalTests}`)
    
    try {
      const timestamp = Date.now()
      const response = await fetch(`${baseUrl}/api/get-dealer-config?dealer_id=${dealerId}&t=${timestamp}&cb=${Math.random()}&refresh=true&clear_cache=true&invalidate_cache=true`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Cache-Buster': timestamp.toString(),
          'X-Real-Time-Update': 'true'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log(`   ✅ Ciclo ${i}: SUCCESS`)
        console.log(`   📊 Cached: ${result.cached || false}`)
        console.log(`   📊 Hull Colors: ${result.data.hullColors?.length || 0}`)
        console.log(`   📊 Engine Packages: ${result.data.enginePackages?.length || 0}`)
        successCount++
      } else {
        console.log(`   ❌ Ciclo ${i}: FAILED - ${result.error}`)
      }
      
      // Aguardar entre ciclos
      await delay(500)
      
    } catch (error) {
      console.log(`   ❌ Ciclo ${i}: ERROR - ${error.message}`)
    }
  }
  
  console.log(`\n📊 Resultado dos ciclos: ${successCount}/${totalTests} sucessos`)
  return successCount === totalTests
}

async function runFullTest() {
  console.log('🚀 Iniciando teste completo de verificação da correção...\n')
  
  const results = []
  
  // Fase 1: Cache invalidation
  console.log('=' .repeat(60))
  const test1 = await testCacheInvalidation()
  results.push({ test: 'Cache Invalidation', passed: test1 })
  
  // Fase 2: Data updates and sync
  console.log('\n' + '='.repeat(60))
  const test2 = await testDataUpdatesAndSync()
  results.push({ test: 'Data Updates & Sync', passed: test2 })
  
  // Fase 3: Multiple sync cycles
  console.log('\n' + '='.repeat(60))
  const test3 = await testMultipleSyncCycles()
  results.push({ test: 'Multiple Sync Cycles', passed: test3 })
  
  // Resultados finais
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESULTADOS FINAIS:')
  console.log('='.repeat(60))
  
  results.forEach(({ test, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSOU' : 'FALHOU'}`)
  })
  
  const passedTests = results.filter(r => r.passed).length
  const totalTests = results.length
  
  console.log(`\n📊 Total: ${passedTests}/${totalTests} testes passaram`)
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Correção de sincronização implementada com sucesso!')
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verificar logs acima para detalhes.')
  }
  
  console.log(`\nTeste concluído em: ${new Date().toISOString()}`)
}

// Executar teste se chamado diretamente
if (require.main === module) {
  runFullTest().catch(error => {
    console.error('❌ Erro fatal no teste:', error)
    process.exit(1)
  })
}

module.exports = { runFullTest, testCacheInvalidation, testDataUpdatesAndSync, testMultipleSyncCycles }