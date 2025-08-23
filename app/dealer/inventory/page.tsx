"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Notification, useNotification } from "@/components/notification"

interface BoatInventory {
  id?: number
  dealer_id?: string
  dealer_name?: string
  boat_model: string
  boat_color: string
  engine_package: string
  cost_price: number
  sale_price: number
  status: string
  date_added: string
  notes?: string
  created_at?: string
  updated_at?: string
}

interface BoatModel {
  name: string
  name_pt: string
}

interface HullColor {
  name: string
  name_pt: string
  compatible_models?: string[]
}

interface EnginePackage {
  name: string
  name_pt: string
  compatible_models?: string[]
}

interface SaleFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  customer_city: string
  customer_state: string
  customer_zip: string
  customer_country: string
  payment_method: string
  deposit_amount: number
  additional_notes: string
}

export default function InventoryPage() {
  const [lang, setLang] = useState("pt")
  const [inventory, setInventory] = useState<BoatInventory[]>([])
  const [boatModels, setBoatModels] = useState<BoatModel[]>([])
  const [hullColors, setHullColors] = useState<HullColor[]>([])
  const [enginePackages, setEnginePackages] = useState<EnginePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<BoatInventory | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [saleFormData, setSaleFormData] = useState<SaleFormData>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    customer_city: "",
    customer_state: "",
    customer_zip: "",
    customer_country: "",
    payment_method: "",
    deposit_amount: 0,
    additional_notes: "",
  })

  const [newItem, setNewItem] = useState<BoatInventory>({
    boat_model: "",
    boat_color: "",
    engine_package: "",
    cost_price: 0,
    sale_price: 0,
    status: "available",
    date_added: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const { notification, showNotification, hideNotification } = useNotification()

  const translations = {
    pt: {
      "Inventory Management": "Gestão de Inventário",
      "Back to Dashboard": "Voltar ao Painel",
      "Manage your boat inventory and track sales.": "Gerencie seu inventário de barcos e acompanhe as vendas.",
      "Add New Boat": "Adicionar Novo Barco",
      "Boat Model": "Modelo do Barco",
      "Boat Color": "Cor do Barco",
      "Engine Package": "Pacote de Motor",
      "Cost Price": "Preço de Custo",
      "Sale Price": "Preço de Venda",
      Status: "Status",
      "Date Added": "Data Adicionada",
      Notes: "Observações",
      Actions: "Ações",
      "No boats in inventory": "Nenhum barco no inventário",
      Edit: "Editar",
      Delete: "Excluir",
      "Mark as Sold": "Marcar como Vendido",
      Save: "Salvar",
      Cancel: "Cancelar",
      "Edit Boat": "Editar Barco",
      "Sale Information": "Informações da Venda",
      "Customer Name": "Nome do Cliente",
      Email: "Email",
      Phone: "Telefone",
      Address: "Endereço",
      City: "Cidade",
      State: "Estado",
      "ZIP Code": "CEP",
      Country: "País",
      "Payment Method": "Método de Pagamento",
      "Deposit Amount": "Valor do Depósito",
      "Additional Notes": "Observações Adicionais",
      "Complete Sale": "Finalizar Venda",
      "Select Model": "Selecione o Modelo",
      "Select Color": "Selecione a Cor",
      "Select Engine": "Selecione o Motor",
      "Select first a model": "Selecione primeiro um modelo",
      Available: "Disponível",
      Reserved: "Reservado",
      Sold: "Vendido",
      Cash: "À Vista",
      Financing: "Financiamento",
      "Trade-in": "Troca",
      "For Plan": "Por Plano",
      "Boat added successfully!": "Barco adicionado com sucesso!",
      "Boat updated successfully!": "Barco atualizado com sucesso!",
      "Boat deleted successfully!": "Barco excluído com sucesso!",
      "Sale completed successfully!": "Venda finalizada com sucesso!",
      "Error adding boat": "Erro ao adicionar barco",
      "Error updating boat": "Erro ao atualizar barco",
      "Error deleting boat": "Erro ao excluir barco",
      "Error completing sale": "Erro ao finalizar venda",
      "Please fill all required fields": "Por favor, preencha todos os campos obrigatórios",
    },
    en: {
      "Inventory Management": "Inventory Management",
      "Back to Dashboard": "Back to Dashboard",
      "Manage your boat inventory and track sales.": "Manage your boat inventory and track sales.",
      "Add New Boat": "Add New Boat",
      "Boat Model": "Boat Model",
      "Boat Color": "Boat Color",
      "Engine Package": "Engine Package",
      "Cost Price": "Cost Price",
      "Sale Price": "Sale Price",
      Status: "Status",
      "Date Added": "Date Added",
      Notes: "Notes",
      Actions: "Actions",
      "No boats in inventory": "No boats in inventory",
      Edit: "Edit",
      Delete: "Delete",
      "Mark as Sold": "Mark as Sold",
      Save: "Save",
      Cancel: "Cancel",
      "Edit Boat": "Edit Boat",
      "Sale Information": "Sale Information",
      "Customer Name": "Customer Name",
      Email: "Email",
      Phone: "Phone",
      Address: "Address",
      City: "City",
      State: "State",
      "ZIP Code": "ZIP Code",
      Country: "Country",
      "Payment Method": "Payment Method",
      "Deposit Amount": "Deposit Amount",
      "Additional Notes": "Additional Notes",
      "Complete Sale": "Complete Sale",
      "Select Model": "Select Model",
      "Select Color": "Select Color",
      "Select Engine": "Select Engine",
      "Select first a model": "Select first a model",
      Available: "Available",
      Reserved: "Reserved",
      Sold: "Sold",
      Cash: "Cash",
      Financing: "Financing",
      "Trade-in": "Trade-in",
      "For Plan": "For Plan",
      "Boat added successfully!": "Boat added successfully!",
      "Boat updated successfully!": "Boat updated successfully!",
      "Boat deleted successfully!": "Boat deleted successfully!",
      "Sale completed successfully!": "Sale completed successfully!",
      "Error adding boat": "Error adding boat",
      "Error updating boat": "Error updating boat",
      "Error deleting boat": "Error deleting boat",
      "Error completing sale": "Error completing sale",
      "Please fill all required fields": "Please fill all required fields",
    },
    es: {
      "Inventory Management": "Gestión de Inventario",
      "Back to Dashboard": "Volver al Panel",
      "Manage your boat inventory and track sales.": "Gestione su inventario de barcos y rastree las ventas.",
      "Add New Boat": "Agregar Nuevo Barco",
      "Boat Model": "Modelo de Barco",
      "Boat Color": "Color del Barco",
      "Engine Package": "Paquete de Motor",
      "Cost Price": "Precio de Costo",
      "Sale Price": "Precio de Venta",
      Status: "Estado",
      "Date Added": "Fecha Agregada",
      Notes: "Notas",
      Actions: "Acciones",
      "No boats in inventory": "No hay barcos en inventario",
      Edit: "Editar",
      Delete: "Eliminar",
      "Mark as Sold": "Marcar como Vendido",
      Save: "Guardar",
      Cancel: "Cancelar",
      "Edit Boat": "Editar Barco",
      "Sale Information": "Información de Venta",
      "Customer Name": "Nombre del Cliente",
      Email: "Correo Electrónico",
      Phone: "Teléfono",
      Address: "Dirección",
      City: "Ciudad",
      State: "Estado",
      "ZIP Code": "Código Postal",
      Country: "País",
      "Payment Method": "Método de Pago",
      "Deposit Amount": "Monto del Depósito",
      "Additional Notes": "Notas Adicionales",
      "Complete Sale": "Completar Venta",
      "Select Model": "Seleccionar Modelo",
      "Select Color": "Seleccionar Color",
      "Select Engine": "Seleccionar Motor",
      "Select first a model": "Seleccione primero un modelo",
      Available: "Disponible",
      Reserved: "Reservado",
      Sold: "Vendido",
      Cash: "Efectivo",
      Financing: "Financiamiento",
      "Trade-in": "Intercambio",
      "For Plan": "Por Plan",
      "Boat added successfully!": "¡Barco agregado exitosamente!",
      "Boat updated successfully!": "¡Barco actualizado exitosamente!",
      "Boat deleted successfully!": "¡Barco eliminado exitosamente!",
      "Sale completed successfully!": "¡Venta completada exitosamente!",
      "Error adding boat": "Error al agregar barco",
      "Error updating boat": "Error al actualizar barco",
      "Error deleting boat": "Error al eliminar barco",
      "Error completing sale": "Error al completar venta",
      "Please fill all required fields": "Por favor complete todos los campos requeridos",
    },
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadInventory(), loadConfig()])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async () => {
    try {
      const dealerName = localStorage.getItem("currentDealerName") || ""
      const response = await fetch(`/api/dealer-inventory?dealerName=${encodeURIComponent(dealerName)}`)
      const result = await response.json()

      if (result.success) {
        setInventory(result.data)
      } else {
        console.error("Error loading inventory:", result.error)
      }
    } catch (error) {
      console.error("Error loading inventory:", error)
    }
  }

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/get-admin-data", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const data = await response.json()
      if (data.success) {
        setBoatModels(data.data.boatModels || [])
        setHullColors(data.data.hullColors || [])
        setEnginePackages(data.data.enginePackages || [])
      }
    } catch (error) {
      console.error("Error loading config:", error)
    }
  }

  const getCompatibleColors = (selectedModel: string) => {
    return hullColors.filter(
      (color) =>
        !color.compatible_models ||
        color.compatible_models.length === 0 ||
        color.compatible_models.includes(selectedModel),
    )
  }

  const getCompatibleEngines = (selectedModel: string) => {
    return enginePackages.filter(
      (engine) =>
        !engine.compatible_models ||
        engine.compatible_models.length === 0 ||
        engine.compatible_models.includes(selectedModel),
    )
  }

  const handleModelChange = (value: string, isEdit = false) => {
    if (isEdit && editingItem) {
      setEditingItem({
        ...editingItem,
        boat_model: value,
        boat_color: "",
        engine_package: "",
      })
    } else {
      setNewItem({
        ...newItem,
        boat_model: value,
        boat_color: "",
        engine_package: "",
      })
    }
  }

  const handleAddBoat = async () => {
    if (!newItem.boat_model || !newItem.boat_color || !newItem.engine_package) {
      showNotification(translations[lang as keyof typeof translations]["Please fill all required fields"], "error")
      return
    }

    try {
      const dealerName = localStorage.getItem("currentDealerName") || ""
      const response = await fetch("/api/dealer-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          dealerName,
          ...newItem,
        }),
      })

      const result = await response.json()
      if (result.success) {
        showNotification(translations[lang as keyof typeof translations]["Boat added successfully!"], "success")
        setNewItem({
          boat_model: "",
          boat_color: "",
          engine_package: "",
          cost_price: 0,
          sale_price: 0,
          status: "available",
          date_added: new Date().toISOString().split("T")[0],
          notes: "",
        })
        loadInventory()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      showNotification(translations[lang as keyof typeof translations]["Error adding boat"], "error")
    }
  }

  const handleEditBoat = (item: BoatInventory) => {
    setEditingItem({ ...item })
    setShowEditModal(true)
  }

  const handleUpdateBoat = async () => {
    if (!editingItem) return

    try {
      const response = await fetch("/api/dealer-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: editingItem.id,
          ...editingItem,
        }),
      })

      const result = await response.json()
      if (result.success) {
        showNotification(translations[lang as keyof typeof translations]["Boat updated successfully!"], "success")
        setShowEditModal(false)
        setEditingItem(null)
        loadInventory()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      showNotification(translations[lang as keyof typeof translations]["Error updating boat"], "error")
    }
  }

  const handleDeleteBoat = async (id: number) => {
    if (!confirm("Are you sure you want to delete this boat?")) return

    try {
      const response = await fetch("/api/dealer-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      })

      const result = await response.json()
      if (result.success) {
        showNotification(translations[lang as keyof typeof translations]["Boat deleted successfully!"], "success")
        loadInventory()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      showNotification(translations[lang as keyof typeof translations]["Error deleting boat"], "error")
    }
  }

  const handleMarkAsSold = (item: BoatInventory) => {
    setEditingItem(item)
    setShowSaleModal(true)
  }

  const handleCompleteSale = async () => {
    if (!editingItem || !saleFormData.customer_name || !saleFormData.customer_email || !saleFormData.customer_phone) {
      showNotification(translations[lang as keyof typeof translations]["Please fill all required fields"], "error")
      return
    }

    try {
      const dealerName = localStorage.getItem("currentDealerName") || ""

      // Update inventory status
      const inventoryResponse = await fetch("/api/dealer-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: editingItem.id,
          ...editingItem,
          status: "sold",
        }),
      })

      const inventoryResult = await inventoryResponse.json()
      if (!inventoryResult.success) {
        throw new Error(inventoryResult.error)
      }

      // Create order
      const orderData = {
        dealerName,
        customer_name: saleFormData.customer_name,
        customer_email: saleFormData.customer_email,
        customer_phone: saleFormData.customer_phone,
        customer_address: saleFormData.customer_address,
        customer_city: saleFormData.customer_city,
        customer_state: saleFormData.customer_state,
        customer_zip: saleFormData.customer_zip,
        customer_country: saleFormData.customer_country,
        boat_model: editingItem.boat_model,
        engine_package: editingItem.engine_package,
        hull_color: editingItem.boat_color,
        additional_options: [],
        payment_method: saleFormData.payment_method,
        deposit_amount: saleFormData.deposit_amount,
        additional_notes: saleFormData.additional_notes,
        total_usd: editingItem.sale_price,
        total_brl: editingItem.sale_price,
        status: "pending",
      }

      const orderResponse = await fetch("/api/save-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      const orderResult = await orderResponse.json()
      if (orderResult.success) {
        showNotification(translations[lang as keyof typeof translations]["Sale completed successfully!"], "success")
        setShowSaleModal(false)
        setEditingItem(null)
        setSaleFormData({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          customer_address: "",
          customer_city: "",
          customer_state: "",
          customer_zip: "",
          customer_country: "",
          payment_method: "",
          deposit_amount: 0,
          additional_notes: "",
        })
        loadInventory()
      } else {
        throw new Error(orderResult.error)
      }
    } catch (error) {
      showNotification(translations[lang as keyof typeof translations]["Error completing sale"], "error")
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "reserved":
        return "bg-yellow-100 text-yellow-800"
      case "sold":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="max-w-7xl mx-auto">
        <Link
          href="/dealer/dashboard"
          className="inline-flex items-center text-blue-900 font-semibold mb-5 hover:underline"
        >
          ← {translations[lang as keyof typeof translations]["Back to Dashboard"]}
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            {translations[lang as keyof typeof translations]["Inventory Management"]}
          </h1>
          <p className="text-lg text-gray-600">
            {translations[lang as keyof typeof translations]["Manage your boat inventory and track sales."]}
          </p>
        </div>

        {/* Add New Boat Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            {translations[lang as keyof typeof translations]["Add New Boat"]}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                {translations[lang as keyof typeof translations]["Boat Model"]} *
              </label>
              <select
                value={newItem.boat_model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              >
                <option value="">-- {translations[lang as keyof typeof translations]["Select Model"]} --</option>
                {boatModels.map((model) => (
                  <option key={model.name} value={model.name}>
                    {lang === "pt" ? model.name_pt : model.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                {translations[lang as keyof typeof translations]["Boat Color"]} *
              </label>
              <select
                value={newItem.boat_color}
                onChange={(e) => setNewItem({ ...newItem, boat_color: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                disabled={!newItem.boat_model}
                required
              >
                <option value="">
                  {newItem.boat_model
                    ? `-- ${translations[lang as keyof typeof translations]["Select Color"]} --`
                    : translations[lang as keyof typeof translations]["Select first a model"]}
                </option>
                {newItem.boat_model &&
                  getCompatibleColors(newItem.boat_model).map((color) => (
                    <option key={color.name} value={color.name}>
                      {lang === "pt" ? color.name_pt : color.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                {translations[lang as keyof typeof translations]["Engine Package"]} *
              </label>
              <select
                value={newItem.engine_package}
                onChange={(e) => setNewItem({ ...newItem, engine_package: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                disabled={!newItem.boat_model}
                required
              >
                <option value="">
                  {newItem.boat_model
                    ? `-- ${translations[lang as keyof typeof translations]["Select Engine"]} --`
                    : translations[lang as keyof typeof translations]["Select first a model"]}
                </option>
                {newItem.boat_model &&
                  getCompatibleEngines(newItem.boat_model).map((engine) => (
                    <option key={engine.name} value={engine.name}>
                      {lang === "pt" ? engine.name_pt : engine.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                {translations[lang as keyof typeof translations]["Cost Price"]}
              </label>
              <input
                type="number"
                value={newItem.cost_price}
                onChange={(e) => setNewItem({ ...newItem, cost_price: Number(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                {translations[lang as keyof typeof translations]["Sale Price"]}
              </label>
              <input
                type="number"
                value={newItem.sale_price}
                onChange={(e) => setNewItem({ ...newItem, sale_price: Number(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                {translations[lang as keyof typeof translations]["Date Added"]}
              </label>
              <input
                type="date"
                value={newItem.date_added}
                onChange={(e) => setNewItem({ ...newItem, date_added: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-gray-700 mb-2">
                {translations[lang as keyof typeof translations]["Notes"]}
              </label>
              <textarea
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleAddBoat}
              className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              {translations[lang as keyof typeof translations]["Add New Boat"]}
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Boat Model"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Boat Color"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Engine Package"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Cost Price"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Sale Price"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Status"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Date Added"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Actions"]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 p-8 text-center text-gray-500">
                      <div className="text-4xl mb-4">🚤</div>
                      {translations[lang as keyof typeof translations]["No boats in inventory"]}
                    </td>
                  </tr>
                ) : (
                  inventory.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-4">{item.boat_model}</td>
                      <td className="border border-gray-300 p-4">{item.boat_color}</td>
                      <td className="border border-gray-300 p-4">{item.engine_package}</td>
                      <td className="border border-gray-300 p-4">${item.cost_price.toLocaleString()}</td>
                      <td className="border border-gray-300 p-4">${item.sale_price.toLocaleString()}</td>
                      <td className="border border-gray-300 p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(item.status)}`}
                        >
                          {
                            translations[lang as keyof typeof translations][
                              item.status as keyof (typeof translations)[typeof lang]
                            ]
                          }
                        </span>
                      </td>
                      <td className="border border-gray-300 p-4">{new Date(item.date_added).toLocaleDateString()}</td>
                      <td className="border border-gray-300 p-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditBoat(item)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            {translations[lang as keyof typeof translations]["Edit"]}
                          </button>
                          {item.status === "available" && (
                            <button
                              onClick={() => handleMarkAsSold(item)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              {translations[lang as keyof typeof translations]["Mark as Sold"]}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBoat(item.id!)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            {translations[lang as keyof typeof translations]["Delete"]}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-900">
                  {translations[lang as keyof typeof translations]["Edit Boat"]}
                </h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Boat Model"]} *
                  </label>
                  <select
                    value={editingItem.boat_model}
                    onChange={(e) => handleModelChange(e.target.value, true)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">-- {translations[lang as keyof typeof translations]["Select Model"]} --</option>
                    {boatModels.map((model) => (
                      <option key={model.name} value={model.name}>
                        {lang === "pt" ? model.name_pt : model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Boat Color"]} *
                  </label>
                  <select
                    value={editingItem.boat_color}
                    onChange={(e) => setEditingItem({ ...editingItem, boat_color: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    disabled={!editingItem.boat_model}
                    required
                  >
                    <option value="">
                      {editingItem.boat_model
                        ? `-- ${translations[lang as keyof typeof translations]["Select Color"]} --`
                        : translations[lang as keyof typeof translations]["Select first a model"]}
                    </option>
                    {editingItem.boat_model &&
                      getCompatibleColors(editingItem.boat_model).map((color) => (
                        <option key={color.name} value={color.name}>
                          {lang === "pt" ? color.name_pt : color.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Engine Package"]} *
                  </label>
                  <select
                    value={editingItem.engine_package}
                    onChange={(e) => setEditingItem({ ...editingItem, engine_package: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    disabled={!editingItem.boat_model}
                    required
                  >
                    <option value="">
                      {editingItem.boat_model
                        ? `-- ${translations[lang as keyof typeof translations]["Select Engine"]} --`
                        : translations[lang as keyof typeof translations]["Select first a model"]}
                    </option>
                    {editingItem.boat_model &&
                      getCompatibleEngines(editingItem.boat_model).map((engine) => (
                        <option key={engine.name} value={engine.name}>
                          {lang === "pt" ? engine.name_pt : engine.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Cost Price"]}
                    </label>
                    <input
                      type="number"
                      value={editingItem.cost_price}
                      onChange={(e) => setEditingItem({ ...editingItem, cost_price: Number(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {translations[lang as keyof typeof translations]["Sale Price"]}
                    </label>
                    <input
                      type="number"
                      value={editingItem.sale_price}
                      onChange={(e) => setEditingItem({ ...editingItem, sale_price: Number(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Status"]}
                  </label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="available">{translations[lang as keyof typeof translations]["Available"]}</option>
                    <option value="reserved">{translations[lang as keyof typeof translations]["Reserved"]}</option>
                    <option value="sold">{translations[lang as keyof typeof translations]["Sold"]}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Notes"]}
                  </label>
                  <textarea
                    value={editingItem.notes || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                  {translations[lang as keyof typeof translations]["Cancel"]}
                </button>
                <button
                  onClick={handleUpdateBoat}
                  className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800"
                >
                  {translations[lang as keyof typeof translations]["Save"]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-900">
                  {translations[lang as keyof typeof translations]["Sale Information"]}
                </h2>
                <button onClick={() => setShowSaleModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Customer Name"]} *
                  </label>
                  <input
                    type="text"
                    value={saleFormData.customer_name}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Email"]} *
                  </label>
                  <input
                    type="email"
                    value={saleFormData.customer_email}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Phone"]} *
                  </label>
                  <input
                    type="tel"
                    value={saleFormData.customer_phone}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Address"]}
                  </label>
                  <input
                    type="text"
                    value={saleFormData.customer_address}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_address: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["City"]}
                  </label>
                  <input
                    type="text"
                    value={saleFormData.customer_city}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_city: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["State"]}
                  </label>
                  <input
                    type="text"
                    value={saleFormData.customer_state}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_state: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["ZIP Code"]}
                  </label>
                  <input
                    type="text"
                    value={saleFormData.customer_zip}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_zip: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Country"]}
                  </label>
                  <input
                    type="text"
                    value={saleFormData.customer_country}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customer_country: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Payment Method"]}
                  </label>
                  <select
                    value={saleFormData.payment_method}
                    onChange={(e) => setSaleFormData({ ...saleFormData, payment_method: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Select Payment Method --</option>
                    <option value="cash">{translations[lang as keyof typeof translations]["Cash"]}</option>
                    <option value="financing">{translations[lang as keyof typeof translations]["Financing"]}</option>
                    <option value="trade-in">{translations[lang as keyof typeof translations]["Trade-in"]}</option>
                    <option value="for-plan">{translations[lang as keyof typeof translations]["For Plan"]}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Deposit Amount"]}
                  </label>
                  <input
                    type="number"
                    value={saleFormData.deposit_amount}
                    onChange={(e) => setSaleFormData({ ...saleFormData, deposit_amount: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block font-semibold text-gray-700 mb-2">
                  {translations[lang as keyof typeof translations]["Additional Notes"]}
                </label>
                <textarea
                  value={saleFormData.additional_notes}
                  onChange={(e) => setSaleFormData({ ...saleFormData, additional_notes: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                  {translations[lang as keyof typeof translations]["Cancel"]}
                </button>
                <button
                  onClick={handleCompleteSale}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  {translations[lang as keyof typeof translations]["Complete Sale"]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
