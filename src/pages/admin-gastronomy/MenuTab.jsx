import { CheckCircle2, Edit, Plus, Trash2, TrendingUp, XCircle, Zap } from 'lucide-react';
import Button from '../../components/shared/ui/Button';
import Eyebrow from '../../components/shared/ui/Eyebrow';

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
  const visibleItems = menuItems.filter((item) =>
    selectedCategory === 'Todos' ? true : item.category === selectedCategory
  );

  return (
    <div className="anim-rise">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Eyebrow>Catálogo</Eyebrow>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            Tu <em className="display-italic text-acid">menú</em>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={onOpenPriceModal} variant="outline" size="md">
            <TrendingUp className="h-4 w-4" /> Precios masivos
          </Button>
          <Button onClick={onOpenCreateProductModal} variant="acid" size="md">
            <Plus className="h-4 w-4" /> Nuevo
          </Button>
        </div>
      </header>

      {/* Categorías */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('Todos')}
          className={`mono whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all ${
            selectedCategory === 'Todos'
              ? 'bg-acid text-ink'
              : 'border border-rule-strong bg-ink-2 text-text-muted hover:border-text-muted hover:text-text'
          }`}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`mono whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all ${
              selectedCategory === category
                ? 'bg-acid text-ink'
                : 'border border-rule-strong bg-ink-2 text-text-muted hover:border-text-muted hover:text-text'
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
            className="group flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-rule-strong bg-ink-2 p-3 transition-colors hover:border-text-muted"
          >
            <div className="flex min-w-0 items-center gap-4">
              <img
                src={item.image || 'https://placehold.co/100'}
                alt={item.name}
                className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] object-cover"
              />
              <div className="min-w-0">
                <h3 className="display truncate text-lg text-text">{item.name}</h3>
                <p className="mono text-[10px] uppercase tracking-[0.22em] text-text-subtle">
                  {item.category}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => onOpenPromoModal(item)}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-acid/20 bg-acid/10 text-acid transition-all hover:bg-acid hover:text-ink"
                title="Crear promoción"
              >
                <Zap className="h-4 w-4" />
              </button>
              <div className="num w-20 rounded-[var(--radius-sm)] border border-rule bg-ink-3 px-3 py-1.5 text-center text-sm font-semibold text-text">
                ${item.price}
              </div>
              <button
                onClick={() => onToggleAvailability(item.id, 'available', !item.available)}
                className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border transition-all ${
                  item.available
                    ? 'border-acid/30 bg-acid/10 text-acid hover:bg-acid hover:text-ink'
                    : 'border-signal/30 bg-signal/10 text-signal hover:bg-signal hover:text-white'
                }`}
              >
                {item.available ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </button>
              <button
                onClick={() => onOpenEditProductModal(item)}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-rule bg-white/5 text-ml-soft transition-all hover:border-ml hover:bg-ml hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteProduct(item.id)}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-signal/30 bg-signal/10 text-signal transition-all hover:bg-signal hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {visibleItems.length === 0 && (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-rule-strong p-16 text-center">
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-text-subtle">
              Sin productos en esta categoría
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
