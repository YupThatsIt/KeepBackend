// include modules
const express = require("express");
const { readdirSync } = require("fs");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const PORT = 8000 || process.env.port;

// init express instance
const app = express();

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false}));

// built-in middleware for json
app.use(express.json());

// middleware for cookies
app.use(cookieParser());

// database connection
const connectDB = require("./config/databaseConfig.js");
connectDB();

app.use(bodyParser.json());

// to read 
readdirSync('./routes').map((filename) => {
    app.use(require("./routes/" + filename), (err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send(`${filename} : something's wrong in this file. Fix it`);  
    });
});

app.listen(PORT, () => {
    console.log("App is listening at http://localhost:" + PORT);
});