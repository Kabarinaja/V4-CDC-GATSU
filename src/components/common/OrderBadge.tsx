import React from 'react';
import { OrderStatus, PaymentStatus } from '../../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const map: Record<OrderStatus, { label: string; bg: string; text: string; dot: string }> = {
    pending_payment: {
      label: 'Menunggu Pembayaran',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
    },
    payment_verification: {
      label: 'Verifikasi Pembayaran',
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      dot: 'bg-blue-500 animate-pulse',
    },
    accepted: {
      label: 'Pesanan Diterima',
      bg: 'bg-indigo-50 border-indigo-200',
      text: 'text-indigo-800',
      dot: 'bg-indigo-500',
    },
    cooking: {
      label: 'Sedang Dimasak',
      bg: 'bg-orange-50 border-orange-200',
      text: 'text-orange-800',
      dot: 'bg-orange-500 animate-bounce',
    },
    packing: {
      label: 'Sedang Dikemas',
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-800',
      dot: 'bg-purple-500',
    },
    shipping: {
      label: 'Sedang Diantar Kurir',
      bg: 'bg-cyan-50 border-cyan-200',
      text: 'text-cyan-800',
      dot: 'bg-cyan-500 animate-pulse',
    },
    completed: {
      label: 'Pesanan Selesai',
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      dot: 'bg-emerald-500',
    },
    cancelled: {
      label: 'Dibatalkan',
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-800',
      dot: 'bg-rose-500',
    },
  };

  const item = map[status] || {
    label: status,
    bg: 'bg-stone-50 border-stone-200',
    text: 'text-stone-800',
    dot: 'bg-stone-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${item.bg} ${item.text}`}>
      <span className={`w-2 h-2 rounded-full ${item.dot}`}></span>
      <span>{item.label}</span>
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const map: Record<PaymentStatus, { label: string; bg: string }> = {
    pending_verification: {
      label: 'Bukti Perlu Diverifikasi',
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    verified: {
      label: 'Pembayaran Valid (QRIS)',
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    rejected: {
      label: 'Pembayaran Ditolak',
      bg: 'bg-rose-100 text-rose-900 border-rose-300',
    },
  };

  const item = map[status] || {
    label: status,
    bg: 'bg-stone-100 text-stone-800 border-stone-300',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.bg}`}>
      {item.label}
    </span>
  );
};
