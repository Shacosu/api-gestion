const express = require("express");
const app = express();
const port = 3000;
const dbConn = require("./lib/dbConnection")
const cors = require("cors");
const morgan = require("morgan");
dbConn()

app.use(express.json());
app.use(cors());
app.use(morgan("dev"))

app.use("/api/collection", require("./routes/collectionRoutes"));
app.use("/api/games", require("./routes/gamesRoutes"));
app.use("/api/scrap", require("./routes/scrapRoutes"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
