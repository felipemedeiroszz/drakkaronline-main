import { NextResponse } from "next/server"
import { sendOrderNotification, sendServiceRequestNotification } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json()

    let result

    if (type === "order") {
      result = await sendOrderNotification(data)
    } else if (type === "service_request") {
      result = await sendServiceRequestNotification(data)
    } else {
      return NextResponse.json({ success: false, error: "Tipo de notificação inválido" }, { status: 400 })
    }

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
