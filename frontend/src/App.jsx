// src/App.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/header/Header";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import Cart from "./pages/Cart";
import TradeIn from "./pages/TradeIn";
import Admin from "./pages/Admin";
import LoginPage from "./pages/LoginPage";

function App() {
  const user = useSelector((state) => state.user.user);

  // если нет пользователя → редирект на /login
  const RequireAuth = ({ children }) =>
    user ? children : <Navigate to="/login" replace />;

  // только для админа (role === 1)
  const RequireAdmin = ({ children }) =>
    user?.role === 1 ? children : <Navigate to="/" replace />;

  return (
    <>
    <Header />
    <Routes>
      {/* логин открыт всегда, если уже в системе — отправим на главную */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* всё прочее доступно лишь тем, кто залогинен */}
      
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/category/:groupId"
                element={<CategoryPage />}
              />
              <Route path="/cart" element={<Cart />} />
              <Route path="/trade-in" element={<TradeIn />} />

              {/* админка — только для role===1 */}
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <Admin />
                  </RequireAdmin>
                }
              />

              {/* несуществующие маршруты — на главную */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RequireAuth>
        }
      />
    </Routes>
    </>
  );
}

export default App;
