import React from "react";
import { Button } from "@mui/material";
import { useLoginModal } from "../hooks/useLoginModal";

export default function HeaderLoginButton() {
  const { open } = useLoginModal();
  return (
    <Button color="inherit" onClick={open}>
      Log in
    </Button>
  );
}
