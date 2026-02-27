import { useEffect, useState } from "react";
import { shopifyFetch } from "./api";

function App() {
  const [shop, setShop] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await shopifyFetch("/api/me");
        setShop(data.shop);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  if (!shop) return <div>Loading Merchy...</div>;

  return <div>Merchy dashboard for {shop}</div>;
}

export default App;
