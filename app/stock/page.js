'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Search, Edit2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import styles from './page.module.css';



export default function StockPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [inventory, setInventory] = useState([]);



    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                const normalized = data.map(p => ({
                    id: p.Id,
                    name: p.Nombre,
                    price: p.PrecioVenta,
                    stock: p.StockActual,
                    minStock: p.StockMinimo,
                    category: p.Categoria,
                    unit: p.Unidad || 'u'
                }));
                setInventory(normalized);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getStockStatus = (stock, min) => {
        if (stock === 0) return { label: 'Sin Stock', class: styles.statusCritical, icon: XCircle };
        if (stock <= min) return { label: 'Bajo', class: styles.statusLow, icon: AlertTriangle };
        return { label: 'Normal', class: styles.statusNormal, icon: CheckCircle2 };
    };

    const filteredItems = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Inventario</h1>
                </div>
                <Link href="/comprar" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    + Nuevo Producto
                </Link>
            </div>

            <div className={styles.stockContainer}>
                <div className={styles.controls}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o categoría..."
                            className={styles.searchInput}
                            style={{ paddingLeft: '2.5rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th style={{ textAlign: 'right' }}>Precio Venta</th>
                                <th style={{ textAlign: 'center' }}>Stock Actual</th>
                                <th style={{ textAlign: 'center' }}>Estado</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => {
                                const status = getStockStatus(item.stock, item.minStock);
                                const StatusIcon = status.icon;

                                return (
                                    <tr key={item.id} className={styles.row}>
                                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                                        <td style={{ color: 'var(--secondary)' }}>{item.category}</td>
                                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>
                                            Bs. {item.price.toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                            {item.stock} {item.unit} <span style={{ fontSize: '0.8em', color: 'var(--secondary)' }}>/ {item.minStock}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`${styles.stockBadge} ${status.class}`}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <StatusIcon size={12} />
                                                    {status.label}
                                                </div>
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className={styles.actionBtn}>
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
