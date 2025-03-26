require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const handleErrors = require("./src/middlewares/error-middleware");
const authRoute = require("./src/routes/auth-routes");
const userRouter = require("./src/routes/user-routes");
const adminRouter = require("./src/routes/admin-routes");
const notFound = require("./src/middlewares/notFound");
const challengeRouter = require("./src/routes/challenge-routes");
const categoryRouter = require("./src/routes/category-routes");
const app = express();

// Middlewares
app.use(cors()); // Allows cross domain
app.use(morgan("dev")); // Show log terminal
app.use(express.json()); // For read json

// Routing
app.use("/api", authRoute);
app.use("/api", userRouter);
app.use("/api", adminRouter);
app.use("/api", challengeRouter);
app.use("/api", categoryRouter);

//notFound
app.use(notFound);
// Handle errors
app.use(handleErrors);

// Start Server
const PORT = 8080;
app.listen(PORT, () => console.log(`Server is runnig on port ${PORT}`));
