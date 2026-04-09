import { Plus } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

export default function ProductCard({ item, isOpen, onAdd, color }) {
  const { cart } = useCartStore();
  const quantity = cart.filter(p => p.id === item.id).reduce((acc, curr) => acc + curr.quantity, 0);
  const isOut = !item.has_infinite_stock && item.stock <= 0;
  const imageSrc = item.image && item.image.length > 5 ? item.image : 'https://placehold.co/400x400/222/white?text=Sin+Foto';
  const brandColor = color || '#d0ff00';

  return (
    <div className={`bg-[#1a1a1a] p-3 rounded-2xl border border-white/5 flex gap-4 transition-all hover:border-white/10 ${!isOpen || isOut ? 'opacity-50 grayscale' : ''}`}>
      <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-800">
        <img src={imageSrc} className="w-full h-full object-cover" alt={item.name} />
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h3 className="font-bold text-white text-base leading-tight mb-1">{item.name}</h3>
          <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-lg" style={{ color: brandColor }}>
            {item.has_variants ? 'Desde ' : ''}${item.has_variants && item.variants?.length > 0 ? parseFloat(item.variants[0].price).toLocaleString() : parseFloat(item.price).toLocaleString()}
          </span>
          {isOpen && !isOut ? (
            <button onClick={() => onAdd(item)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-black hover:scale-110 transition-transform relative">
              <Plus size={18} strokeWidth={3} />
              {quantity > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border-2 border-[#1a1a1a]">{quantity}</span>}
            </button>
          ) : (
            <span className="text-red-500 text-[10px] font-bold border border-red-500/30 px-2 py-1 rounded uppercase">{isOut ? 'AGOTADO' : 'CERRADO'}</span>
          )}
        </div>
      </div>
    </div>
  );
}
