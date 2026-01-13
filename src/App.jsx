import { Routes, Route, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import CreateOffer from "./pages/CreateOffer"
import Login from "./pages/Login"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  )
}

/* ===============================
   PROTECTED APP (HARUS LOGIN)
================================ */
function ProtectedApp() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login")
      } else {
        setLoading(false)
      }
    })
  }, [])

  if (loading) return null

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/offers/new/:leadId" element={<CreateOffer />} />
    </Routes>
  )
}

/* ===============================
   DASHBOARD
================================ */
function Dashboard() {
  const navigate = useNavigate()

  const [leads, setLeads] = useState([])
  const [offers, setOffers] = useState([])

  const [form, setForm] = useState({
    name: "",
    address: "",
    pic_name: "",
    pic_phone: "",
    type: "customer"
  })

  /* ========== LOADERS ========== */

  const loadLeads = async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("id", { ascending: false })

    setLeads(data || [])
  }

  const loadOffers = async () => {
    const { data } = await supabase
      .from("offers")
      .select("id, offer_number, total_amount, pdf_url, created_at, leads(name)")
      .order("id", { ascending: false })

    setOffers(data || [])
  }

  useEffect(() => {
    loadLeads()
    loadOffers()
  }, [])

  /* ========== FORM HANDLER ========== */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const submit = async () => {
    if (!form.name) {
      alert("Nama customer wajib diisi")
      return
    }

    const { error } = await supabase.from("leads").insert({
      name: form.name,
      address: form.address,
      pic_name: form.pic_name,
      pic_phone: form.pic_phone,
      type: "customer"
    })

    if (error) {
      alert(error.message)
      return
    }

    setForm({
      name: "",
      address: "",
      pic_name: "",
      pic_phone: "",
      type: "customer"
    })

    loadLeads()
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  /* ===============================
     UI (RESPONSIVE)
  ================================ */

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "auto" }}>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20
        }}
      >
        <h1 style={{ margin: 0 }}>Adiwidia Utama Indonesia</h1>
        <button className="btn" onClick={logout}>Logout</button>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 2fr",
          gap: 20
        }}
      >

        {/* FORM */}
        <div className="card">
          <h2>Tambah Customer</h2>

          <input className="input" name="name" placeholder="Nama" value={form.name} onChange={handleChange} />
          <input className="input" name="address" placeholder="Alamat" value={form.address} onChange={handleChange} />
          <input className="input" name="pic_name" placeholder="PIC" value={form.pic_name} onChange={handleChange} />
          <input className="input" name="pic_phone" placeholder="Telepon" value={form.pic_phone} onChange={handleChange} />

          <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit}>
            Simpan
          </button>
        </div>

        {/* CUSTOMER LIST */}
        <div className="card">
          <h2>Daftar Customer</h2>

          {window.innerWidth >= 768 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>PIC</th>
                  <th>Telp</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{l.pic_name}</td>
                    <td>{l.pic_phone}</td>
                    <td>
                      <button className="btn" onClick={() => navigate(`/offers/new/${l.id}`)}>
                        Buat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {leads.map(l => (
                <div key={l.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
                  <strong>{l.name}</strong>
                  <div>{l.pic_name}</div>
                  <div>{l.pic_phone}</div>
                  <button
                    style={{ marginTop: 8, width: "100%" }}
                    className="btn"
                    onClick={() => navigate(`/offers/new/${l.id}`)}
                  >
                    Buat Penawaran
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OFFERS */}
      <div className="card" style={{ marginTop: 30 }}>
        <h2>Daftar Penawaran</h2>

        {window.innerWidth >= 768 ? (
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Customer</th>
                <th>Total</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id}>
                  <td>{o.offer_number}</td>
                  <td>{o.leads?.name}</td>
                  <td>
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0
                    }).format(o.total_amount)}
                  </td>
                  <td>
                    <a href={o.pdf_url} target="_blank" rel="noreferrer">Lihat</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {offers.map(o => (
              <div key={o.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
                <strong>{o.offer_number}</strong>
                <div>{o.leads?.name}</div>
                <div>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0
                  }).format(o.total_amount)}
                </div>
                <a href={o.pdf_url} target="_blank" rel="noreferrer">Lihat PDF</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
