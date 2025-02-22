import "dotenv/config.js";
import connectDb from "./db/index.js";
import { app } from "./app.js";

connectDb() //** Do you know async function also returns promises
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server started at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongo db connection failed", err);
  });
