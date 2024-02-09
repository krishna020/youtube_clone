import mongoose from "mongoose";
import { DATABASE_NAME } from "../constants.js";

const connection = async () => {
    try {
         const connectionInstance= await mongoose.connect(`${process.env.MONGO_URI}/${DATABASE_NAME}`)
         console.log(`database is connected to ${connectionInstance.connection.host}`)
    }
    catch (err) {
       console.log(`MONGODB CONNECTION ERROR:  ${err.message}`);
       process.exit(1);
    }
}

export default connection;