const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

// Serve the JARVIS frontend
app.use(express.static(path.join(__dirname, "..")));

// Backend status
app.get("/api/status", (req, res) => {
    res.json({
        status: "JARVIS backend online"
    });
});

// Send index.html for the main website
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "index.html")
    );
});

app.listen(PORT, () => {
    console.log(`JARVIS running on port ${PORT}`);
});
