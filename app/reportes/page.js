'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, TrendingUp, DollarSign, Calendar, Users, BarChart } from 'lucide-react';
import styles from './page.module.css'; // Assuming we can reuse input styles or inline them slightly
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ display: 'flex', alignItems: 'flex-start', padding: '1.5rem', height: 'auto', flexDirection: 'column', textAlign: 'left' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
            <div style={{ background: `${color}20`, padding: '0.75rem', borderRadius: '0.5rem', color: color }}>
                <Icon size={24} />
            </div>
            {trend && (
                <span style={{ color: '#22c55e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                    <TrendingUp size={14} /> {trend}
                </span>
            )}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{value}</div>
        <div style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>{title}</div>
    </motion.div>
);

export default function ReportesPage() {
    const [period, setPeriod] = useState('today');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [salesHistory, setSalesHistory] = useState([]);


    // View Modal State
    const [viewingSale, setViewingSale] = useState(null);
    const [viewItems, setViewItems] = useState([]);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Edit Modal State
    const [editingSale, setEditingSale] = useState(null);
    const [editItems, setEditItems] = useState([]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // View Type State: 'sales' | 'purchases'
    const [reportType, setReportType] = useState('sales');

    const [data, setData] = useState({
        stats: { totalSales: 0, transactions: 0, avgTicket: 0 },
        salesChart: [],
        topProducts: []
    });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/sales');
            if (res.ok) {
                setSalesHistory(await res.json());
            }
        } catch (e) { console.error(e); }
    }

    const handleVoid = async (id) => {
        if (!confirm('¿Estás seguro de ANULAR esta venta? El stock será devuelto.')) return;
        try {
            const res = await fetch('/api/sales', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                alert('Venta Anulada');
                fetchHistory(); // Refresh list
                const params = new URLSearchParams();
                if (period === 'custom') { params.append('startDate', startDate); params.append('endDate', endDate); }
                else { params.append('period', period); }
                fetchReports(params.toString()); // Refresh stats
            } else {
                alert('Error al anular');
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        // If custom and dates not both picked, wait.
        if (period === 'custom' && (!startDate || !endDate)) return;

        const params = new URLSearchParams();
        if (period === 'custom') {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
        } else {
            params.append('period', period);
        }

        fetchReports(params.toString());
    }, [period, startDate, endDate, reportType]); // Add reportType dependency

    const fetchReports = async (queryString) => {
        try {
            const endpoint = reportType === 'sales' ? '/api/reports' : '/api/reports/purchases';
            const url = queryString ? `${endpoint}?${queryString}` : `${endpoint}?period=${period}`;

            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                // Normalize data structure for chart if needed
                if (reportType === 'purchases') {
                    // Purchase API returns { stats: { totalSpend, ...}, chart: [], topProducts: [] }
                    // Sales API returns { stats: { totalSales...}, salesChart: [], topProducts: [] }
                    setData({
                        stats: json.stats,
                        // Map "chart" to "salesChart" for generic component usage or conditional render
                        salesChart: json.chart,
                        topProducts: json.topProducts
                    });
                } else {
                    setData(json);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const downloadPDF = async () => {
        // Fetch detailed sales for today
        const res = await fetch('/api/reports?details=true'); // We'll assume this endpoint returns list of sales
        // For simplicity, we'll re-use current stats or fetch a specific detail endpoint.
        // Let's create a quick table from "Top Products" as a demo or fetch real sales list.
        // Ideally we need a new route for "GET /api/sales". Let's stick to what we have or mock the list for now to show functionality.

        const doc = new jsPDF();
        doc.text("Reporte de Ventas del Día", 14, 20);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

        doc.text("Resumen:", 14, 45);
        doc.text(`Total Vendido: Bs. ${data.stats.totalSales.toFixed(2)}`, 20, 55);
        doc.text(`Transacciones: ${data.stats.transactions}`, 20, 62);

        // Add table
        autoTable(doc, {
            startY: 70,
            head: [['Producto', 'Cant. Vendida', 'Total Generado']],
            body: data.topProducts.map(p => [p.Nombre, p.CantidadVendida, `Bs. ${p.TotalGenerado.toFixed(2)}`])
        });

        doc.save("reporte_ventas.pdf");
    };

    const handleEditStart = async (sale) => {
        try {
            const res = await fetch(`/api/sales?id=${sale.Id}`);
            if (res.ok) {
                const items = await res.json();
                setEditItems(items);
                setEditingSale(sale);
                setIsEditModalOpen(true);
            }
        } catch (e) {
            console.error(e);
            alert("Error cargando detalles");
        }
    };

    const handleViewDetails = async (sale) => {
        try {
            const res = await fetch(`/api/sales?id=${sale.Id}`);
            if (res.ok) {
                const items = await res.json();
                setViewItems(items);
                setViewingSale(sale);
                setIsViewModalOpen(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEditChangeQty = (idx, newQty) => {
        const newItems = [...editItems];
        newItems[idx].quantity = parseInt(newQty);
        setEditItems(newItems);
    };

    const handleEditSave = async () => {
        if (!editingSale) return;

        // Calculate new total
        const newTotal = editItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        try {
            const res = await fetch('/api/sales', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    id: editingSale.Id,
                    items: editItems,
                    total: newTotal
                })
            });

            if (res.ok) {
                alert('Venta Modificada Correctamente');
                setIsEditModalOpen(false);
                setEditingSale(null);
                fetchHistory(); // Refresh
                const params = new URLSearchParams();
                if (period === 'custom') { params.append('startDate', startDate); params.append('endDate', endDate); }
                else { params.append('period', period); }
                fetchReports(params.toString());
            } else {
                alert('Error al modificar');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Reportes</h1>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Toggle Buttons */}
                    <div style={{ display: 'flex', background: 'var(--card-bg)', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                        <button
                            onClick={() => setReportType('sales')}
                            style={{ padding: '0.5rem 1rem', background: reportType === 'sales' ? 'var(--primary)' : 'transparent', color: reportType === 'sales' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}
                        >
                            Ventas
                        </button>
                        <button
                            onClick={() => setReportType('purchases')}
                            style={{ padding: '0.5rem 1rem', background: reportType === 'purchases' ? 'var(--primary)' : 'transparent', color: reportType === 'purchases' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}
                        >
                            Compras
                        </button>
                    </div>

                    {period === 'custom' && (
                        <>
                            <input type="date" className={styles.input} value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.4rem', color: 'black' }} />
                            <span style={{ color: '#94a3b8' }}>-</span>
                            <input type="date" className={styles.input} value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.4rem', color: 'black' }} />
                        </>
                    )}
                    <select
                        style={{ padding: '0.5rem 1rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'white', borderRadius: '0.5rem' }}
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="today">Hoy</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mes</option>
                        <option value="custom">Personalizado</option>
                    </select>
                </div>
                <button
                    onClick={downloadPDF}
                    style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <DollarSign size={16} /> Descargar PDF
                </button>
            </div>

            <div className="grid-dashboard" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', padding: '0 0 2rem 0' }}>
                <StatCard title={reportType === 'sales' ? "Ventas Totales" : "Compras Totales"} value={`Bs. ${(reportType === 'sales' ? data.stats.totalSales : data.stats.totalSpend)?.toFixed(2) || '0.00'}`} icon={DollarSign} color={reportType === 'sales' ? "#22c55e" : "#ef4444"} />
                <StatCard title="Transacciones" value={reportType === 'sales' ? data.stats.transactions : data.stats.purchaseCount} icon={Calendar} color="#3b82f6" />
                {reportType === 'sales' && <StatCard title="Ticket Promedio" value={`Bs. ${data.stats.avgTicket?.toFixed(2)}`} icon={TrendingUp} color="#a855f7" />}
                <StatCard title={reportType === 'sales' ? "Productos Activos" : "Productos Comprados"} value={data.topProducts.length} icon={BarChart} color="#eab308" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Main Chart Area */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '1rem', padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        {reportType === 'sales' ? "Tendencia de Ventas" : "Tendencia de Gastos"}
                    </h3>
                    <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.salesChart}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={reportType === 'sales' ? "#6366f1" : "#ef4444"} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={reportType === 'sales' ? "#6366f1" : "#ef4444"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Bs. ${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey={reportType === 'sales' ? "sales" : "spend"} stroke={reportType === 'sales' ? "#6366f1" : "#ef4444"} strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '1rem', padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{reportType === 'sales' ? "Más Vendidos" : "Más Comprados"}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.topProducts.map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '2rem', height: '2rem', background: '#334155', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>{i + 1}</div>
                                    <span>{p.Nombre}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600 }}>Bs. {(p.TotalGenerado || p.TotalGastado).toFixed(2)}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{p.CantidadVendida || p.CantidadComprada} u.</div>
                                </div>
                            </div>
                        ))}
                        {data.topProducts.length === 0 && (
                            <p style={{ color: 'var(--secondary)', textAlign: 'center', padding: '1rem' }}>Sin datos aún</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sales History Section (Conditional) */}
            {
                reportType === 'sales' && (
                    <div style={{ marginTop: '2rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '1rem', padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Historial de Ventas Recientes</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem' }}>ID</th>
                                        <th style={{ padding: '0.75rem' }}>Fecha</th>
                                        <th style={{ padding: '0.75rem' }}>Total</th>
                                        <th style={{ padding: '0.75rem' }}>Estado</th>
                                        <th style={{ padding: '0.75rem' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesHistory.map((sale) => (
                                        <tr key={sale.Id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.75rem' }}>#{sale.Id}</td>
                                            <td style={{ padding: '0.75rem' }}>{sale.FechaFormato}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Bs. {sale.Total.toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.8rem',
                                                    background: sale.Estado === 'ANULADA' ? '#ef444420' : '#22c55e20',
                                                    color: sale.Estado === 'ANULADA' ? '#ef4444' : '#22c55e'
                                                }}>
                                                    {sale.Estado || 'COMPLETADA'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                {sale.Estado !== 'ANULADA' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleViewDetails(sale)}
                                                            style={{ background: '#64748b', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                                        >
                                                            Ver
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditStart(sale)}
                                                            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                                        >
                                                            Modificar
                                                        </button>
                                                        <button
                                                            onClick={() => handleVoid(sale.Id)}
                                                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                                        >
                                                            Anular
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {salesHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--secondary)' }}>No hay ventas registradas</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                isEditModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', width: '500px', border: '1px solid var(--card-border)' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Modificar Venta #{editingSale?.Id}</h2>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                                {editItems.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#888' }}>Bs. {item.price.toFixed(2)} c/u</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.85rem' }}>Cant:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.quantity}
                                                onChange={(e) => handleEditChangeQty(idx, e.target.value)}
                                                style={{ width: '60px', padding: '0.25rem', borderRadius: '0.3rem', border: '1px solid #555', background: '#222', color: 'white' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                <span>Nuevo Total:</span>
                                <span style={{ color: 'var(--success)' }}>
                                    Bs. {editItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{ background: 'transparent', border: '1px solid #555', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEditSave}
                                    style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', opacity: editItems.some(i => i.quantity < 0) ? 0.5 : 1 }}
                                    disabled={editItems.some(i => i.quantity < 0)}
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* View Details Modal */}
            {
                isViewModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', width: '500px', border: '1px solid var(--card-border)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2>Detalles Venta #{viewingSale?.Id}</h2>
                                <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                {viewItems.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                                                {item.quantity} x Bs. {item.price.toFixed(2)}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 'bold' }}>
                                            Bs. {(item.quantity * item.price).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                <span>Total Pagado:</span>
                                <span style={{ color: 'var(--success)' }}>
                                    Bs. {viewItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                                </span>
                            </div>

                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                style={{ width: '100%', marginTop: '1.5rem', background: 'var(--primary)', border: 'none', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
