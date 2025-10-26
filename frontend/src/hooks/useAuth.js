// src/hooks/useAuth.js
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { API_URL } from "../utils/apiService/ApiService";
import {
  authStart,
  authSuccess,
  authFailure,
  logout as logoutAction,
} from "../store/authSlice";
import { closeLogin } from "../store/uiSlice";

/**
 * Хук для чтения состояния авторизации из Redux
 * Совместим как с новым слайсом, так и с прежним isLoggedIn в state.auth (если остался)
 */
export function useAuth() {
  const {
    user,
    token,
    status,
    error,
    isLoggedIn: isLoggedInFromState,
  } = useSelector((state) => state.auth || {});
  const isLoggedIn =
    typeof isLoggedInFromState === "boolean"
      ? isLoggedInFromState
      : Boolean(token);

  return { user, token, status, error, isLoggedIn };
}

/**
 * Хук для логина: делает запрос, диспатчит экшены, сохраняет токен, закрывает попап
 */
export function useLogin() {
  const dispatch = useDispatch();

  return async function login({ email, password }) {
    try {
      dispatch(authStart());

      // запрос на бэкенд (оставляю твой путь /api/login; при необходимости поменяй на /auth/login)
      const { data } = await axios.post(`${API_URL}/api/login`, {
        email,
        password,
      });
      // ожидаем { user, token }
      const { user, token } = data || {};
      if (token) {
        localStorage.setItem("token", token);
      }

      dispatch(authSuccess({ user, token }));
      dispatch(closeLogin()); // закрываем popup после успеха
      return { user, token };
    } catch (e) {
      const message =
        e?.response?.data?.message || e?.message || "Не удалось выполнить вход";
      dispatch(authFailure(message));
      throw e; // пробрасываем, если вызывающему коду надо показать тост и т.п.
    }
  };
}

/**
 * Хук для логаута: чистит Redux и localStorage
 */
export function useLogout() {
  const dispatch = useDispatch();
  return function logout() {
    try {
      localStorage.removeItem("token");
    } catch {}
    dispatch(logoutAction());
  };
}
