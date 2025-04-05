import { useState } from "react";
import { Button } from "@mui/material";
import { fetchProducers } from "../utils/apiService/ApiService";

function HomePage() {
  function clickReq() {
    fetchProducers().then(setData).catch(console.error);
    console.log(data);
  }
  function getData() {
    let result = "";
    for (const item in data) {
      result += data[item]["name"].toString();
    }
    return result;
  }
  const [data, setData] = useState();

  return (
    <>
      <main>
        <h1>HomePage</h1>
        <Button variant="contained" onClick={clickReq}>
          Reuqest data
        </Button>
        {getData()}
      </main>
    </>
  );
}

export default HomePage;
