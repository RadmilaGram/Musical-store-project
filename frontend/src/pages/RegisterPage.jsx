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
import { useRegister } from "../hooks/useRegister";
import { useRegisterForm } from "../forms/auth/useRegisterForm";
import PageContainer from "../components/ui/PageContainer";
import PageTitle from "../components/ui/PageTitle";
import FormLayout from "../components/ui/FormLayout";

export default function RegisterPage() {
  const registerUser = useRegister();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    showPassword,
    togglePassword,
  } = useRegisterForm();

  const onSubmit = async (values) => {
    try {
      await registerUser(values);
      navigate("/");
    } catch (e) {
      const message =
        e?.response?.data?.message || "Ошибка регистрации";
      setError("root", { message });
    }
  };

  return (
    <PageContainer>
      <FormLayout
        onSubmit={handleSubmit(onSubmit)}
        sx={{ mt: 8 }}
        autoComplete="off"
      >
        <PageTitle>Register</PageTitle>
        {errors.root?.message && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.root.message}
          </Alert>
        )}
        <TextField
          label="Full name"
          fullWidth
          margin="normal"
          error={!!errors.full_name}
          helperText={errors.full_name?.message}
          {...register("full_name")}
        />
        <TextField
          label="Email"
          inputProps={{ autoComplete: "email" }}
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register("email")}
        />
        <TextField
          label="Phone"
          fullWidth
          margin="normal"
          error={!!errors.phone}
          helperText={errors.phone?.message}
          {...register("phone")}
        />
        <TextField
          label="Address"
          fullWidth
          margin="normal"
          error={!!errors.address}
          helperText={errors.address?.message}
          {...register("address")}
        />
        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          inputProps={{ autoComplete: "new-password" }}
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={togglePassword}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          {...register("password")}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSubmitting}
          sx={{ mt: 2 }}
        >
          Register
        </Button>
      </FormLayout>
    </PageContainer>
  );
}
