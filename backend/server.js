import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

// Serve the JARVIS frontend
app.use(
    express.static(
        path.join(__dirname, "..")
    )
);

// Backend status
app.get("/api/status", (req, res) => {
    res.json({
        status: "JARVIS backend online"
    });
});

// Main JARVIS website
app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "..",
            "index.html"
        )
    );
});

app.listen(PORT, () => {
    console.log(
        `JARVIS running on port ${PORT}`
    );
});
