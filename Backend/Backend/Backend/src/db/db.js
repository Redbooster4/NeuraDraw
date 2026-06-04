const mongoose = require("mongoose")

async function connectDB() {
    if (!process.env.MONGO_URI){
        throw new Error("MONGO_URI is not defined !!");
    }
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("DB connected !!")
    }   
    catch(Exception) {
        console.log("Exception: ", Exception)
    }
}

module.exports = connectDB;