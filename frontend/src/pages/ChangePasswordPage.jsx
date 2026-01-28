import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useChangePassword } from "../hooks/useChangePassword";
import { useChangePasswordForm } from "../forms/auth/useChangePasswordForm";

export default function ChangePasswordPage() {
  const changePassword = useChangePassword();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    showCurrent,
    showNext,
    toggleCurrent,
    toggleNext,
  } = useChangePasswordForm();

  const onSubmit = async (values) => {
    try {
      await changePassword(values);
      navigate("/login");
    } catch (e) {
      const message =
        e?.response?.data?.message || "Ошибка смены пароля";
      setError("root", { message });
    }
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: 520, mx: "auto", mt: 8, p: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Change password
      </Typography>
      {errors.root?.message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.root.message}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Current password"
          type={showCurrent ? "text" : "password"}
          fullWidth
          margin="normal"
          error={!!errors.current_password}
          helperText={errors.current_password?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={toggleCurrent}>
                  {showCurrent ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          {...register("current_password")}
        />
        <TextField
          label="New password"
          type={showNext ? "text" : "password"}
          fullWidth
          margin="normal"
          error={!!errors.new_password}
          helperText={errors.new_password?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={toggleNext}>
                  {showNext ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          {...register("new_password")}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSubmitting}
          sx={{ mt: 2 }}
        >
          Change password
        </Button>
      </Box>
    </Paper>
  );
}
