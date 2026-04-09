import { CheckCircle, Edit, Plus, Trash2, TrendingUp, XCircle, Zap } from 'lucide-react';

export default function MenuTab({
  selectedCategory,
  setSelectedCategory,
  menuItems,
  onOpenPriceModal,
  onOpenCreateProductModal,
  onOpenPromoModal,
  onToggleAvailability,
  onOpenEditProductModal,
  onDeleteProduct,
}) {
  const categories = Array.from(new Set(menuItems.map((item) => item.category))).filter(Boolean);
  const visibleItems = menuItems.filter((item) => (selectedCategory === 'Todos' ? true : item.category === selectedCategory));

  return (
    <div className="animate-in fade-in">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion del Menu</h1>
        <div className="flex gap-2">
          <button
            onClick={onOpenPriceModal}
            className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 font-bold flex items-center gap-2"
          >
            <TrendingUp size={16} /> Precios
          </button>
          <button
            onClick={onOpenCreateProductModal}
            className="px-6 py-2 rounded-xl font-bold flex items-center gap-2 text-black"
            style={{ backgroundColor: '#d0ff00' }}
          >
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('Todos')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
            selectedCategory === 'Todos' ? 'bg-white text-black' : 'bg-[#1a1a1a] text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              selectedCategory === category ? 'bg-white text-black' : 'bg-[#1a1a1a] text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <img src={item.image || 'https://placehold.co/100'} className="w-12 h-12 rounded-lg object-cover bg-black/40 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{item.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onOpenPromoModal(item)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all"
                title="Crear Promocion"
              >
                <Zap size={16} />
              </button>
              <div className="bg-black/30 px-3 py-1 rounded-lg border border-white/5 font-mono text-sm font-bold w-20 text-center">${item.price}</div>
              <button
                onClick={() => onToggleAvailability(item.id, 'available', !item.available)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
                  item.available ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}
              >
                {item.available ? <CheckCircle size={16} /> : <XCircle size={16} />}
              </button>
              <button
                onClick={() => onOpenEditProductModal(item)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDeleteProduct(item.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
