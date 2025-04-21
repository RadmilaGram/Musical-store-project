// src/pages/HomePage.jsx
import {
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Grid,
  Container,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { categoryGroups } from "../constants/categoryGroups";

const HomePage = () => {
  const navigate = useNavigate();

  const handleClick = (groupId) => {
    navigate(`/category/${groupId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Grid container spacing={4} justifyContent="center">
        {categoryGroups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card
              onClick={() => handleClick(group.id)}
              sx={{
                maxWidth: 350,
                margin: "0 auto",
                boxShadow: 3,
                borderRadius: 3,
              }}
            >
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="300"
                  image={group.image}
                  alt={group.title}
                  sx={{ objectFit: "cover" }}
                  onError={(e) => {
                    e.target.src = "/images/default-group.jpg";
                  }}
                />
                <CardContent>
                  <Typography variant="h6" align="center">
                    {group.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage;
