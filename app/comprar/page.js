'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Save, ScanBarcode } from 'lucide-react';
import styles from './page.module.css';

export default function ComprarPage() {
    const [activeTab, setActiveTab] = useState('existing'); // existing | new
    const [barcode, setBarcode] = useState('');
    const [products, setProducts] = useState([]); // All products for dropdown
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        category: '',
        cost: '',
        price: '',
        quantity: '',
        quantity: '',
        minStock: '',
        supplier: '',
        unit: 'u'
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [cart, setCart] = useState([]); // Purchase Cart
    const [cartSupplier, setCartSupplier] = useState(''); // Shared supplier for cart

    // Fetch all products for the helper dropdown
    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                // Normalize keys just in case or use as is (SQL usually returns PascalCase)
                setProducts(data);
            })
            .catch(err => console.error(err));
    }, []);

    const populateProduct = (product) => {
        setSelectedProduct(product);
        setBarcode(product.CodigoBarras || '');
        setFormData(prev => ({
            ...prev,
            id: product.Id,
            name: product.Nombre,
            category: product.Categoria,
            price: product.PrecioVenta,
            cost: product.Costo,
            minStock: product.StockMinimo
        }));
        setActiveTab('existing');
    };

    const handleScan = async () => {
        if (!barcode) return;
        try {
            const res = await fetch(`/api/products/barcode/${barcode}`);
            if (res.ok) {
                const product = await res.json();
                setSelectedProduct(product);
                setFormData(prev => ({
                    ...prev,
                    id: product.Id,
                    name: product.Nombre,
                    category: product.Categoria,
                    price: product.PrecioVenta, // Suggest current price
                    cost: product.Costo,
                    minStock: product.StockMinimo
                }));
                // Switch to existing tab if found
                setActiveTab('existing');
            } else {
                alert('Producto no encontrado. Puede crearlo en la pestaña Nuevo Producto.');
                setActiveTab('new');
                // Pre-fill barcode
                setFormData(prev => ({ ...prev, name: '', id: null }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Add item to cart
    const handleAddToCart = () => {
        if (!selectedProduct || !formData.quantity) return alert("Seleccione producto y cantidad");

        const newItem = {
            id: selectedProduct.Id,
            name: selectedProduct.Nombre,
            quantity: parseFloat(formData.quantity),
            cost: parseFloat(formData.cost || 0),
            price: parseFloat(formData.price || 0),
            subtotal: parseFloat(formData.quantity) * parseFloat(formData.cost || 0)
        };

        setCart([...cart, newItem]);
        // Reset form but keep filtering or supplier?
        setFormData(prev => ({ ...prev, quantity: '', cost: '', price: '' }));
        setBarcode('');
        setSelectedProduct(null);
    };

    // Remove item from cart
    const handleRemoveFromCart = (idx) => {
        const newCart = [...cart];
        newCart.splice(idx, 1);
        setCart(newCart);
    };

    // Finalize Purchase (Cart)
    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!confirm('¿Confirmar ingreso de mercadería?')) return;

        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier: cartSupplier,
                    items: cart
                })
            });

            if (res.ok) {
                alert('Compra Registrada Correctamente');
                setCart([]);
                setCartSupplier('');
                // Maybe refresh products list if needed
            } else {
                alert('Error al registrar compra');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    // New Product Creation (Direct Save)
    const handleSaveNewProduct = async () => {
        if (!formData.name || !formData.price || !formData.cost) {
            return alert('Por favor complete el nombre, costo y precio del producto.');
        }
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigoBarras: barcode,
                    nombre: formData.name,
                    categoria: formData.category,
                    precioVenta: parseFloat(formData.price),
                    costo: parseFloat(formData.cost),
                    stockActual: parseFloat(formData.quantity),
                    stockMinimo: parseFloat(formData.minStock),
                    unidad: formData.unit
                })
            });

            if (res.ok) {
                alert('Producto Creado!');
                setFormData({
                    id: null, name: '', category: '', cost: '', price: '', quantity: '', minStock: '', supplier: '', unit: 'u'
                });
                setBarcode('');
            } else {
                alert('Error al guardar');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e, field) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', marginRight: '1rem' }}>
                    <ChevronLeft size={24} />
                </Link>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Ingreso de Mercadería</h1>
            </div>

            <div className={styles.tabs}>
                <div
                    className={`${styles.tab} ${activeTab === 'existing' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('existing')}
                >
                    Reponer Stock
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'new' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('new')}
                >
                    Nuevo Producto
                </div>
            </div>

            <div className={styles.formContainer}>
                <div className={styles.mainForm}>
                    <div className={styles.formGroup}>
                        <label>Código de Barras / SKU</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <ScanBarcode size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
                                <input
                                    type="text"
                                    className={styles.input}
                                    style={{ paddingLeft: '2.5rem' }}
                                    placeholder="Escanear o ingresar código..."
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                                />
                            </div>
                            <button className="btn" style={{ background: 'var(--card-border)', color: 'white' }} onClick={handleScan}>Buscar</button>
                        </div>

                        <div style={{ marginTop: '0.5rem' }}>
                            <small style={{ color: 'var(--secondary)', display: 'block', marginBottom: '0.25rem' }}>O buscar por nombre:</small>
                            <select
                                className={styles.input}
                                onChange={(e) => {
                                    const prod = products.find(p => p.Id == e.target.value);
                                    if (prod) populateProduct(prod);
                                }}
                                value={selectedProduct ? selectedProduct.Id : ''}
                            >
                                <option value="">-- Seleccionar de la lista --</option>
                                {products.map(p => (
                                    <option key={p.Id} value={p.Id}>
                                        {p.Nombre} (Stock: {p.StockActual})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {activeTab === 'new' && (
                        <>
                            <div className={styles.formGroup}>
                                <label>Nombre del Producto</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Ej: Coca Cola 2.5L"
                                    value={formData.name}
                                    onChange={(e) => handleChange(e, 'name')}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Categoría</label>
                                <input
                                    list="category-suggestions"
                                    type="text"
                                    className={styles.input}
                                    placeholder="Seleccionar o crear nueva"
                                    value={formData.category}
                                    onChange={(e) => handleChange(e, 'category')}
                                />
                                <datalist id="category-suggestions">
                                    {/* These are unique categories from existing products + some defaults */}
                                    <option value="Bebidas" />
                                    <option value="Snacks" />
                                    <option value="Limpieza" />
                                    <option value="Lácteos" />
                                    <option value="Despensa" />
                                    {[...new Set(products.map(p => p.Categoria))].filter(c => c && !['Bebidas', 'Snacks', 'Limpieza', 'Lácteos', 'Despensa'].includes(c)).map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                            </div>
                        </>
                    )}
                    {activeTab === 'new' && (
                        <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                            <label>Unidad de Medida</label>
                            <select
                                className={styles.input}
                                value={formData.unit}
                                onChange={(e) => handleChange(e, 'unit')}
                            >
                                <option value="u">Unidad (u)</option>
                                <option value="kg">Kilogramo (kg)</option>
                                <option value="g">Gramo (g)</option>
                                <option value="L">Litro (L)</option>
                                <option value="m">Metro (m)</option>
                                <option value="paq">Paquete (paq)</option>
                                <option value="caja">Caja</option>
                            </select>
                        </div>
                    )}

                    {activeTab === 'existing' && (
                        <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--primary)' }}>
                            <h3 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>Producto Seleccionado</h3>
                            <p style={{ fontSize: '1.1rem' }}>{selectedProduct ? `${selectedProduct.Nombre} (Stock: ${selectedProduct.StockActual})` : '-- Escanee un producto --'}</p>
                        </div>
                    )}

                    <div className={styles.row2}>
                        <div className={styles.formGroup}>
                            <label>Costo Unitario (Bs.)</label>
                            <input
                                type="number"
                                className={styles.input}
                                placeholder="0.00"
                                value={formData.cost}
                                onChange={(e) => handleChange(e, 'cost')}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Precio Venta (Bs.)</label>
                            <input
                                type="number"
                                className={styles.input}
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => handleChange(e, 'price')}
                            />
                        </div>
                    </div>

                    <div className={styles.row2}>
                        <div className={styles.formGroup}>
                            <label>Cantidad a Ingresar</label>
                            <input
                                type="number"
                                step="0.001"
                                className={styles.input}
                                placeholder="0"
                                value={formData.quantity}
                                onChange={(e) => handleChange(e, 'quantity')}
                            />
                        </div>
                        {activeTab === 'new' && (
                            <div className={styles.formGroup}>
                                <label>Stock Mínimo (Alerta)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    className={styles.input}
                                    placeholder="10"
                                    value={formData.minStock}
                                    onChange={(e) => handleChange(e, 'minStock')}
                                />
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Proveedor</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Opcional"
                            value={formData.supplier}
                            onChange={(e) => handleChange(e, 'supplier')}
                        />
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem', gap: '0.5rem' }}
                        onClick={activeTab === 'existing' ? handleAddToCart : handleSaveNewProduct}
                    >
                        {activeTab === 'existing' ? <Plus size={20} /> : <Save size={20} />}
                        {activeTab === 'existing' ? 'Agregar a la Lista' : 'Guardar Nuevo Producto'}
                    </button>
                </div>

                <div className={styles.summaryCard}>
                    <h3 style={{ marginBottom: '1rem' }}>Lista de Compra</h3>

                    {/* Cart Items List */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                        {cart.length === 0 ? (
                            <p style={{ color: 'var(--secondary)', fontStyle: 'italic' }}>Lista vacía</p>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #333', paddingBottom: '0.25rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{item.quantity} x Bs. {item.cost.toFixed(2)}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>Bs. {item.subtotal.toFixed(2)}</span>
                                        <button onClick={() => handleRemoveFromCart(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>x</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--secondary)' }}>Items:</span>
                        <span>{cart.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        <span>Total Compra:</span>
                        <span style={{ color: 'var(--success)' }}>
                            Bs. {cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                        </span>
                    </div>

                    {activeTab === 'existing' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Proveedor General (Opcional)</label>
                            <input
                                type="text"
                                className={styles.input}
                                style={{ fontSize: '0.9rem', padding: '0.5rem' }}
                                value={cartSupplier}
                                onChange={(e) => setCartSupplier(e.target.value)}
                                placeholder="Ej: Coca Cola"
                            />
                        </div>
                    )}

                    {activeTab === 'existing' && (
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', background: '#22c55e', gap: '0.5rem' }}
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                        >
                            <Save size={20} />
                            Confirmar Compra
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
