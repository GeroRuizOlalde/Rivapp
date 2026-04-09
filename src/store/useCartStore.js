import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '../utils/logger';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      cartBranchId: null, // 🟢 NUEVO: Guardamos el ID de la sucursal dueña del carrito

      addItem: (item, branchId) => set((state) => {
        // 1. VALIDACIÓN DE SUCURSAL
        // Si ya hay cosas en el carrito Y son de otra sucursal...
        if (state.cart.length > 0 && state.cartBranchId !== branchId) {
            // Aquí podríamos retornar un error, pero por ahora simplemente 
            // NO agregamos el item para evitar mezclar pedidos.
            logger.warn('Conflicto de sucursales: el carrito tiene items de otra sucursal');
            // Retornamos el estado tal cual está (no hacemos nada)
            // Tip: En el futuro aquí activaremos un popup: "¿Quieres vaciar el carrito?"
            return state; 
        }

        // 2. Lógica normal de agregar
        const existingItem = state.cart.find((i) => i.uniqueId === item.uniqueId);
        
        // Si es el primer item, seteamos la sucursal
        const newBranchId = state.cart.length === 0 ? branchId : state.cartBranchId;

        if (existingItem) {
          return {
            cartBranchId: newBranchId,
            cart: state.cart.map((i) =>
              i.uniqueId === item.uniqueId ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        
        return { 
            cartBranchId: newBranchId,
            cart: [...state.cart, { ...item, quantity: 1 }] 
        };
      }),

      removeItem: (uniqueId) => set((state) => {
        const newCart = state.cart.filter((i) => i.uniqueId !== uniqueId);
        // Si vaciamos el carrito, reseteamos también la sucursal
        return {
            cart: newCart,
            cartBranchId: newCart.length === 0 ? null : state.cartBranchId
        };
      }),

      clearCart: () => set({ cart: [], cartBranchId: null }),

      updateQuantity: (uniqueId, change) => set((state) => ({
        cart: state.cart.map((item) => {
          if (item.uniqueId === uniqueId) {
            const newQuantity = item.quantity + change;
            return { ...item, quantity: Math.max(1, newQuantity) };
          }
          return item;
        }),
      })),
    }),
    {
      name: 'cart-storage',
    }
  )
);
