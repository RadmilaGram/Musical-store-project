// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Stack,
  Button,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

import logo from "/title_icon.png";
import { clearUser } from "../../store/userSlice";
import "./Header.css";

const pages = [
  { menuTitle: "Catalog", pageURL: "/" },
  { menuTitle: "Cart", pageURL: "/Cart" },
  { menuTitle: "Trade-in", pageURL: "/Trade-in" },
  { menuTitle: "Admin", pageURL: "/Admin" },
];

export default function Header() {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(clearUser());
    navigate("/login");
  };

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
          {pages.map((page, index) => {
            const { menuTitle, pageURL } = page;
            if (menuTitle === "Admin" && user?.role !== 1) return null;
            return (
              <Button
                key={index}
                component={Link}
                to={pageURL}
                variant="text"
                color="inherit"
              >
                {menuTitle}
              </Button>
            );
          })}
          {user && (
            <Button
              startIcon={<LogoutIcon />}
              color="inherit"
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
