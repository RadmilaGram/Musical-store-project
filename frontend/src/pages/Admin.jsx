import { useState, useEffect } from "react";
import { Button, Stack, Paper, Box, Typography, Divider } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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

        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography variant="h4" component="h4">
              Adding brand
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddBrandForm />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <Typography variant="h4" component="h4">
              Adding product types
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddProdTypeForm />
          </AccordionDetails>
        </Accordion>
      </Box>
    </>
  );
}

export default Admin;
