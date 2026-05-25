import app from "./app";
import config from "./config";
import { initDB } from "./db";

const main=()=>{
  try {
    initDB();
    app.listen(config.port, () => {
      console.log(`Example app listening on port ${config.port}`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to start server:", error.message);
    } else {
      console.error("Unknown startup error");
    }
  }
}
main();