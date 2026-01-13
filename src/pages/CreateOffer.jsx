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

  const isMobile = window.innerWidth < 768

  const cellInput = {
    width: "100%",
    height: "38px",
    padding: 8,
    boxSizing: "border-box"
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "auto" }}>
      <h1>Buat Penawaran – {lead.name}</h1>

      {/* ===== DESKTOP TABLE ===== */}
      {!isMobile && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
          <thead style={{ background: "#1e3a8a", color: "white" }}>
            <tr>
              <th>Nama</th>
              <th>Gender</th>
              <th>Bahan</th>
              <th>Qty</th>
              <th>Satuan</th>
              <th>Harga</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td><input style={cellInput} value={it.name} onChange={e => updateItem(i, "name", e.target.value)} /></td>
                <td>
                  <select style={cellInput} value={it.gender} onChange={e => updateItem(i, "gender", e.target.value)}>
                    <option value="">Pilih</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </td>
                <td><input style={cellInput} value={it.material} onChange={e => updateItem(i, "material", e.target.value)} /></td>
                <td><input type="number" min="1" style={cellInput} value={it.qty} onChange={e => updateItem(i, "qty", e.target.value)} /></td>
                <td><input style={cellInput} value={it.unit} onChange={e => updateItem(i, "unit", e.target.value)} /></td>
                <td><input type="number" style={cellInput} value={it.price} onChange={e => updateItem(i, "price", e.target.value)} /></td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>{rupiah(it.subtotal)}</td>
                <td><button onClick={() => removeRow(i)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ===== MOBILE CARD ===== */}
      {isMobile && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {items.map((it, i) => (
            <div key={i} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <input style={cellInput} placeholder="Nama Seragam" value={it.name} onChange={e => updateItem(i, "name", e.target.value)} />
              <select style={cellInput} value={it.gender} onChange={e => updateItem(i, "gender", e.target.value)}>
                <option value="">Gender</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <input style={cellInput} placeholder="Bahan" value={it.material} onChange={e => updateItem(i, "material", e.target.value)} />
              <input type="number" min="1" style={cellInput} value={it.qty} onChange={e => updateItem(i, "qty", e.target.value)} />
              <input style={cellInput} value={it.unit} onChange={e => updateItem(i, "unit", e.target.value)} />
              <input type="number" style={cellInput} value={it.price} onChange={e => updateItem(i, "price", e.target.value)} />
              <div style={{ fontWeight: "bold", marginTop: 6 }}>{rupiah(it.subtotal)}</div>
              <button style={{ width: "100%", marginTop: 8 }} onClick={() => removeRow(i)}>Hapus</button>
            </div>
          ))}
        </div>
      )}

      <button style={{ marginTop: 15 }} onClick={addRow}>+ Tambah Baris</button>

      <h2 style={{ marginTop: 20 }}>Total: {rupiah(total)}</h2>

      <textarea
        rows="3"
        style={{ width: "100%", padding: 10, marginTop: 12 }}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan (opsional)"
      />

      <div style={{ marginTop: 20, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
        <button className="btn btn-primary" onClick={generate}>Generate Penawaran</button>
        <button className="btn" onClick={() => navigate("/")}>Batal</button>
      </div>
    </div>
  )
}
