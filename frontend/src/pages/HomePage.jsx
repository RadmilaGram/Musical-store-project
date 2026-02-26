import { Link } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { useCategories } from "../hooks/useCategories";
import { API_URL } from "../utils/apiService/ApiService";
import {
  CATEGORY_FALLBACK_IMAGE,
  resolveCategoryImageUrl,
} from "../utils/images/resolveCategoryImageUrl";

const HomePage = () => {
  const { data: categories, loading, error } = useCategories();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ mt: 5 }}>
        Failed to load categories.
      </Typography>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Grid container spacing={4} justifyContent="center">
        {(categories || []).map((category) => {
          const fallbackImageUrl = resolveCategoryImageUrl(
            CATEGORY_FALLBACK_IMAGE,
            API_URL
          );
          const imageUrl = resolveCategoryImageUrl(
            category.img || CATEGORY_FALLBACK_IMAGE,
            API_URL
          );

          return (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                width: 350,
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
                to={`/category/${category.slug}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                  borderRadius: 12,
                }}
              >
                <CardMedia
                  component="img"
                  image={imageUrl}
                  alt={category.name}
                  sx={{
                    aspectRatio: "16 / 14",
                    width: "100%",
                    objectFit: "cover",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                  }}
                  onError={(e) => {
                    e.target.src = fallbackImageUrl;
                  }}
                />
                <CardContent sx={{ mt: "auto" }}>
                  <Typography
                    variant="h6"
                    align="center"
                    color="text.primary"
                    sx={{ fontWeight: 500 }}
                  >
                    {category.name}
                  </Typography>
                </CardContent>
              </Link>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default HomePage;
