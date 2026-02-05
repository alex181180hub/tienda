'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Save, Printer } from 'lucide-react';
import styles from './page.module.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CajaPage() {
    const [systemTotal, setSystemTotal] = useState(0);
    const [expectedCash, setExpectedCash] = useState(0);
    const [expectedQR, setExpectedQR] = useState(0);

    const [realTotal, setRealTotal] = useState('');
    const [notes, setNotes] = useState('');
    const [isClosed, setIsClosed] = useState(false);

    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);

    useEffect(() => {
        fetch('/api/cash-count')
            .then(res => res.json())
            .then(data => {
                setSystemTotal(Number(data.expectedTotal || 0)); // Total General (Cash + QR)
                setExpectedCash(Number(data.expected || 0));     // Only Cash
                setExpectedQR(Number(data.expectedQR || 0));     // Only QR
                setSales(data.sales || []);
                setPurchases(data.purchases || []);
            });
    }, []);

    // Difference is calculated against CASH only, as QR is virtual
    const difference = (parseFloat(realTotal || 0) - expectedCash);

    const handleClose = async () => {
        if (!realTotal && realTotal !== 0) return alert('Ingrese el monto real en Efectivo');
        if (!confirm('¿Seguro que desea cerrar caja?')) return;

        try {
            const res = await fetch('/api/cash-count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemTotal: expectedCash, // We close against Cash
                    realTotal: parseFloat(realTotal),
                    notes: `${notes} | (Ventas QR: ${expectedQR})`
                })
            });

            if (res.ok) {
                alert('Caja Cerrada Exitosamente');
                setIsClosed(true);
                generateZReport();
            }
        } catch (error) {
            console.error(error);
            alert('Error al cerrar caja');
        }
    };

    const generateZReport = () => {
        const doc = new jsPDF();

        // Helper to sum
        const totalPurchases = purchases.reduce((sum, item) => sum + item.Total, 0);

        doc.setFontSize(18);
        doc.text("Reporte Z - Cierre de Caja", 105, 20, null, null, 'center');

        doc.setFontSize(12);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 40);

        doc.text("Resumen de Ventas:", 20, 60);
        doc.text(`(+) Total General:  Bs. ${systemTotal.toFixed(2)}`, 30, 70);
        doc.text(`    - Efectivo:     Bs. ${expectedCash.toFixed(2)}`, 30, 80);
        doc.text(`    - QR/Bancos:    Bs. ${expectedQR.toFixed(2)}`, 30, 90);

        doc.text("Resumen de Caja (Efectivo):", 20, 110);
        doc.text(`(+) Entradas Efec.: Bs. ${expectedCash.toFixed(2)}`, 30, 120);
        doc.text(`(-) Salidas/Gastos: Bs. ${totalPurchases.toFixed(2)}`, 30, 130);

        const theoreticalCash = expectedCash - totalPurchases;
        doc.text(`(=) En Caja Teórico:Bs. ${theoreticalCash.toFixed(2)}`, 30, 140);

        doc.text(`Efectivo Real:      Bs. ${parseFloat(realTotal).toFixed(2)}`, 120, 140);

        const diffVal = parseFloat(realTotal) - theoreticalCash;
        const diffText = diffVal >= 0 ? `+ ${diffVal.toFixed(2)}` : `${diffVal.toFixed(2)}`;

        doc.text(`Diferencia:         Bs. ${diffText}`, 120, 150);

        if (notes) {
            doc.text("Notas:", 20, 165);
            doc.text(notes, 30, 175);
        }

        doc.text("Detalle de Ventas:", 20, 190);

        autoTable(doc, {
            startY: 195,
            head: [['Hora', 'Ticket #', 'Método', 'Monto']],
            body: sales.map(s => [s.Hora, `#${s.Id}`, s.MetodoPago || 'EFECTIVO', `Bs. ${s.Total.toFixed(2)}`]),
            foot: [['', '', 'Total Ventas', `Bs. ${systemTotal.toFixed(2)}`]],
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
            footStyles: { fillColor: [22, 163, 74], fontStyle: 'bold' }
        });

        const finalY = doc.lastAutoTable.finalY || 195;

        doc.text("Resumen de Compras / Gastos:", 20, finalY + 15);

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Hora', 'Prov.', 'Monto']],
            body: purchases.map(p => [p.Hora, p.Proveedor, `Bs. ${p.Total.toFixed(2)}`]),
            foot: [['', 'Total Compras', `Bs. ${totalPurchases.toFixed(2)}`]],
            theme: 'striped',
            headStyles: { fillColor: [239, 68, 68] },
            footStyles: { fillColor: [239, 68, 68], fontStyle: 'bold' }
        });

        doc.save(`cierre_caja_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/" style={{ color: '#94a3b8' }}>
                    <ChevronLeft size={32} />
                </Link>
                <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Arqueo de Caja</h1>
            </div>

            <div className={styles.card}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                    <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#93c5fd' }}>Ventas Totales</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Bs. {systemTotal.toFixed(2)}</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#86efac' }}>Solo Efectivo</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>Bs. {expectedCash.toFixed(2)}</div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#d8b4fe' }}>QR / Bancos</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#a855f7' }}>Bs. {expectedQR.toFixed(2)}</div>
                    </div>
                </div>

                <div className={styles.row}>
                    <span>Total Real (Dinero en Caja)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>Bs.</span>
                        <input
                            type="number"
                            className={styles.input}
                            value={realTotal}
                            onChange={(e) => setRealTotal(e.target.value)}
                            disabled={isClosed}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className={styles.row} style={{ marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                    <span>Diferencia (Contra Efectivo Esperado)</span>
                    <span className={`${styles.diff} ${difference === 0 ? styles.diff_neutral : difference > 0 ? styles.diff_positive : styles.diff_negative}`}>
                        {difference > 0 ? '+' : ''} Bs. {difference.toFixed(2)}
                    </span>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Notas / Observaciones</label>
                    <textarea
                        style={{ width: '100%', background: '#0f172a', border: '1px solid var(--card-border)', color: 'white', padding: '1rem', borderRadius: '0.5rem', minHeight: '100px' }}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={isClosed}
                    />
                </div>

                {!isClosed ? (
                    <button className={styles.btn} style={{ marginTop: '2rem' }} onClick={handleClose}>
                        <Save size={20} style={{ marginRight: '0.5rem' }} />
                        Cerrar Caja e Imprimir Reporte
                    </button>
                ) : (
                    <div style={{ marginTop: '2rem', textAlign: 'center', color: '#22c55e', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        ✅ Caja Cerrada
                        <button
                            onClick={generateZReport}
                            style={{ display: 'block', margin: '1rem auto', background: 'transparent', border: '1px solid #22c55e', color: '#22c55e', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                        >
                            <Printer size={16} style={{ marginRight: '0.5rem' }} /> Re-imprimir Reporte
                        </button>
                    </div>
                )}
            </div>

            {/* Daily Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className={styles.card} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#4ade80' }}>Ventas del Día</h3>
                    <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                        <tbody>
                            {sales.map(s => (
                                <tr key={s.Id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '0.5rem' }}>{s.Hora}</td>
                                    <td style={{ padding: '0.5rem' }}>T-{s.Id} ({s.MetodoPago === 'QR' ? 'QR' : '$'})</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>Bs. {s.Total.toFixed(2)}</td>
                                </tr>
                            ))}
                            {sales.length === 0 && <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Sin ventas</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className={styles.card} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#f87171' }}>Compras del Día</h3>
                    <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                        <tbody>
                            {purchases.map(p => (
                                <tr key={p.Id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '0.5rem' }}>{p.Hora}</td>
                                    <td style={{ padding: '0.5rem' }}>{p.Proveedor}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>Bs. {p.Total.toFixed(2)}</td>
                                </tr>
                            ))}
                            {purchases.length === 0 && <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Sin compras</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
