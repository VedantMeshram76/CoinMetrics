const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");
const CoinData = require("../models/coinData");
const isAuthenticated = require("../middleware/Authentication");

router.use(isAuthenticated);

router.get("/about", (req, res) => {
    res.render("about.ejs", {
        user: req.session.currentUser || null
    });
});

module.exports = router;