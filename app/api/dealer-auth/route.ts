import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService, type Dealer } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const { email, password, lang } = await request.json()

    if (!email || !password || !lang) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, senha e idioma são obrigatórios",
        },
        { status: 400 },
      )
    }

    const dealer: Dealer | null = await DatabaseService.authenticateDealer(email, password)
    
    console.log("Debug - Authenticated dealer:", dealer ? { id: dealer.id, name: dealer.name, idType: typeof dealer.id } : null)

    if (dealer) {
      const langToCountry: { [key: string]: string[] } = {
        pt: ["Brazil"],
        en: ["USA", "Australia"],
        es: ["Spain"],
      }

      const allowedCountries = langToCountry[lang as keyof typeof langToCountry] || []

      // Se o dealer tem country "All", pode acessar qualquer portal
      if (dealer.country === "All" || (dealer.country && allowedCountries.includes(dealer.country))) {
        const dealerResponse = {
          id: dealer.id,
          name: dealer.name,
          email: dealer.email,
        }
        
        console.log("Debug - Sending dealer response:", dealerResponse)
        
        return NextResponse.json({
          success: true,
          dealer: dealerResponse,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Restricted access to this portal",
          },
          { status: 403 },
        )
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Credenciais inválidas",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("Erro na autenticação:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
