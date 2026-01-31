import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useChangePassword } from "../hooks/useChangePassword";
import { useChangePasswordForm } from "../forms/auth/useChangePasswordForm";
import PageContainer from "../components/ui/PageContainer";
import PageTitle from "../components/ui/PageTitle";
import FormLayout from "../components/ui/FormLayout";

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
    <PageContainer>
      <FormLayout onSubmit={handleSubmit(onSubmit)} sx={{ mt: 8 }}>
        <PageTitle>Change Password</PageTitle>
        {errors.root?.message && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.root.message}
          </Alert>
        )}
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
      </FormLayout>
    </PageContainer>
  );
}
