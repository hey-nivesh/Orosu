import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const app = createApp();
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Orosu Express API running on http://localhost:${PORT}`);
    console.log(`🛡️ Supabase Auth JWT validation active`);
  });
}

export default app;
