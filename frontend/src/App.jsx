// src/App.jsx
import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

// UI
import Header from "./components/header/Header";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import Cart from "./pages/Cart";
import TradeIn from "./pages/TradeIn";
import Admin from "./pages/Admin";

// Login popup (MUI + RHF + yup) — смонтируем у корня
import LoginDialog from "./components/LoginDialog";
// хук для открытия/закрытия попапа
import { useLoginModal } from "./hooks/useLoginModal";

// --- role helpers (подправь уровни ролей под свою модель) ---
const isAdmin = (user) => Number(user?.role) === 1;
const isCourier = (user) => Number(user?.role) === 2;

// --- Guard: если гость — открыть попап и ничего не рендерить ---
function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth();
  const { open } = useLoginModal();

  useEffect(() => {
    if (!isLoggedIn) open(); // показали модалку входа
  }, [isLoggedIn, open]);

  if (!isLoggedIn) return null; // не показываем страницу, пока нет логина
  return children;
}

// --- Guard по ролям (включая доступ админа ко всему) ---
function RequireRole({ children, roles }) {
  const { isLoggedIn, user } = useAuth();
  const { open } = useLoginModal();

  useEffect(() => {
    if (!isLoggedIn) open();
  }, [isLoggedIn, open]);

  if (!isLoggedIn) return null;

  // админ всегда имеет доступ
  if (isAdmin(user)) return children;

  // для остальных — проверяем, входит ли в список разрешённых
  const role = Number(user?.role);
  if (roles?.includes(role)) return children;

  // нет доступа — на главную
  return <Navigate to="/" replace />;
}

// --- Роут, который просто открывает модалку логина и уводит назад после успеха ---
// (если уже залогинен — редирект на /)
function LoginPopupRoute() {
  const { isLoggedIn } = useAuth();
  const { open } = useLoginModal();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    } else {
      open();
    }
    // если захочешь возвращаться на предыдущий роут после логина —
    // сохрани сюда location.state.from и обработай при authSuccess
  }, [isLoggedIn, open, navigate, location]);

  // визуально ничего не рисуем — только модалка
  return null;
}

// --- ВРЕМЕННЫЙ STUB для курьера (замени позже своей страницей) ---
function CourierStub() {
  return (
    <div style={{ padding: 16 }}>
      Курьерская зона (stub): заказы, ожидающие доставку.
    </div>
  );
}

function App() {
  const { isLoggedIn, user } = useAuth();

  return (
    <>
      <Header />

      <Routes>
        {/* login как попап */}
        <Route path="/login" element={<LoginPopupRoute />} />

        {/* публичные маршруты */}
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:groupId" element={<CategoryPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/trade-in" element={<TradeIn />} />

        {/* админка — доступна только админам */}
        <Route
          path="/admin"
          element={
            <RequireRole roles={[1]}>
              <Admin />
            </RequireRole>
          }
        />

        {/* курьер — доступ курьеру и админу */}
        <Route
          path="/courier"
          element={
            <RequireRole roles={[2]}>
              <CourierStub />
            </RequireRole>
          }
        />

        {/* пример защищённой клиентской страницы (если появится checkout и т.п.) */}
        {/* <Route
          path="/checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        /> */}

        {/* несуществующие маршруты — на главную */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Монтируем попап один раз у корня приложения */}
      <LoginDialog />
    </>
  );
}

export default App;
