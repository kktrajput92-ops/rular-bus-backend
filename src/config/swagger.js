const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Rular Bus ERP API",
      version: "1.5.0",
      description: "Enterprise Bus ERP Backend API Documentation",
    },
    servers: [
      {
        url: "http://127.0.0.1:5000",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

