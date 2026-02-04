'use client';
import { useAuth } from './context/AuthContext';
import { ShoppingCart, PackagePlus, Boxes, BarChart3, Settings, Archive, LogOut, Users } from 'lucide-react';
import DashboardCard from '@/components/DashboardCard';

export default function Home() {
  const { user, logout } = useAuth();

  if (!user) return null; // Or a loading spinner, AuthContext handles redirect

  const menuItems = [
    {
      title: 'Vender',
      description: 'Punto de Venta / Facturación',
      href: '/vender',
      icon: ShoppingCart,
      color: '#3b82f6'
    },
    {
      title: 'Caja',
      description: 'Arqueo y Cierre Diario',
      href: '/caja',
      icon: Archive,
      color: '#ec4899'
    },
    {
      title: 'Comprar',
      description: 'Ingreso de Mercadería',
      href: '/comprar',
      icon: PackagePlus,
      color: '#22c55e'
    },
    {
      title: 'Stock',
      description: 'Gestión de Inventario',
      href: '/stock',
      icon: Boxes,
      color: '#eab308'
    },
    {
      title: 'Reportes',
      description: 'Estadísticas y Ventas',
      href: '/reportes',
      icon: BarChart3,
      color: '#a855f7'
    }
  ];

  // Filter items based on permissions
  const allowedItems = menuItems.filter(item => {
    if (user.role === 'ADMIN') return true;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(item.href);
  });

  return (
    <main className="container">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Sistema POS
          </h1>
          <p style={{ color: 'var(--secondary)' }}>Hola, {user.name} ({user.role})</p>
        </div>
        <button
          onClick={logout}
          className="btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#334155' }}
        >
          <LogOut size={20} />
          Salir
        </button>
      </header>

      <div className="grid-dashboard">
        {allowedItems.map((item) => (
          <DashboardCard
            key={item.href}
            title={item.title}
            description={item.description}
            href={item.href}
            icon={item.icon}
            color={item.color}
          />
        ))}

        {user.role === 'ADMIN' && (
          <>
            <DashboardCard
              key="/users"
              title="Usuarios"
              description="Gestión de Usuarios"
              href="/admin/users"
              icon={Users}
              color="#64748b"
            />
            <DashboardCard
              key="/settings"
              title="Configuración"
              description="Apariencia y Sistema"
              href="/admin/settings"
              icon={Settings}
              color="#f59e0b"
            />
          </>
        )}
      </div>
    </main>
  );
}
