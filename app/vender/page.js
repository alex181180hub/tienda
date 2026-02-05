'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, Trash2, Printer, CreditCard, Banknote } from 'lucide-react';
import styles from './page.module.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function VenderPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [customerName, setCustomerName] = useState('');
    const [customerNit, setCustomerNit] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('EFECTIVO'); // EFECTIVO, QR

    // Fetch products from API
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                const normalized = data.map(p => ({
                    id: p.Id,
                    name: p.Nombre,
                    price: Number(p.PrecioVenta),
                    category: p.Categoria,
                    stock: Number(p.StockActual),
                    unit: p.Unidad
                }));
                setProducts(normalized);
            }
        } catch (error) {
            console.error("Error loading products", error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === product.id);
            if (existingItem) {
                return currentCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...currentCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(currentCart => currentCart.filter(item => item.id !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePay = async () => {
        if (cart.length === 0) return;

        if (!customerName.trim()) {
            if (!confirm('¿Realizar venta sin nombre de cliente?')) return;
        }

        try {
            const total = calculateTotal();
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    total: total,
                    customerName: customerName || 'Sin Nombre',
                    customerNit: customerNit || '0',
                    paymentMethod
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Venta registrada con éxito ID: ${data.ventaId}`);
                printReceipt(data.ventaId, total);
                setCart([]);
                setCustomerName('');
                setCustomerNit('');
                // Refresh stock
                fetchProducts();
            } else {
                alert('Error al procesar la venta');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    const printReceipt = (saleId, total) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200] // Thermal printer width approx
        });

        doc.setFontSize(10);
        doc.text("TIENDA POS", 40, 10, { align: 'center' });
        doc.setFontSize(8);
        doc.text("Nit: 123456789", 40, 15, { align: 'center' });
        doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 5, 25);
        doc.text(`Venta #: ${saleId}`, 5, 30);
        doc.text(`Cliente: ${customerName || 'Sin Nombre'}`, 5, 35);
        doc.text(`NIT/CI: ${customerNit || '0'}`, 5, 40);

        doc.line(5, 42, 75, 42);

        let y = 47;
        cart.forEach(item => {
            const lineTotal = (item.price * item.quantity).toFixed(2);
            // Name
            doc.text(`${item.name}`, 5, y);
            y += 4;
            // Qty x Price = Total
            doc.text(`${item.quantity} x ${item.price.toFixed(2)}`, 5, y);
            doc.text(`${lineTotal}`, 75, y, { align: 'right' });
            y += 5;
        });

        doc.line(5, y, 75, y);
        y += 5;

        doc.setFontSize(10);
        doc.text(`TOTAL: Bs. ${total.toFixed(2)}`, 75, y, { align: 'right' });
        y += 5;
        doc.setFontSize(8);
        doc.text(`Pago: ${paymentMethod}`, 75, y, { align: 'right' });

        // QR Code Placeholder if QR
        if (paymentMethod === 'QR') {
            y += 10;
            doc.text("[ QR PAGO ]", 40, y, { align: 'center' });
            // In a real app, you'd generate the QR image here
        }

        y += 10;
        doc.text("Gracias por su compra", 40, y, { align: 'center' });

        doc.autoPrint();
        doc.output('dataurlnewwindow');
    };

    return (
        <div className={styles.container}>
            {/* Products Section */}
            <div className={styles.productsSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" className={styles.backButton}>
                        <ChevronLeft size={20} /> Menú Principal
                    </Link>
                    <div style={{ position: 'relative', width: '60%' }}>
                        <Search size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className={styles.searchBar}
                            style={{ paddingLeft: '2.5rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className={styles.productGrid}>
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className={styles.productCard}
                            onClick={() => addToCart(product)}
                        >
                            <div className={styles.productName}>{product.name}</div>
                            <div className={styles.productPrice}>Bs. {product.price.toFixed(2)} <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>/ {product.unit || 'u'}</span></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Section */}
            <div className={styles.cartSection}>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Ticket de Venta</h2>

                <div className={styles.cartList}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--secondary)', marginTop: '2rem' }}>
                            El carrito está vacío
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className={styles.cartItem}>
                                <div className={styles.cartItemInfo}>
                                    <span className={styles.cartItemTitle}>{item.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                        <span style={{ color: 'var(--secondary)', fontSize: '0.8rem' }}>Cant:</span>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0.001"
                                            value={item.quantity}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setCart(curr => curr.map(i => i.id === item.id ? { ...i, quantity: isNaN(val) ? 0 : val } : i));
                                            }}
                                            style={{ width: '70px', background: 'transparent', border: '1px solid var(--input-border)', color: 'var(--foreground)', padding: '2px', borderRadius: '4px' }}
                                        />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{item.unit || 'u'}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span className={styles.cartItemPrice}>Bs. {(item.price * item.quantity).toFixed(2)}</span>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Customer & Payment Info */}
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Nombre Cliente"
                            className={styles.searchBar}
                            style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem' }}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="NIT/CI"
                            className={styles.searchBar}
                            style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem' }}
                            value={customerNit}
                            onChange={(e) => setCustomerNit(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setPaymentMethod('EFECTIVO')}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: `1px solid ${paymentMethod === 'EFECTIVO' ? '#22c55e' : '#334155'}`,
                                background: paymentMethod === 'EFECTIVO' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                color: paymentMethod === 'EFECTIVO' ? '#22c55e' : '#94a3b8',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            <Banknote size={18} /> Efectivo
                        </button>
                        <button
                            onClick={() => setPaymentMethod('QR')}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: `1px solid ${paymentMethod === 'QR' ? '#3b82f6' : '#334155'}`,
                                background: paymentMethod === 'QR' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                color: paymentMethod === 'QR' ? '#3b82f6' : '#94a3b8',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            <CreditCard size={18} /> QR
                        </button>
                    </div>

                    <div className={styles.totalRow}>
                        <span>Total</span>
                        <span>Bs. {calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                        className={styles.payButton}
                        onClick={handlePay}
                        disabled={cart.length === 0}
                    >
                        COBRAR {paymentMethod === 'QR' ? '(QR)' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}
