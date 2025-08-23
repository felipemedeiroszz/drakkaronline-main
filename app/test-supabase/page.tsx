"use client"

import { useState, useEffect } from "react"

interface TestResult {
  status: string
  count: number
  data: any[]
  error?: string
}

interface TestResults {
  connection: boolean
  results: Record<string, TestResult>
  error?: string
}

export default function TestSupabasePage() {
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-database")
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({
        connection: false,
        results: {},
        error: String(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const insertSampleData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/seed-sample-data", { method: "POST" })
      const result = await response.json()

      if (result.ok) {
        alert("✅ Dados de exemplo inseridos com sucesso!")
        await runTests()
      } else {
        alert(`❌ Erro: ${result.message}`)
      }
    } catch (error) {
      alert(`❌ Erro ao inserir dados: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Testando conexão com o banco de dados...</p>
        </div>
      </div>
    )
  }

  const tableLabels: Record<string, string> = {
    engine_packages: "🔧 Pacotes de Motor",
    hull_colors: "🎨 Cores de Casco",
    additional_options: "⚙️ Opções Adicionais",
    boat_models: "🚤 Modelos de Barco",
    dealers: "🏢 Dealers",
    orders: "📋 Pedidos",
    service_requests: "🛠️ Solicitações de Serviço",
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">🔧 Teste do Banco Supabase</h1>
          <p className="text-lg text-gray-600">Verificando se o banco está enviando informações</p>
        </div>

        {/* Status da Conexão */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📡 Status da Conexão</h2>
          <div className="text-xl">{testResults?.connection ? "✅ Conectado" : "❌ Falha na conexão"}</div>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </p>
            <p>
              <strong>Projeto:</strong> supabase-carro-vermelho
            </p>
          </div>
          {testResults?.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">
                <strong>Erro:</strong> {testResults.error}
              </p>
            </div>
          )}
        </div>

        {/* Resultados dos Testes */}
        {testResults?.results && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {Object.entries(testResults.results).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold mb-3">{tableLabels[key] || key}</h3>

                <div className="mb-2">
                  <strong>Status:</strong> {value.status}
                </div>

                <div className="mb-2">
                  <strong>Registros encontrados:</strong> {value.count}
                </div>

                {value.error && (
                  <div className="text-red-600 text-sm mb-2">
                    <strong>Erro:</strong> {value.error}
                  </div>
                )}

                {value.data && value.data.length > 0 && (
                  <div className="mt-3">
                    <strong>Exemplos:</strong>
                    <div className="bg-gray-50 p-2 rounded mt-1 text-sm max-h-32 overflow-y-auto">
                      <pre>{JSON.stringify(value.data, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">🔧 Ações</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={runTests}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              🔄 Testar Novamente
            </button>

            <button
              onClick={insertSampleData}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              📝 Inserir Dados de Exemplo
            </button>

            <a href="/" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 inline-block">
              🏠 Voltar ao Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
