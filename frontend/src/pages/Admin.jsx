import { useState } from "react";
import { Button, Stack } from "@mui/material";
import { fetchBrand } from "../utils/apiService/ApiService";

function Admin() {
  function clickReq() {
    fetchBrand().then(setData).catch(console.error);
    console.log(data);
  }
  function getData() {
    let result = [];
    for (const item in data) {
      result.push(data[item]["name"].toString());
    }
    console.log(result);

    return (
      <Stack spacing={2}>
        {result.map((element) => {
          return <h3>{element}</h3>;
        })}
      </Stack>
    );
  }

  const [data, setData] = useState();

  return (
    <>
      <main>
        <h1>Admin</h1>
        <Button variant="contained" onClick={clickReq}>
          Reuqest data
        </Button>
        {getData()}
      </main>
    </>
  );
}

export default Admin;
