import React from "react";
import { Button } from "@mui/material";
import { useSelector } from "react-redux";
import { useLoginModal } from "../hooks/useLoginModal";

export default function ProtectedActionButton({
  onAuthedClick,
  children,
  isLoading,
  ...props
}) {
  const token = useSelector((s) => s.auth.token);
  const { open } = useLoginModal();

  const handleClick = () => {
    if (!token) return open();
    onAuthedClick?.();
  };

  return (
    <Button
      variant="contained"
      disabled={isLoading}
      {...props}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
