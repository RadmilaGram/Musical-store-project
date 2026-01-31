import React, { useEffect } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Box,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import registerSchema from "../../forms/auth/registerSchema";

const staffSchema = yup.object({
  name: registerSchema.fields.full_name,
  email: registerSchema.fields.email,
  phone: registerSchema.fields.phone,
  address: registerSchema.fields.address,
  password: registerSchema.fields.password,
});

export default function CreateStaffUserDialog({
  open,
  onClose,
  onCreate,
  loading,
  error,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({
    resolver: yupResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    },
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const togglePassword = () => setShowPassword((prev) => !prev);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const submit = async (values) => {
    try {
      await onCreate({
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        password: values.password,
      });
      reset();
      onClose();
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to create staff user";
      setError("root", { message });
    }
  };

  const isBusy = Boolean(loading || isSubmitting);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create staff</DialogTitle>
      <DialogContent>
        <Box component="form" autoComplete="off">
          <Stack spacing={2} sx={{ mt: 1 }}>
            {errors.root?.message && (
              <Alert severity="error">{errors.root.message}</Alert>
            )}
            {!errors.root?.message && error && (
              <Alert severity="error">
                {error?.response?.data?.message || "Failed to create staff user"}
              </Alert>
            )}
            <TextField
              label="Full name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              inputProps={{ autoComplete: "name" }}
              {...register("name")}
            />
            <TextField
              label="Email"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
              inputProps={{ autoComplete: "email" }}
              {...register("email")}
            />
            <TextField
              label="Phone"
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone?.message}
              inputProps={{ autoComplete: "tel" }}
              {...register("phone")}
            />
            <TextField
              label="Address"
              fullWidth
              error={!!errors.address}
              helperText={errors.address?.message}
              inputProps={{ autoComplete: "off" }}
              {...register("address")}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
              inputProps={{ autoComplete: "new-password" }}
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
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isBusy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(submit)}
          disabled={isBusy}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
