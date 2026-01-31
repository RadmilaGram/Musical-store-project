import React from "react";
import { Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Stack,
  Button,
  Container,
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

  const role = Number(user?.role); // 🔒 привели к числу 1/2/3/4

  const navItems = [
    { menuTitle: "Catalog", pageURL: "/" },
    { menuTitle: "Trade-in", pageURL: "/trade-in" },
    { menuTitle: "Cart", pageURL: "/cart" },
  ];

  if (user) {
    navItems.push({ menuTitle: "My orders", pageURL: "/my/orders" });
    navItems.push({ menuTitle: "Change password", pageURL: "/change-password" });
  }

  let roleItem = null;
  if (role === 1) {
    roleItem = { menuTitle: "Admin", pageURL: "/admin" };
  } else if (role === 3) {
    roleItem = { menuTitle: "Manager", pageURL: "/manager/orders" };
  } else if (role === 4) {
    roleItem = { menuTitle: "Courier", pageURL: "/courier/orders" };
  }

  if (roleItem) {
    navItems.push(roleItem);
  }

  const handleLogin = () => open();
  const handleLogout = () => logout();

  return (
    <AppBar
      position="sticky"
      className="headerLine"
      sx={{ top: 0, zIndex: (theme) => theme.zIndex.appBar }}
    >
      <Toolbar>
        <Container
          maxWidth="xl"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
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
            {navItems.map(({ menuTitle, pageURL }, idx) => (
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
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            {isLoggedIn ? (
              <Button
                startIcon={<LogoutIcon />}
                color="inherit"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <>
                <Button component={Link} to="/register" color="inherit">
                  Register
                </Button>
                <Button
                  startIcon={<LoginIcon />}
                  color="inherit"
                  onClick={handleLogin}
                >
                  Log in
                </Button>
              </>
            )}
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
