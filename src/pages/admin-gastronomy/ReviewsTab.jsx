import React from 'react';
import { Star } from 'lucide-react';

export default function ReviewsTab({ reviews, accentColor }) {
  return (
    <div className="animate-in fade-in">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reseñas</h1>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500">Aún no hay reseñas.</p>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={14} fill={s <= r.rating ? accentColor : "transparent"} color={s <= r.rating ? accentColor : "gray"} />
                    ))}
                  </div>
                  <h4 className="font-bold text-white">{r.customer_name}</h4>
                </div>
                <span className="text-[10px] text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-300 italic">"{r.review || 'Sin comentario'}"</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
