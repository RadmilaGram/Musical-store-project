// src/hooks/useTradeIn.js
import { useSelector, useDispatch } from 'react-redux';
import {
  resetTradeIn,
  addItem,
  removeItem,
  incrementQty,
  decrementQty,
  clearAll,
} from '../store/tradeInSlice';

export function useTradeIn() {
  const items = useSelector((state) => state.tradeIn.items);
  const dispatch = useDispatch();

  const add = (item) => dispatch(addItem(item));
  const remove = (tradeInKey) => dispatch(removeItem({ tradeInKey }));
  const increment = (tradeInKey) => dispatch(incrementQty({ tradeInKey }));
  const decrement = (tradeInKey) => dispatch(decrementQty({ tradeInKey }));
  const clear = () => dispatch(clearAll());
  const reset = () => dispatch(resetTradeIn());

  // селектор для общей скидки
  const total = items.reduce(
    (sum, i) => sum + i.expectedDiscount * (i.quantity ?? 1),
    0
  );

  return { items, add, remove, increment, decrement, clear, reset, total };
}
