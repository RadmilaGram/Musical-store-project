import { Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Stack,
  Button,
} from "@mui/material";

import logo from "/title_icon.png";
import "./Header.css";

const pages = [
  {
    menuTitle: "Catalog",
    pageURL: "/",
  },
  {
    menuTitle: "Cart",
    pageURL: "/Cart",
  },
  {
    menuTitle: "Trade-in",
    pageURL: "/Trade-in",
  },
  {
    menuTitle: "Admin",
    pageURL: "/Admin",
  },
];

function Header() {
  return (
    <>
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
          <Stack direction="row" spacing={2}>
            {pages.map((page, index) => {
              const { menuTitle, pageURL } = page;
              return (
                <Button
                  key={index}
                  component={Link}
                  to={pageURL}
                  variant="filled"
                  color="inherit"
                >
                  {menuTitle}
                </Button>
              );
            })}
          </Stack>
        </Toolbar>
      </AppBar>
    </>
  );
}

export default Header;
