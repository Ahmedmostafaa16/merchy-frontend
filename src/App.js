import { useEffect, useState } from "react";
import { shopifyFetch } from "./api";

function App() {
  const [shop, setShop] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const data = await shopifyFetch("/api/me");

        console.log("API response:", data);

        // ensure correct property is used
        if (data.shop) {
          setShop(data.shop);
        } else {
          setError("Shop missing in response");
        }

      } catch (err) {
        console.error(err);
        setError("API failed");
      }
    }

    bootstrap();
  }, []);

  if (error) {
    return <div style={{ padding: 40 }}>Error: {error}</div>;
  }

  if (!shop) {
    return <div style={{ padding: 40 }}>Loading Merchy...</div>;
  }

  // 🔹 Your real app UI starts here
  return (
    <div style={{ padding: 40 }}>
      <h1>Merchy Dashboard</h1>
      <p>Connected store: {shop}</p>
      <p>Your designs and UI go here.</p>
    </div>
  );
}

export default App;