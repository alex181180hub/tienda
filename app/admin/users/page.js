
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { ChevronLeft, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import styles from './page.module.css';

export default function UsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        password: '',
        role: 'VENDEDOR',
        permissions: []
    });

    const definedModules = [
        { id: '/vender', label: 'Ventas' },
        { id: '/caja', label: 'Caja' },
        { id: '/comprar', label: 'Compras' },
        { id: '/stock', label: 'Inventario' },
        { id: '/reportes', label: 'Reportes' }
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data);
    };

    const handleEdit = (u) => {
        setEditingUser(u);
        const perms = JSON.parse(u.Permisos || '[]');
        setFormData({
            name: u.Nombre,
            password: u.Clave, // We show it for simplicity as requested, or keep blank
            role: u.Rol,
            permissions: perms
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        setFormData({ name: '', password: '', role: 'VENDEDOR', permissions: [] });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar usuario?')) return;
        await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
        fetchUsers();
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // VALIDATION
        if (!formData.name || !formData.role) return alert('Nombre y Rol son obligatorios');
        // Password required only for new users
        if (!editingUser && !formData.password) return alert('La contraseña es obligatoria para nuevos usuarios');

        // If admin, force all permissions
        const finalPermissions = formData.role === 'ADMIN' ? ['*'] : formData.permissions;

        const payload = {
            ...formData,
            permissions: finalPermissions,
            id: editingUser ? editingUser.Id : undefined
        };

        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await fetch('/api/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchUsers();
            } else {
                alert('Error al guardar');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    const togglePermission = (id) => {
        setFormData(prev => {
            if (prev.permissions.includes(id)) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== id) };
            } else {
                return { ...prev, permissions: [...prev.permissions, id] };
            }
        });
    };

    if (!user || user.role !== 'ADMIN') return <div className={styles.container}>Acceso Denegado</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/" style={{ color: '#94a3b8' }}><ChevronLeft size={24} /></Link>
                    <h1>Gestión de Usuarios</h1>
                </div>
                <button className="btn btn-primary" onClick={handleCreate} style={{ gap: '0.5rem' }}>
                    <Plus size={20} /> Nuevo Usuario
                </button>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Permisos</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.Id}>
                            <td>{u.Id}</td>
                            <td>{u.Nombre}</td>
                            <td>
                                <span className={`${styles.badge} ${u.Rol === 'ADMIN' ? styles.adminBadge : styles.userBadge}`}>
                                    {u.Rol}
                                </span>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                {JSON.parse(u.Permisos || '[]').includes('*') ? 'Acceso Total' : JSON.parse(u.Permisos || '[]').map(p => {
                                    const mod = definedModules.find(m => m.id === p);
                                    return mod ? mod.label : p;
                                }).join(', ')}
                            </td>
                            <td>
                                <div className={styles.actions}>
                                    <button onClick={() => handleEdit(u)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }}>
                                        <Edit2 size={18} />
                                    </button>
                                    {u.Id !== 1 && (
                                        <button onClick={() => handleDelete(u.Id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}><X /></button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Nombre de Usuario <span style={{ color: 'var(--danger)' }}>*</span>
                                </label>
                                <input
                                    className={styles.input}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Contraseña {!editingUser && <span style={{ color: 'var(--danger)' }}>*</span>}
                                </label>
                                <input
                                    className={styles.input}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingUser ? "(Dejar en blanco para mantener)" : ""}
                                    required={!editingUser}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Rol</label>
                                <select
                                    className={styles.input}
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="VENDEDOR">Vendedor</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>

                            {formData.role === 'VENDEDOR' && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Permisos de Pantalla</label>
                                    <div className={styles.checkboxGroup}>
                                        {definedModules.map(mod => (
                                            <label key={mod.id} className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(mod.id)}
                                                    onChange={() => togglePermission(mod.id)}
                                                />
                                                {mod.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
