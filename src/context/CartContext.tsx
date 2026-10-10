import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'itemSubtotal'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  cartSubtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'my_cdc_cart_items';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Gagal menyimpan keranjang belanja:', e);
    }
  }, [items]);

  const calculateItemSubtotal = (
    basePrice: number,
    extraSausCount: number,
    extraSausPrice: number,
    extraNasiCount: number,
    extraNasiPrice: number,
    quantity: number
  ) => {
    const singleUnitPrice = basePrice + extraSausCount * extraSausPrice + extraNasiCount * extraNasiPrice;
    return singleUnitPrice * quantity;
  };

  const addToCart = (itemData: Omit<CartItem, 'id' | 'itemSubtotal'>) => {
    setItems((prev) => {
      // Check if identical item already exists (same product, variant, extra saus, extra nasi, chicken part note)
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === itemData.productId &&
          i.variant === itemData.variant &&
          i.extraSausCount === itemData.extraSausCount &&
          (i.extraSausName || '') === (itemData.extraSausName || '') &&
          i.extraNasiCount === itemData.extraNasiCount &&
          i.chickenPartNote === itemData.chickenPartNote
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + itemData.quantity;
        const newSubtotal = calculateItemSubtotal(
          existing.basePrice,
          existing.extraSausCount,
          existing.extraSausPrice,
          existing.extraNasiCount,
          existing.extraNasiPrice,
          newQty
        );

        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          itemSubtotal: newSubtotal,
        };
        return updated;
      } else {
        const id = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const itemSubtotal = calculateItemSubtotal(
          itemData.basePrice,
          itemData.extraSausCount,
          itemData.extraSausPrice,
          itemData.extraNasiCount,
          itemData.extraNasiPrice,
          itemData.quantity
        );
        return [...prev, { ...itemData, id, itemSubtotal }];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const itemSubtotal = calculateItemSubtotal(
          i.basePrice,
          i.extraSausCount,
          i.extraSausPrice,
          i.extraNasiCount,
          i.extraNasiPrice,
          newQty
        );
        return { ...i, quantity: newQty, itemSubtotal };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = items.reduce((sum, item) => sum + item.itemSubtotal, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        cartSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
