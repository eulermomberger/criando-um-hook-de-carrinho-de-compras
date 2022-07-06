import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseStock = await api.get(`stock/${productId}`);
      const stock: Stock = responseStock.data;

      const newCart = [...cart];
      const productCart = newCart.find(({ id }) => id === productId);
      const amount = (productCart ? productCart.amount : 0) + 1;

      if (amount <= stock.amount) {
        if (productCart) {
          productCart.amount = amount;
        } else {
          const responseProduct = await api.get(`products/${productId}`);
          const product: Product = responseProduct.data;
          newCart.push({ ...product, amount });
        }
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const productIndex = cart.findIndex(({ id }) => id === productId);

      if (productIndex >= 0) {
        newCart.splice(productIndex, 1);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];
      const product = newCart.find(({ id }) => id === productId);
      if (product && amount > 0) {
        const responseStock = await api.get(`stock/${productId}`);
        const stock: Stock = responseStock.data;

        if (amount <= stock.amount) {
          product.amount = amount;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCart]));
          setCart([...newCart]);
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
