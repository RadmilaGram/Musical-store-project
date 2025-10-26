import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff, Close } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { authStart, authSuccess, authFailure } from "../store/authSlice";
import { closeLogin } from "../store/uiSlice";
import { loginByEmail } from "../utils/apiService/ApiService";

const schema = yup.object({
  email: yup.string().email("Неверный email").required("Укажите email"),
  password: yup
    .string()
    .min(6, "Минимум 6 символов")
    .required("Введите пароль"),
});

export default function LoginDialog() {
  const dispatch = useDispatch();
  const isOpen = useSelector((s) => s.ui.isLoginOpen);
  const status = useSelector((s) => s.auth.status);
  const error = useSelector((s) => s.auth.error);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [showPassword, setShowPassword] = React.useState(false);

  const onSubmit = async (values) => {
    try {
      dispatch(authStart());
      const data = await loginByEmail(values);
      if (data.token) localStorage.setItem("token", data.token);
      dispatch(authSuccess(data));
      dispatch(closeLogin());
    } catch (e) {
      const msg = e?.response?.data?.message || "Ошибка входа";
      setError("root", { message: msg });
      dispatch(authFailure(msg));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => dispatch(closeLogin())}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Log in
        <IconButton onClick={() => dispatch(closeLogin())}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error">{error}</Alert>}
        <form id="login-form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register("password")}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(closeLogin())}>Cancel</Button>
        <Button
          type="submit"
          form="login-form"
          variant="contained"
          disabled={status === "loading"}
          startIcon={
            status === "loading" ? <CircularProgress size={18} /> : null
          }
        >
          Log in
        </Button>
      </DialogActions>
    </Dialog>
  );
}
