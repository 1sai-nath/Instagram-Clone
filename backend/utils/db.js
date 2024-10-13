import mongoose from "mongoose";

const db = () => {
  try {
    mongoose.connect(process.env.MONGO_URI);
    console.log("connected to database");
    
  } catch (error) {
    console.log(error);
    
  }
};

export default db;
