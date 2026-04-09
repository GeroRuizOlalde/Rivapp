import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase/client';

export function useNotifications(storeId, { soundEnabled = false } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from('store_notifications')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoading(false);
  }, [storeId]);

  // Escuchar nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!storeId) return;
    void (async () => {
      await fetchNotifications();
    })();

    const channel = supabase.channel(`store_notif_${storeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'store_notifications',
        filter: `store_id=eq.${storeId}`
      }, (payload) => {
        const newNotif = payload.new;
        // Agregar a la lista
        setNotifications(prev => [newNotif, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);

        // Solo mostrar toast si no es la carga inicial
        if (!isFirstLoad.current) {
          // Agregar toast
          const toastId = newNotif.id;
          setToasts(prev => [...prev, { ...newNotif, toastId }]);

          if (soundEnabled) playSound();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

          // Auto-remover toast después de 5 segundos
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.toastId !== toastId));
          }, 5000);
        }
      })
      .subscribe();

    // Marcar como no primera carga después de un breve delay
    const timer = setTimeout(() => { isFirstLoad.current = false; }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timer);
    };
  }, [storeId, fetchNotifications, soundEnabled]);

  const dismissToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  const markAsRead = async (id) => {
    await supabase.from('store_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!storeId) return;
    await supabase.from('store_notifications').update({ is_read: true }).eq('store_id', storeId).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id) => {
    await supabase.from('store_notifications').delete().eq('id', id);
    setNotifications(prev => {
      const removed = prev.find(n => n.id === id);
      if (removed && !removed.is_read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(n => n.id !== id);
    });
  };

  const clearAll = async () => {
    if (!storeId) return;
    await supabase.from('store_notifications').delete().eq('store_id', storeId);
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications, unreadCount, loading,
    toasts, dismissToast,
    markAsRead, markAllAsRead, deleteNotification, clearAll,
    refresh: fetchNotifications
  };
}

// Mapeo tipo → tab del admin
export const NOTIFICATION_TAB_MAP = {
  new_order: 'orders',
  order_status: 'orders',
  new_appointment: 'inbox',
  appointment_status: 'agenda',
  low_stock: 'menu',
  new_review: 'reviews',
  new_member: 'team',
  payment_received: 'dashboard',
  system: 'dashboard',
};

function playSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // noop
  }
}
