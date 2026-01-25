import React from "react";
import { Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Stack,
  Button,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";

import logo from "/title_icon.png";
import { useAuth, useLogout } from "../../hooks/useAuth";
import { useLoginModal } from "../../hooks/useLoginModal";
import "./Header.css";

export default function Header() {
  const { isLoggedIn, user } = useAuth();
  const logout = useLogout();
  const { open } = useLoginModal();

  const role = Number(user?.role); // 🔒 привели к числу 1/2/...

  // базовое меню — как у тебя было
  const basePages = [
    { menuTitle: "Catalog", pageURL: "/" },
    { menuTitle: "Cart", pageURL: "/Cart" },
    { menuTitle: "Trade-in", pageURL: "/Trade-in" },
  ];

  if (user) {
    basePages.push({ menuTitle: "My orders", pageURL: "/my/orders" });
  }

  // Admin видит Admin; Courier (2) — свою зону; Admin также видит Courier
  if (role === 1) {
    basePages.push({ menuTitle: "Admin", pageURL: "/Admin" });
    basePages.push({ menuTitle: "Courier", pageURL: "/courier" }); // ← можно убрать, если пока не нужен
  } else if (role === 2) {
    basePages.push({ menuTitle: "Courier", pageURL: "/courier" });
  }

  const handleLogin = () => open();
  const handleLogout = () => logout();

  return (
    <AppBar position="static" className="headerLine">
      <Toolbar>
        <IconButton
          component={Link}
          to="/"
          size="large"
          edge="start"
          aria-label="home link"
          color="inherit"
        >
          <img src={logo} className="logo" alt="logo" />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Music Way
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          {basePages.map(({ menuTitle, pageURL }, idx) => (
            <Button
              key={idx}
              component={Link}
              to={pageURL}
              variant="text"
              color="inherit"
            >
              {menuTitle}
            </Button>
          ))}

          {isLoggedIn ? (
            <Button
              startIcon={<LogoutIcon />}
              color="inherit"
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <Button
              startIcon={<LoginIcon />}
              color="inherit"
              onClick={handleLogin}
            >
              Log in
            </Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
