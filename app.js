require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const server = require("http").Server(app);
//my routes
const photo = require("./public/products/ProductPhoto");
const authRoutes = require("./routes/authentication");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const pinRoutes = require("./routes/pin_sp");
const discountRoutes = require("./routes/discount");
const cartRoutes = require("./routes/cart");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swag.yaml");
const fast2sms = require("fast-two-sms");
const SuperAdminRoutes = require("./routes/superadmin");
const origanizationRoutes = require("./routes/origanization");

// DBconnected
app.use(express.static("public"));
mongoose.set("useFindAndModify", false);
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("DB Connected");
  });

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors());

app.use("/api", photo);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// My routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", discountRoutes);
app.use("/api", pinRoutes);
app.use("/api", SuperAdminRoutes);
app.use("/api", origanizationRoutes);
// port
const port = process.env.PORT || 9091;

// fastSMS setup
app.post("/sendmessage", (req, res) => {
  console.log(req.body.message);
  console.log(req.body.number, " number");

  sendMessage(req.body.message, req.body.number, res);
});

function sendMessage(message, number, res) {
  var options = {
    authorization: process.env.SMS_API,
    message: message,
    numbers: [number],
  };

  // send this message

  fast2sms
    .sendMessage(options)
    .then((response) => {
      res.send("SMS OTP Code Sent Successfully");
    })
    .catch((error) => {
      res.send("Some error taken place");
    });
}

server.listen(port, () => {
  console.log(`app is running at ${port}`);
});
