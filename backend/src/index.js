import { createServer } from "http";
import app from "./server.js";

const port = process.env.PORT || 3000;
const server = createServer(app);

server.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
