import { useState, useEffect } from "react";
import { Button, Stack, Paper, Box, Typography, Divider  } from "@mui/material";
import { getBrand } from "../utils/apiService/ApiService";
import AddBrandForm from "../components/forms/AddBrandForm";
import AddProdTypeForm from "../components/forms/AddProdTypeForm";

function Admin() {
  return (
    <>
      <Box sx={{ width: "55%", minWidth: 500, mx: "auto" }}>
        <Typography variant="h2" component="h2">
          Admin
        </Typography>

        <AddBrandForm/>

        <Divider sx={{ mt: "30px", mb: "30px"}}/>
        <AddProdTypeForm/>
        {/* <AddProdTypeForm readBrands={readBrands} />
        <Typography variant="h4" component="h4" sx={{ mt: "30px" }}>
          Brands:
        </Typography> */}
        {/* {getData()} */}
      </Box>
    </>
  );
}

export default Admin;
