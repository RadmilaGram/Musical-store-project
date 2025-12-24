import { Box, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import AddBrandForm from "../components/forms/AddBrandForm";
import AddProdTypeForm from "../components/forms/AddProdTypeForm";
import AddProductForm from "../components/forms/AddProductForm";
import AddSpecialFieldForm from "../components/forms/AddSpecialFieldForm";
import AddSpecialFieldDefaultValueForm from "../components/forms/AddSpecialFieldDefaultValueForm";
import AddSpecialFieldToProductType from "../components/forms/AddSpecialFieldToProductType";
import AddProductToTradeIn from "../features/tradein/components/AddProductToTradeIn";
import BrandsSection from "./admin/sections/BrandsSection/BrandsSection";

function Admin() {
  return (
    <>
      <BrandsSection />
      <Box sx={{ width: "55%", minWidth: 500, mx: "auto" }}>
        <Typography variant="h2" component="h2">
          Admin
        </Typography>

        <Accordion>
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
              Adding product type
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddProdTypeForm />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <Typography variant="h4" component="h4">
              Adding special field to product type
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddSpecialFieldToProductType />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <Typography variant="h4" component="h4">
              Adding special field
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddSpecialFieldForm />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <Typography variant="h4" component="h4">
              Adding special field default values
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddSpecialFieldDefaultValueForm />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <Typography variant="h4" component="h4">
              Adding product
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddProductForm />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <Typography variant="h4" component="h4">
              Adding product to traid-in
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddProductToTradeIn />
          </AccordionDetails>
        </Accordion>
      </Box>
    </>
  );
}

export default Admin;
