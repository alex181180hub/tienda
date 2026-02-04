'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, Trash2 } from 'lucide-react';
import styles from './page.module.css';



export default function VenderPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch products from API
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                // Mapper SQL fields to Frontend fields if necessary (Capitalization usually differs)
                // SQL Server returns PascalCase usually (Id, Nombre), Frontend uses lowercase usually.
                // Let's normalize to standard lowercase for frontend usage
                const normalized = data.map(p => ({
                    id: p.Id,
                    name: p.Nombre,
                    price: p.PrecioVenta,
                    category: p.Categoria,
                    stock: p.StockActual,
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

        try {
            const total = calculateTotal();
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    total: total
                })
            });

            if (res.ok) {
                alert(`Venta x Bs. ${total.toFixed(2)} Registrada con Éxito!`);
                setCart([]);
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

                <div className={styles.totalSection}>
                    <div className={styles.totalRow}>
                        <span>Total</span>
                        <span>Bs. {calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                        className={styles.payButton}
                        onClick={handlePay}
                        disabled={cart.length === 0}
                    >
                        COBRAR
                    </button>
                </div>
            </div>
        </div>
    );
}
