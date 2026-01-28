import { useDispatch } from "react-redux";
import { changePassword } from "../utils/apiService/ApiService";
import {
  authStart,
  authFailure,
  logout as logoutAction,
} from "../store/authSlice";
import { resetTradeIn } from "../store/tradeInSlice";

export function useChangePassword() {
  const dispatch = useDispatch();

  return async function changePasswordAction(payload) {
    try {
      dispatch(authStart());
      await changePassword(payload);
      dispatch(logoutAction());
      dispatch(resetTradeIn());
      return { ok: true };
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Не удалось изменить пароль";
      dispatch(authFailure(message));
      throw e;
    }
  };
}
