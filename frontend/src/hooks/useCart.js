// src/hooks/useCart.js
import { useSelector, useDispatch } from "react-redux";
import { addItem, removeItem, clearCart } from "../store/cartSlice";

export function useCart() {
  const items   = useSelector((s) => s.cart.items);
  const dispatch = useDispatch();

  const add    = (item) => dispatch(addItem(item));
  const remove = (id)   => dispatch(removeItem(id));
  const clear  = ()     => dispatch(clearCart());

  const total  = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return { items, add, remove, clear, total };
}
