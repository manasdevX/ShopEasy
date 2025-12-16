const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/product.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ShopEasy Backend Running");
});

app.use("/products", productRoutes);

module.exports = app;
