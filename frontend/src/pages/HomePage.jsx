import { Link } from "react-router-dom";
import { categoryGroups } from "../constants/categoryGroups";
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
} from "@mui/material";

const HomePage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Grid container spacing={4} justifyContent="center">
        {categoryGroups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                maxWidth: 350,
                margin: "0 auto",
                boxShadow: 3,
                borderRadius: 3,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "scale(1.03)",
                  boxShadow: 6,
                },
              }}
            >
              <Link
                to={`/category/${group.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                  borderRadius: 12,
                }}
              >
                <CardMedia
                  component="img"
                  image={group.image}
                  alt={group.title}
                  sx={{
                    aspectRatio: "16 / 14",
                    width: "100%",
                    objectFit: "cover",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                  }}
                  onError={(e) => {
                    e.target.src = "/images/default-group.jpg";
                  }}
                />
                <CardContent sx={{ mt: "auto" }}>
                  <Typography
                    variant="h6"
                    align="center"
                    color="text.primary"
                    sx={{ fontWeight: 500 }}
                  >
                    {group.title}
                  </Typography>
                </CardContent>
              </Link>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage;
