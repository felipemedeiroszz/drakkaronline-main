"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface ConnectionStatus {
  isConnected: boolean
  databaseName: string | null
  error: string | null
  tables: string[]
  tablesExist: boolean
}

export default function SupabaseConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    databaseName: null,
    error: null,
    tables: [],
    tablesExist: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setIsLoading(true)
    try {
      console.log("🔍 Testando conexão com Supabase...")
      console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)

      // Testar se as tabelas principais existem
      const requiredTables = [
        "engine_packages",
        "hull_colors",
        "additional_options",
        "boat_models",
        "dealers",
        "orders",
        "service_requests",
      ]
      const existingTables = []

      for (const tableName of requiredTables) {
        try {
          const { data, error } = await supabase.from(tableName).select("*").limit(1)
          if (!error) {
            existingTables.push(tableName)
            console.log(`✅ Tabela ${tableName} existe`)
          } else if (error.code === "42P01") {
            console.log(`❌ Tabela ${tableName} não existe`)
          }
        } catch (err) {
          console.log(`⚠️ Erro ao verificar tabela ${tableName}:`, err)
        }
      }

      const allTablesExist = existingTables.length === requiredTables.length

      setStatus({
        isConnected: true,
        databaseName: "supabase-carro-vermelho",
        error: null,
        tables: existingTables,
        tablesExist: allTablesExist,
      })

      console.log("✅ Conexão estabelecida com sucesso!")
      console.log(`📊 Tabelas encontradas: ${existingTables.length}/${requiredTables.length}`)
    } catch (error) {
      console.error("❌ Erro inesperado:", error)
      setStatus({
        isConnected: false,
        databaseName: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        tables: [],
        tablesExist: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkTableData = async () => {
    try {
      setIsLoading(true)
      console.log("📊 Verificando dados nas tabelas...")

      const tableData = {}
      for (const tableName of status.tables) {
        try {
          const { data, error } = await supabase.from(tableName).select("*")
          if (!error) {
            tableData[tableName] = data?.length || 0
          }
        } catch (err) {
          console.error(`Erro ao contar registros em ${tableName}:`, err)
        }
      }

      let message = "📊 Dados nas tabelas:\n"
      for (const [table, count] of Object.entries(tableData)) {
        message += `• ${table}: ${count} registros\n`
      }

      alert(message)
    } catch (error) {
      console.error("❌ Erro ao verificar dados:", error)
      alert("Erro ao verificar dados das tabelas.")
    } finally {
      setIsLoading(false)
    }
  }

  const insertSampleData = async () => {
    try {
      setIsLoading(true)
      console.log("🔑 Enviando seed para o servidor...")

      const res = await fetch("/api/seed-sample-data", { method: "POST" })
      const json = await res.json()

      if (!json.ok) {
        alert(`Erro ao inserir dados: ${json.message || "desconhecido"}`)
        console.error(json)
      } else {
        alert("✅ Dados de exemplo inseridos com sucesso!")
        // Recarregar para mostrar as tabelas atualizadas
        await testConnection()
      }
    } catch (error) {
      console.error("❌ Erro ao inserir dados:", error)
      alert("Erro ao inserir dados. Veja o console.")
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllData = async () => {
    if (!confirm("⚠️ Tem certeza que deseja limpar TODOS os dados das tabelas? Esta ação não pode ser desfeita!")) {
      return
    }

    try {
      setIsLoading(true)
      console.log("🗑️ Limpando dados...")

      const res = await fetch("/api/clear-data", { method: "POST" })
      const json = await res.json()

      if (!json.ok) {
        alert(`Erro ao limpar dados: ${json.message || "desconhecido"}`)
      } else {
        alert("✅ Todos os dados foram removidos!")
        await testConnection()
      }
    } catch (error) {
      console.error("❌ Erro ao limpar dados:", error)
      alert("Erro ao limpar dados.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Testando conexão com Supabase...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">🔗 Conexão com Supabase - Carro Vermelho</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Status da Conexão</h3>
          <div className="flex items-center">
            {status.isConnected ? (
              <span className="text-green-600 flex items-center">✅ Conectado</span>
            ) : (
              <span className="text-red-600 flex items-center">❌ Desconectado</span>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Tabelas</h3>
          <div className="flex items-center">
            {status.tablesExist ? (
              <span className="text-green-600 flex items-center">✅ Todas criadas ({status.tables.length}/7)</span>
            ) : (
              <span className="text-yellow-600 flex items-center">⚠️ Incompletas ({status.tables.length}/7)</span>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Banco de Dados</h3>
          <p className="text-sm text-gray-600">{status.databaseName || "Não identificado"}</p>
        </div>
      </div>

      {status.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Erro de Conexão</h3>
          <p className="text-red-600 text-sm">{status.error}</p>
        </div>
      )}

      {status.tablesExist && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">🎉 Banco Configurado!</h3>
          <p className="text-green-700 text-sm">
            Todas as tabelas necessárias já existem no seu banco Supabase. Você pode inserir dados de exemplo ou
            verificar os dados existentes.
          </p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Tabelas Encontradas ({status.tables.length})</h3>
        {status.tables.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {status.tables.map((table, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {table}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nenhuma tabela encontrada.</p>
        )}
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          🔄 Testar Conexão
        </button>

        <button
          onClick={checkTableData}
          disabled={isLoading || !status.tablesExist}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          📊 Verificar Dados
        </button>

        <button
          onClick={insertSampleData}
          disabled={isLoading || !status.tablesExist}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          📝 Inserir Dados de Exemplo
        </button>

        <button
          onClick={clearAllData}
          disabled={isLoading || !status.tablesExist}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          🗑️ Limpar Dados
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p>Projeto: supabase-carro-vermelho</p>
      </div>

      {!status.tablesExist && status.tables.length < 7 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Tabelas Faltando</h3>
          <p className="text-sm text-yellow-700 mb-2">
            Algumas tabelas ainda não foram criadas. As tabelas que faltam são necessárias para o funcionamento completo
            do sistema.
          </p>
          <p className="text-sm text-yellow-700">
            <strong>Tabelas necessárias:</strong> engine_packages, hull_colors, additional_options, boat_models,
            dealers, orders, service_requests
          </p>
        </div>
      )}
    </div>
  )
}
