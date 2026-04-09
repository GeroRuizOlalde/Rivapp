import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

export default function Cart({ onCheckout, color }) {
  const { cart } = useCartStore();
  const brandColor = color || '#d0ff00';
  const total = cart.reduce((acc, item) => acc + (parseFloat(item.finalPrice) * item.quantity), 0);
  const count = cart.reduce((acc, i) => acc + i.quantity, 0);

  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
      <div className="pointer-events-auto max-w-lg mx-auto">
        <button
          onClick={onCheckout}
          className="w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-black shadow-lg hover:scale-[1.02] transition-transform"
          style={{ backgroundColor: brandColor }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag size={22} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold">
                {count}
              </span>
            </div>
            <span>Ver Carrito</span>
          </div>
          <span className="text-lg font-black">${total.toLocaleString('es-AR')}</span>
        </button>
      </div>
    </div>
  );
}
