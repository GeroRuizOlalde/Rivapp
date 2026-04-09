import { PieChart as PieIcon, ShoppingBag, Users, Utensils, Bike, Ticket, MessageSquare, History, CreditCard, Settings } from 'lucide-react';

export const BELL_SOUND = '/sounds/bell.mp3';

export const ALL_TABS = [
  { id: 'dashboard', label: 'Panel', icon: PieIcon },
  { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { id: 'team', label: 'Equipo', icon: Users, proOnly: true },
  { id: 'crm', label: 'Clientes', icon: Users, proOnly: true },
  { id: 'menu', label: 'Menu', icon: Utensils },
  { id: 'riders', label: 'Riders', icon: Bike, proOnly: true },
  { id: 'coupons', label: 'Cupones', icon: Ticket, proOnly: true },
  { id: 'reviews', label: 'Resenas', icon: MessageSquare, proOnly: true },
  { id: 'history', label: 'Historial', icon: History, proOnly: true },
  { id: 'billing', label: 'Suscripcion', icon: CreditCard },
  { id: 'config', label: 'Ajustes', icon: Settings },
];
