'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardCard({ href, title, description, icon: Icon, color }) {
    return (
        <Link href={href} style={{ width: '100%' }}>
            <motion.div
                className="card"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="card-icon" style={{ Color: color }}>
                    <Icon size={64} />
                </div>
                <h2>{title}</h2>
                <p>{description}</p>
            </motion.div>
        </Link>
    );
}
