import { useDispatch } from "react-redux";
import { registerUser } from "../utils/apiService/ApiService";
import { authStart, authSuccess, authFailure } from "../store/authSlice";

export function useRegister() {
  const dispatch = useDispatch();

  return async function register(payload) {
    try {
      dispatch(authStart());
      const data = await registerUser(payload);
      const { user } = data || {};
      dispatch(authSuccess({ user }));
      return { user };
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Не удалось зарегистрироваться";
      dispatch(authFailure(message));
      throw e;
    }
  };
}
