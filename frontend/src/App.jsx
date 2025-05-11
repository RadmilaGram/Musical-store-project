// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Header from "./components/header/Header";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import Cart from "./pages/Cart";
import TradeIn from "./pages/TradeIn";
import Admin from "./pages/Admin";
import LoginPage from "./pages/LoginPage";

function App() {
  const { isLoggedIn, user } = useAuth();

  // только для админа (role === 1)
  const RequireAdmin = ({ children }) =>
    isLoggedIn ? children : <Navigate to="/" replace />;

  return (
    <>
      <Header />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />

        <Route
          path="/*"
          element={
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/category/:groupId" element={<CategoryPage />} />
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
          }
        />
      </Routes>
    </>
  );
}

export default App;
