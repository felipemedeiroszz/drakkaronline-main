import DatabaseTest from "@/components/database-test"

export default function TestDatabasePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">🔧 Teste do Banco de Dados Supabase</h1>
          <p className="text-lg text-gray-600">
            Esta página verifica se a conexão com o Supabase está funcionando corretamente.
          </p>
        </div>

        <DatabaseTest />

        <div className="mt-10 text-center">
          <a href="/" className="text-blue-900 font-semibold hover:underline">
            ← Voltar ao Portal Principal
          </a>
        </div>
      </div>
    </div>
  )
}
