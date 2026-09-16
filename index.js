const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const Listing = require("./modals/module.js");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 8080;

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to the database!");

        app.listen(port, () => {
            console.log(`Listening on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to the database:", err);
    });



app.get("/", (req, res) => {
    res.send("Hello World");
});



app.post("/listings", async (req, res) => {
    try {
        const listing = new Listing(req.body);

        const savedListing = await listing.save();

        res.status(201).json(savedListing);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create listing",
            error: error.message,
        });
    }
});



app.get("/listings", async (req, res) => {
    try {
        const listings = await Listing.find();

        res.status(200).json(listings);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch listings",
            error: error.message,
        });
    }
});



app.get("/listings/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({
                message: "Listing not found",
            });
        }

        res.status(200).json(listing);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch listing",
            error: error.message,
        });
    }
});