import { DatabaseService } from "@/lib/database-service"

// Simulação de envio de email - substitua por um serviço real como Resend, SendGrid, etc.
async function sendEmail(to: string, subject: string, html: string) {
  // Aqui você integraria com um serviço real de email
  console.log("📧 Enviando email para:", to)
  console.log("📧 Assunto:", subject)
  console.log("📧 HTML:", html.substring(0, 200) + "...")

  // Simular delay de envio
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return { success: true, messageId: `msg_${Date.now()}` }
}

function generateOrderEmailHTML(order: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Novo Pedido - ${order.order_id}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .content { background: #f8f9fa; padding: 20px; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #1e3a8a; }
        .value { margin-left: 10px; }
        .total { background: #e3f2fd; padding: 15px; border-left: 4px solid #1e3a8a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Novo Pedido de Barco</h1>
          <p>ID: ${order.order_id}</p>
        </div>
        <div class="content">
          <div class="section">
            <h3>Informações do Cliente</h3>
            <p><span class="label">Nome:</span><span class="value">${order.customer_name}</span></p>
            <p><span class="label">Email:</span><span class="value">${order.customer_email}</span></p>
            <p><span class="label">Telefone:</span><span class="value">${order.customer_phone}</span></p>
            ${order.customer_address ? `<p><span class="label">Endereço:</span><span class="value">${order.customer_address}</span></p>` : ""}
          </div>
          
          <div class="section">
            <h3>Configuração do Barco</h3>
            <p><span class="label">Modelo:</span><span class="value">${order.boat_model}</span></p>
            <p><span class="label">Motor:</span><span class="value">${order.engine_package}</span></p>
            <p><span class="label">Cor do Casco:</span><span class="value">${order.hull_color}</span></p>
            ${order.additional_options?.length > 0 ? `<p><span class="label">Opções:</span><span class="value">${order.additional_options.join(", ")}</span></p>` : ""}
          </div>
          
          <div class="section">
            <h3>Pagamento</h3>
            <p><span class="label">Método:</span><span class="value">${order.payment_method}</span></p>
            ${order.deposit_amount > 0 ? `<p><span class="label">Entrada:</span><span class="value">$${order.deposit_amount}</span></p>` : ""}
          </div>
          
          <div class="total">
            <h3>Total: $${order.total_usd} USD / R$${order.total_brl} BRL</h3>
          </div>
          
          <div class="section">
            <p><span class="label">Status:</span><span class="value">${order.status}</span></p>
            <p><span class="label">Data:</span><span class="value">${new Date(order.created_at).toLocaleDateString()}</span></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateServiceRequestEmailHTML(request: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Solicitação de Serviço - ${request.request_id}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background: #f8f9fa; padding: 20px; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #dc2626; }
        .value { margin-left: 10px; }
        .issues { background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Solicitação de Serviço</h1>
          <p>ID: ${request.request_id}</p>
        </div>
        <div class="content">
          <div class="section">
            <h3>Informações do Cliente</h3>
            <p><span class="label">Nome:</span><span class="value">${request.customer_name}</span></p>
            <p><span class="label">Email:</span><span class="value">${request.customer_email}</span></p>
            <p><span class="label">Telefone:</span><span class="value">${request.customer_phone}</span></p>
            ${request.customer_address ? `<p><span class="label">Endereço:</span><span class="value">${request.customer_address}</span></p>` : ""}
          </div>
          
          <div class="section">
            <h3>Informações do Barco</h3>
            <p><span class="label">Modelo:</span><span class="value">${request.boat_model}</span></p>
            <p><span class="label">Hull ID:</span><span class="value">${request.hull_id}</span></p>
            <p><span class="label">Data da Compra:</span><span class="value">${request.purchase_date}</span></p>
            ${request.engine_hours ? `<p><span class="label">Horas do Motor:</span><span class="value">${request.engine_hours}</span></p>` : ""}
          </div>
          
          <div class="section">
            <h3>Tipo de Solicitação</h3>
            <p><span class="value">${request.request_type}</span></p>
          </div>
          
          ${
            request.issues?.length > 0
              ? `
          <div class="issues">
            <h3>Problemas Relatados</h3>
            <ul>
              ${request.issues.map((issue: any) => `<li>${issue.description || issue}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }
          
          <div class="section">
            <p><span class="label">Status:</span><span class="value">${request.status}</span></p>
            <p><span class="label">Data:</span><span class="value">${new Date(request.created_at).toLocaleDateString()}</span></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendOrderNotification(order: any) {
  try {
    // Buscar email de notificação configurado
    const notificationEmail = await DatabaseService.getNotificationEmail()

    if (!notificationEmail) {
      console.warn("⚠️ Email de notificação não configurado")
      return { success: false, error: "Email de notificação não configurado" }
    }

    const subject = `Novo Pedido - ${order.order_id}`
    const html = generateOrderEmailHTML(order)

    // Enviar email
    const result = await sendEmail(notificationEmail, subject, html)

    if (result.success) {
      console.log("✅ Notificação de pedido enviada com sucesso")
      return {
        success: true,
        message: "Email enviado com sucesso",
        messageId: result.messageId,
      }
    } else {
      throw new Error("Falha no envio do email")
    }
  } catch (error) {
    console.error("❌ Erro ao enviar notificação de pedido:", error)
    return { success: false, error: "Erro ao enviar notificação" }
  }
}

export async function sendServiceRequestNotification(request: any) {
  try {
    // Buscar email de notificação configurado
    const notificationEmail = await DatabaseService.getNotificationEmail()

    if (!notificationEmail) {
      console.warn("⚠️ Email de notificação não configurado")
      return { success: false, error: "Email de notificação não configurado" }
    }

    const subject = `Nova Solicitação de Serviço - ${request.request_id}`
    const html = generateServiceRequestEmailHTML(request)

    // Enviar email
    const result = await sendEmail(notificationEmail, subject, html)

    if (result.success) {
      console.log("✅ Notificação de serviço enviada com sucesso")
      return {
        success: true,
        message: "Email enviado com sucesso",
        messageId: result.messageId,
      }
    } else {
      throw new Error("Falha no envio do email")
    }
  } catch (error) {
    console.error("❌ Erro ao enviar notificação de serviço:", error)
    return { success: false, error: "Erro ao enviar notificação" }
  }
}