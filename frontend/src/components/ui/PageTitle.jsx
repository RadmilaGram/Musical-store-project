import { Typography } from "@mui/material";

export default function PageTitle({ children, title, sx }) {
  return (
    <Typography variant="h5" component="h1" gutterBottom sx={sx}>
      {children ?? title}
    </Typography>
  );
}
