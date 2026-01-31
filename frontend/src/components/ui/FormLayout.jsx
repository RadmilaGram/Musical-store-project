import { Container, Paper, Stack } from "@mui/material";

export default function FormLayout({
  onSubmit,
  children,
  sx,
  autoComplete,
  noValidate,
}) {
  return (
    <Container
      component="form"
      maxWidth="sm"
      onSubmit={onSubmit}
      autoComplete={autoComplete}
      noValidate={noValidate}
      sx={sx}
    >
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack spacing={2}>{children}</Stack>
      </Paper>
    </Container>
  );
}
