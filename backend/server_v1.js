const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve images statically
app.use("/images", express.static(path.join(__dirname, "images")));

// API route placeholder
app.get("/", (req, res) => {
  res.send("Printing Quotes API is running...");
});

// Start server on port 5000
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Check for server Auto-Restart
console.log("Server restarted!")
