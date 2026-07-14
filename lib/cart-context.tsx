"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CartItem = {
  id: string;
  title: string;
  priceCents: number;
  currency: string;
};

type CartContextValue = {
  items: CartItem[];
  isInCart: (id: string) => boolean;
  toggle: (item: CartItem) => void;
  clear: () => void;
  totalCents: number;
  currency: string;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(clientSlug: string) {
  return `cart:${clientSlug}`;
}

export function CartProvider({
  clientSlug,
  purchasedIds = [],
  children,
}: {
  clientSlug: string;
  purchasedIds?: string[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(clientSlug));
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        setItems(parsed.filter((item) => !purchasedIds.includes(item.id)));
      }
    } catch {
      // ignore malformed/blocked storage
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSlug]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey(clientSlug), JSON.stringify(items));
  }, [items, clientSlug, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const isInCart = (id: string) => items.some((item) => item.id === id);
    const toggle = (item: CartItem) => {
      setItems((prev) =>
        prev.some((i) => i.id === item.id)
          ? prev.filter((i) => i.id !== item.id)
          : [...prev, item]
      );
    };
    const clear = () => setItems([]);
    const totalCents = items.reduce((sum, i) => sum + i.priceCents, 0);
    const currency = items[0]?.currency ?? "usd";

    return { items, isInCart, toggle, clear, totalCents, currency };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
