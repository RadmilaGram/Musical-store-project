import { Container } from "@mui/material";

export default function PageContainer({ children, maxWidth = "md", sx }) {
  return (
    <Container maxWidth={maxWidth} sx={{ py: 4, ...sx }}>
      {children}
    </Container>
  );
}
