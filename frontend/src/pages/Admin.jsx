import { Button, Card, CardActions, CardContent, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import PageTitle from "../components/ui/PageTitle";

function Admin() {
  return (
    <PageContainer maxWidth="xl">
      <PageTitle>Admin</PageTitle>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 4 }}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Catalog
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage products, types, brands, and trade-in catalog.
            </Typography>
          </CardContent>
          <CardActions>
            <Button component={Link} to="/admin/catalog">
              Open catalog
            </Button>
          </CardActions>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and manage customer orders.
            </Typography>
          </CardContent>
          <CardActions>
            <Button component={Link} to="/admin/orders">
              Open orders
            </Button>
          </CardActions>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Users
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage staff roles and access.
            </Typography>
          </CardContent>
          <CardActions>
            <Button component={Link} to="/admin/users">
              Open users
            </Button>
          </CardActions>
        </Card>
      </Stack>
    </PageContainer>
  );
}

export default Admin;
