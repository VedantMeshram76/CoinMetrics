

const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");
const CoinData = require("../models/coinData");
const isAuthenticated = require("../middleware/Authentication");

router.use(isAuthenticated);

router.get("/transactions", async (req, res) => {
    try {
        const coinListRes = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 20,
                page: 1
            }
        });
        if (!req.session || !req.session.currentUser) {
            return res.redirect("/users/login");
        }
       
        res.render('add-transaction.ejs', {
            user: req.session.currentUser || null,
            coins: coinListRes.data
        });
    } catch (err) {
        return res.status(500).render('add-transaction.ejs', {
            user: req.session.currentUser || null,
            coins: []
        });
    }
});

router.post("/transactions/:id", async (req, res) => {
    try {
        const { coinDataObject, amount, price, type } = req.body;
        const userId = req.params.id;

        if (!userId) {
            return res.redirect(`/users/transactions?error=${encodeURIComponent("User ID is missing.")}`);
        }
        if (!coinDataObject) {
            return res.redirect(`/users/transactions?error=${encodeURIComponent("No coin data selected.")}`);
        }

        const numAmount = Number(amount);
        const numPrice = Number(price);

        if (!numAmount || numAmount <= 0 || !numPrice || numPrice <= 0) {
            return res.redirect(`/users/transactions?error=${encodeURIComponent("Invalid amount or price entered.")}`);
        }

        const fullCoinData = JSON.parse(coinDataObject);
        const coinId = fullCoinData.id;

        // -------------------------------------------------------------
        // BALANCE VALIDATION LOGIC FOR SELL TRANSACTIONS
        // -------------------------------------------------------------
        if (type === 'sell') {
            // 1. Fetch all previous transactions for this user and coin
            const existingTxs = await CoinData.find({ user: userId });

            // 2. Filter transactions for the current coin (checking nested coin.id)
            const coinTxs = existingTxs.filter(tx => tx.coin && tx.coin.id === coinId);

            // 3. Calculate current net balance
            let currentBalance = 0;
            coinTxs.forEach(tx => {
                if (tx.type === 'buy') {
                    currentBalance += tx.amount;
                } else if (tx.type === 'sell') {
                    currentBalance -= tx.amount;
                }
            });

            // 4. Check if user has sufficient holdings
            if (numAmount > currentBalance) {
                const errorMsg = `Insufficient balance. You only own ${currentBalance.toFixed(4)} ${fullCoinData.symbol.toUpperCase()}, but tried to sell ${numAmount}.`;
                return res.redirect(`/users/transactions?error=${encodeURIComponent(errorMsg)}`);
            }
        }
        // -------------------------------------------------------------

        // Save transaction if validation passes
        const coinData = new CoinData({
            coin: fullCoinData,
            amount: numAmount,
            price: numPrice,
            type: type,
            user: userId
        });

        await coinData.save();

        return res.redirect("/users/transactions?success=true");
    }
    catch (err) {
        return res.redirect(`/users/transactions?error=${encodeURIComponent(err.message)}`);
    }
});

module.exports = router;


