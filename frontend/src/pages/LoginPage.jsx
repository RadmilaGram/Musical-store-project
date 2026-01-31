import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Button,
  TextField,
  Alert,
} from "@mui/material";
import { useLogin } from "../hooks/useAuth";
import PageContainer from "../components/ui/PageContainer";
import PageTitle from "../components/ui/PageTitle";
import FormLayout from "../components/ui/FormLayout";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginPage() {
  const login = useLogin();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const [errorMsg, setErrorMsg] = React.useState("");

  const onSubmit = async (data) => {
    await login(data);
    // if (!isLoggedIn){setErrorMsg("Log in faild!")}
  };

  return (
    <PageContainer>
      <FormLayout onSubmit={handleSubmit(onSubmit)} sx={{ mt: 8 }}>
        <PageTitle>Log in</PageTitle>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}
        <Controller
          name="email"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              inputProps={{ autoComplete: "email" }}
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              label="Password"
              type="password"
              inputProps={{ autoComplete: "current-password" }}
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          )}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          // disabled={loading}
          sx={{ mt: 2 }}
        >
          {/* {loading ? "Loging In..." : "Log in"} */}
          Log in
        </Button>
      </FormLayout>
    </PageContainer>
  );
}
