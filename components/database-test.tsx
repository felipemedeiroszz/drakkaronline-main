"use client"

import { useState, useEffect } from "react"
import { DatabaseService } from "@/lib/database-service"

export default function DatabaseTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    setIsLoading(true)
    addResult("🔄 Testando conexão com Supabase...")

    try {
      const connected = await DatabaseService.testConnection()
      setIsConnected(connected)

      if (connected) {
        addResult("✅ Conexão estabelecida com sucesso!")
        await runFullTests()
      } else {
        addResult("❌ Falha na conexão")
      }
    } catch (error) {
      addResult(`❌ Erro: ${error}`)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const runFullTests = async () => {
    try {
      // Testar busca de dados
      addResult("🔄 Testando busca de pacotes de motor...")
      const engines = await DatabaseService.getEnginePackages()
      addResult(`✅ Encontrados ${engines.length} pacotes de motor`)

      addResult("🔄 Testando busca de cores de casco...")
      const colors = await DatabaseService.getHullColors()
      addResult(`✅ Encontradas ${colors.length} cores de casco`)

      addResult("🔄 Testando busca de opções adicionais...")
      const options = await DatabaseService.getAdditionalOptions()
      addResult(`✅ Encontradas ${options.length} opções adicionais`)

      addResult("🔄 Testando busca de modelos de barco...")
      const models = await DatabaseService.getBoatModels()
      addResult(`✅ Encontrados ${models.length} modelos de barco`)

      addResult("🔄 Testando busca de dealers...")
      const dealers = await DatabaseService.getDealers()
      addResult(`✅ Encontrados ${dealers.length} dealers`)

      addResult("🔄 Testando busca de pedidos...")
      const orders = await DatabaseService.getOrders()
      addResult(`✅ Encontrados ${orders.length} pedidos`)

      addResult("🔄 Testando busca de solicitações de serviço...")
      const serviceRequests = await DatabaseService.getServiceRequests()
      addResult(`✅ Encontradas ${serviceRequests.length} solicitações de serviço`)

      addResult("🎉 Todos os testes passaram! Banco de dados funcionando perfeitamente.")
    } catch (error) {
      addResult(`❌ Erro durante os testes: ${error}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
    setIsConnected(null)
  }

  useEffect(() => {
    // Testar automaticamente ao carregar
    testConnection()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">🔧 Teste de Conexão com Supabase</h2>

      <div className="flex gap-4 mb-6">
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "🔄 Testando..." : "🔄 Testar Conexão"}
        </button>

        <button onClick={clearResults} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          🗑️ Limpar Resultados
        </button>
      </div>

      {/* Status da Conexão */}
      <div className="mb-6">
        <div
          className={`p-4 rounded-lg ${
            isConnected === null
              ? "bg-gray-100"
              : isConnected
                ? "bg-green-100 border border-green-300"
                : "bg-red-100 border border-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected === null ? "bg-gray-400" : isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="font-semibold">
              Status: {isConnected === null ? "Aguardando teste..." : isConnected ? "Conectado ✅" : "Desconectado ❌"}
            </span>
          </div>
        </div>
      </div>

      {/* Resultados dos Testes */}
      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-3">📋 Log de Testes:</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500 italic">Nenhum teste executado ainda...</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações de Configuração */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações de Configuração:</h3>
        <div className="text-sm space-y-1">
          <p>
            <strong>Supabase URL:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configurado" : "❌ Não configurado"}
          </p>
          <p>
            <strong>Supabase Anon Key:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Configurado" : "❌ Não configurado"}
          </p>
        </div>
      </div>
    </div>
  )
}
