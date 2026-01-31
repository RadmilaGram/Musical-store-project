import React from "react";
import { Stack } from "@mui/material";
import BrandsSection from "./admin/sections/BrandsSection/BrandsSection";
import ProductTypesSection from "./admin/sections/ProductTypesSection/ProductTypesSection";
import ProductStatusesSection from "./admin/sections/ProductStatusesSection/ProductStatusesSection";
import SpecialFieldsSection from "./admin/sections/SpecialFieldsSection/SpecialFieldsSection";
import ProductTypeSpecialFieldsSection from "./admin/sections/ProductTypeSpecialFieldsSection/ProductTypeSpecialFieldsSection";
import ProductsSection from "./admin/sections/ProductsSection/ProductsSection";
import TradeInConditionsSection from "./admin/sections/TradeInConditionsSection/TradeInConditionsSection";
import TradeInCatalogSection from "./admin/sections/TradeInCatalogSection/TradeInCatalogSection";
import PageContainer from "../components/ui/PageContainer";
import PageTitle from "../components/ui/PageTitle";

export default function AdminCatalogPage() {
  return (
    <PageContainer maxWidth="lg">
      <PageTitle sx={{ mb: 3 }}>Catalog</PageTitle>
      <Stack spacing={4} sx={{ width: "100%" }}>
        <BrandsSection />
        <ProductTypesSection />
        <ProductStatusesSection />
        <SpecialFieldsSection />
        <ProductTypeSpecialFieldsSection />
        <ProductsSection />
        <TradeInCatalogSection />
        <TradeInConditionsSection />
      </Stack>
    </PageContainer>
  );
}
