const mongoose = require("mongoose");

const connectDB = async() => {
    try {
        // await mongoose.connect("mongodb://127.0.0.1:27017/keepDB"); // use await to wait for connection
        await mongoose.connect("mongodb+srv://saiprapamonton:kL0kluANJo1PfOKH@cluster1.wvgpg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1"); // use await to wait for connection
        console.log("DB Connected");
    }
    catch(err) {
        console.log(err);
    }
}

module.exports = connectDB;