const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");
const CoinData = require("../models/coinData");


router.get("/login", (req, res) => {
    res.render("login.ejs", {
        user: req.session.currentUser || null,
        error: null
    });
});


router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // 1. Find user by email
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.render("login.ejs", {
                user: null,
                error: "Invalid email or password"
            });
        }

        // 2. Validate password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.render("login.ejs", {
                user: null,
                error: "Invalid email or password"
            });
        }

        // 3. Set Session Data (Align property keys with profile route)
        req.session.userId = user._id; // Set explicit userId
        req.session.currentUser = {
            _id: user._id,              // Match Mongoose _id property name
            username: user.username
        };

        // 4. Force session save BEFORE redirecting to eliminate race condition
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.render("login.ejs", {
                    user: null,
                    error: "Session initialization failed. Please try again."
                });
            }
            return res.redirect('/users/market');
        });

    } catch (err) {
        console.error("Login route error:", err);
        return res.render("login.ejs", {
            user: null,
            error: "An unexpected database exception occurred."
        });
    }
});

router.get("/register", (req, res) => {
    res.render("register.ejs", {
        user: req.session.currentUser || null,
        error: null
    });
});

router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
          
        })

        const savedUser = await newUser.save();


        req.session.currentUser = {
            id: savedUser._id,
            username: savedUser.username
        };

        return res.redirect('/users/market');
    }
    catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
})

router.get("/logout", (req, res) => {
  
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).send("Could not log out. Please try again.");
        }

        
        res.clearCookie('connect.sid');

       
        return res.redirect('/users/login');
    });
});

module.exports = router;