import { useEffect, useState } from "react";
import { shopifyFetch } from "./api";

function App() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const data = await shopifyFetch("/api/me");
        setShop(data.shop);
      } catch (err) {
        console.error("Bootstrap failed:", err);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  if (loading) return <div>Loading Merchy...</div>;
  if (!shop) return <div>Failed to load shop</div>;

  return <div>Merchy dashboard for {shop}</div>;
}

export default App;
