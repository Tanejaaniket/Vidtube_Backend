import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export default async function connectDb() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `Connected to MongoDB hosted at ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Mongo connection error", error);
    process.exit(1);
  }
}
