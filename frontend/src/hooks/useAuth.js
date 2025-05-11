import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { API_URL } from "../utils/apiService/ApiService";
import { loginSuccess, logout as logoutAction } from "../store/authSlice";

/**
 * Хук для чтения состояния авторизации из Redux
 */
export function useAuth() {
  const { user, token, isLoggedIn } = useSelector((state) => state.auth);
  return { user, token, isLoggedIn };
}

/**
 * Хук для логина: делает запрос, сохраняет в Redux и в localStorage через подписку
 */
export function useLogin() {
  const dispatch = useDispatch();

  return async function login({ email, password }) {
    // делаем запрос на бэкенд
    const { data } = await axios.post(`${API_URL}/api/login`, {
      email,
      password,
    });
    // сохраняем в Redux
    dispatch(loginSuccess({ user: data.user, token: data.token }));
    // на этом localStorage уже обновится автоматически благодаря store.subscribe
  };
}

/**
 * Хук для логаута: чистит Redux (и localStorage)
 */
export function useLogout() {
  const dispatch = useDispatch();
  return function logout() {
    dispatch(logoutAction());
  };
}
