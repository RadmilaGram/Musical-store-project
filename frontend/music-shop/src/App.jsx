import { Routes, Route, Link } from "react-router-dom";

import Header from "./components/header/Header";
import HomePage from "./pages/HomePage";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import TradeIn from "./pages/TradeIn";

// import "./App.css";

function App() {
  return (
    <>
      <div className="allContentWrp">
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ProductDetails" element={<ProductDetails />} />
          <Route path="/Cart" element={<Cart />} />
          <Route path="/Trade-in" element={<TradeIn />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
