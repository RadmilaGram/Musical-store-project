import { useDispatch } from "react-redux";
import { openLogin, closeLogin } from "../store/uiSlice";

export const useLoginModal = () => {
  const dispatch = useDispatch();
  return {
    open: () => dispatch(openLogin()),
    close: () => dispatch(closeLogin()),
  };
};
