import { useState, useEffect } from "react";
import { Button, Stack, Paper, Box, Typography } from "@mui/material";
import { fetchBrand } from "../utils/apiService/ApiService";
import AddBrandForm from "../components/forms/AddBrand";
import { styled } from "@mui/material/styles";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

function Admin() {
  const [data, setData] = useState();

  function getData() {
    let result = [];
    for (const item in data) {
      result.push(data[item]["name"].toString());
    }
    console.log(result);

    result.sort();

    return (
      <Stack spacing={2}>
        {result.map((element) => {
          return <Item key={element}>{element}</Item>;
        })}
      </Stack>
    );
  }

  function readBrands() {
    fetchBrand().then(setData).catch(console.error);
  }

  useEffect(() => {
    readBrands();
  }, []);

  return (
    <>
      <main>
        <Typography variant="h2" component="h2">
          Admin
        </Typography>
        <AddBrandForm readBrands={readBrands} />
        {getData()}
      </main>
    </>
  );
}

export default Admin;
