require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const BASE_PORT = Number(process.env.PORT) || 4000;
const MAX_PORT_TRIES = 8;

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => {
  res.type("application/json").send("{}");
});

app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000,
    max: 150,
    message: { error: "Too many requests. Please slow down." },
  })
);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/triggers", require("./routes/triggers"));
app.use("/api/location", require("./routes/location"));
app.use("/api/gig", require("./routes/gig"));

app.get("/health", (_req, res) =>
  res.json({
    status: "ok",
    service: "Riskora API",
    version: "1.2.0",
    timestamp: new Date().toISOString(),
  })
);

function listenFrom(port, triesLeft) {
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`Riskora API http://localhost:${port}`);
    if (port !== BASE_PORT) {
      console.warn(`Port ${BASE_PORT} was busy. Set frontend VITE_API_ORIGIN=http://localhost:${port}`);
    }
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && triesLeft > 0) {
      listenFrom(port + 1, triesLeft - 1);
      return;
    }
    console.error(err);
    process.exit(1);
  });
}

listenFrom(BASE_PORT, MAX_PORT_TRIES);

module.exports = app;
