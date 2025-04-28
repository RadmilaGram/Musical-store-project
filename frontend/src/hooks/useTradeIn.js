// src/hooks/useTradeIn.js
import { useSelector, useDispatch } from 'react-redux';
import { addItem, removeItem, clearAll } from '../store/tradeInSlice';

export function useTradeIn() {
  const items = useSelector((state) => state.tradeIn.items);
  const dispatch = useDispatch();

  const add = (item) => dispatch(addItem(item));
  const remove = (id) => dispatch(removeItem(id));
  const clear = () => dispatch(clearAll());

  // селектор для общей скидки
  const total = items.reduce((sum, i) => sum + i.expectedDiscount, 0);

  return { items, add, remove, clear, total };
}
