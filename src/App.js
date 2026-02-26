import { useEffect, useState } from "react";
import { shopifyFetch } from "./api";

function App() {
  const [shop, setShop] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const data = await shopifyFetch("/api/me");
        setShop(data.shop);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    }

    bootstrap();
  }, []);

  if (error) return <pre>{error}</pre>;
  if (!shop) return <div>Loading Merchy...</div>;

  return <div>Merchy dashboard for {shop}</div>;
}

export default App;
