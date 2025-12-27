import Typography from "@mui/material/Typography";
import BrandsSection from "./admin/sections/BrandsSection/BrandsSection";
import ProductTypesSection from "./admin/sections/ProductTypesSection/ProductTypesSection";
import ProductStatusesSection from "./admin/sections/ProductStatusesSection/ProductStatusesSection";
import SpecialFieldsSection from "./admin/sections/SpecialFieldsSection/SpecialFieldsSection";
import ProductTypeSpecialFieldsSection from "./admin/sections/ProductTypeSpecialFieldsSection/ProductTypeSpecialFieldsSection";
import ProductsSection from "./admin/sections/ProductsSection/ProductsSection";
import TradeInConditionsSection from "./admin/sections/TradeInConditionsSection/TradeInConditionsSection";
import TradeInCatalogSection from "./admin/sections/TradeInCatalogSection/TradeInCatalogSection";

function Admin() {
  return (
    <>
      <Typography variant="h2" component="h1" sx={{ textAlign: "center", mb: 3 }}>
        Admin
      </Typography>
      <BrandsSection />
      <ProductTypesSection />
      <ProductStatusesSection />
      <SpecialFieldsSection />
      <ProductTypeSpecialFieldsSection />
      <ProductsSection />
      <TradeInCatalogSection />
      <TradeInConditionsSection />
    </>
  );
}

export default Admin;
