const express = require("express");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const swaggerUI = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

dotenv.config({ path: "./config/config.env" });

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

//Routes:
app.use('/user', require('./routes/user'));
app.use('/posts', require('./routes/post'));
app.use('/admin', require('./routes/admin'));

//Swagger:
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Deal-Blog API",
            version: "1.0.0",
            description: "Deal Back-End Assignment"
        },
        servers: [
            {
                url: `http://localhost:${PORT}`
            }
        ],
        securityDefinitions: {
            bearerAuth: {
                type: 'apiKey',
                name: 'Authorization',
                scheme: 'bearer',
                in: 'header',
            },
        }
    },
    apis: ["./routes/*.js"]
}
const specs = swaggerJSDoc(options);
//SWagger Docs API
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

//Mongodb
const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI)
    .then(() => app.listen(PORT, () => console.log(`Server is Running on:http://localhost:${PORT}`)))
    .catch((err) => console.log(err));

module.exports = app; //for testing