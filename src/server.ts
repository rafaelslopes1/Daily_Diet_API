import { app } from "./app/app";
import { env } from "./config/env";

app.listen({
  port: env.PORT
})
  .then(() => {
    console.log(`HTTP server listening on port ${env.PORT}`);
  })