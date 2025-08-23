import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const { dealerId, currentPassword, newPassword } = await request.json()

    if (!dealerId || !currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Todos os campos são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Get dealer information
    const dealer = await DatabaseService.getDealerById(dealerId)

    if (!dealer) {
      return NextResponse.json(
        {
          success: false,
          error: "Dealer não encontrado",
        },
        { status: 404 },
      )
    }

    // Verify current password
    if (dealer.password !== currentPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Senha atual incorreta",
        },
        { status: 401 },
      )
    }

    // Update password
    await DatabaseService.updateDealerPassword(dealerId, newPassword)

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
