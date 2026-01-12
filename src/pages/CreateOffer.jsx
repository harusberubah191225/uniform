import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(n || 0)

export default function CreateOffer() {
  const { leadId } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)

  const [items, setItems] = useState([
    { name: "", gender: "", material: "", qty: 1, unit: "pcs", price: 0, subtotal: 0 }
  ])

  const [note, setNote] = useState("")

  useEffect(() => {
    supabase.from("leads").select("*").eq("id", leadId).single().then(r => setLead(r.data))
  }, [leadId])

  const updateItem = (i, field, val) => {
    const data = [...items]
    data[i][field] = field === "qty" || field === "price" ? Number(val || 0) : val
    data[i].subtotal = data[i].qty * data[i].price
    setItems(data)
  }

  const addRow = () => {
    setItems([...items, { name: "", gender: "", material: "", qty: 1, unit: "pcs", price: 0, subtotal: 0 }])
  }

  const removeRow = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((s, i) => s + i.subtotal, 0)

  // 🔥 NO JWT — Edge Function sekarang public
  const generate = async () => {
    const res = await fetch(
      "https://tcdoxeuhunupnorlxrix.supabase.co/functions/v1/pdf-generator",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: "offer",
          lead_id: Number(leadId),
          items,
          note
        })
      }
    )

    const data = await res.json()

    if (!res.ok) {
      console.error("EDGE ERROR:", data)
      alert(data.error || "Gagal generate penawaran")
      return
    }

    window.open(data.pdf_url, "_blank")
    navigate("/")
  }

  if (!lead) return null

  const cellInput = {
    width: "100%",
    height: "38px",
    padding: 8,
    boxSizing: "border-box"
  }

  return (
    <div className="page" style={{ padding: 30 }}>
      <h1 style={{ marginBottom: 20 }}>Buat Penawaran – {lead.name}</h1>

      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px", background: "white", borderRadius: 10 }}>
        <thead>
          <tr style={{ background: "linear-gradient(to right, #3b82f6, #2563eb)", color: "white" }}>
            <th style={{ padding: 10, width: "22%" }}>Nama Seragam</th>
            <th style={{ padding: 10, width: "14%" }}>Gender</th>
            <th style={{ padding: 10, width: "18%" }}>Nama Bahan</th>
            <th style={{ padding: 10, width: "6%", textAlign: "center" }}>Qty</th>
            <th style={{ padding: 10, width: "8%" }}>Satuan</th>
            <th style={{ padding: 10, width: "15%" }}>Harga</th>
            <th style={{ padding: 10, width: "14%" }}>Subtotal</th>
            <th style={{ padding: 10, width: "3%" }}></th>
          </tr>
        </thead>

        <tbody>
          {items.map((it, i) => (
            <tr key={i} style={{ background: "#f8fafc" }}>
              <td style={{ padding: 8 }}><input style={cellInput} value={it.name} onChange={e => updateItem(i, "name", e.target.value)} /></td>
              <td style={{ padding: 8 }}>
                <select style={cellInput} value={it.gender} onChange={e => updateItem(i, "gender", e.target.value)}>
                  <option value="">Pilih</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </td>
              <td style={{ padding: 8 }}><input style={cellInput} value={it.material} onChange={e => updateItem(i, "material", e.target.value)} /></td>
              <td style={{ padding: 8 }}><input type="number" min="1" style={cellInput} value={it.qty} onChange={e => updateItem(i, "qty", e.target.value)} /></td>
              <td style={{ padding: 8 }}><input style={cellInput} value={it.unit} onChange={e => updateItem(i, "unit", e.target.value)} /></td>
              <td style={{ padding: 8 }}><input type="number" style={cellInput} value={it.price} onChange={e => updateItem(i, "price", e.target.value)} /></td>
              <td style={{ padding: "8px 16px", fontWeight: 700, textAlign: "right" }}>{rupiah(it.subtotal)}</td>
              <td style={{ padding: 8 }}><button onClick={() => removeRow(i)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={addRow} style={{ marginTop: 15 }}>+ Tambah Baris</button>
      <h2 style={{ marginTop: 25 }}>Total: {rupiah(total)}</h2>

      <textarea rows="3" style={{ width: "100%", padding: 10 }} value={note} onChange={(e) => setNote(e.target.value)} />

      <div style={{ marginTop: 25, display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onClick={generate}>Generate Penawaran</button>
        <button className="btn" onClick={() => navigate("/")}>Batal</button>
      </div>
    </div>
  )
}
