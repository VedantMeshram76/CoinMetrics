const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");
const CoinData = require("../models/coinData");
const isAuthenticated = require("../middleware/Authentication");

router.use(isAuthenticated);

// route for market
router.get("/market", async (req, res) => {
    try {
        const url = 'https://api.coingecko.com/api/v3/coins/markets';
        const config = {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 20, // Top 20 Cryptos
                page: 1,
                sparkline: true,
                price_change_percentage: '1h,24h,7d'
            },
            headers: {
                'Accept': 'application/json',
                'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
            }
        };

        const response = await axios.get(url, config);
        const coins = response.data;

        if (!coins || coins.length === 0) {
            throw new Error("No data returned from CoinGecko API");
        }

        const totalPoints = coins[0].sparkline_in_7d.price.length;
        const labels = Array.from({ length: totalPoints }, (_, index) => `H ${index + 1}`);

        const colors = [
            '#a855f7', '#f97316', '#10b981', '#3b82f6', '#ef4444',
            '#eab308', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6'
        ];

        const datasets = coins.map((coin, index) => {
            return {
                label: coin.name,
                data: coin.sparkline_in_7d.price,
                borderColor: colors[index % colors.length],
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.2
            };
        });

        const formattedChartData = {
            coins: coins,
        };

        return res.render('market.ejs', {
            user: req.session.currentUser || null,
            coinData: formattedChartData
        });

    } catch (err) {
        return res.status(500).render('market.ejs', {
            user: req.session.currentUser || null,
            coinData: null
        });
    }
});


// coin info page route 
router.get("/coin_info", async (req, res) => {
    try {
        const coinId = req.query.id || "bitcoin";

        const marketResponse = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
            params: {
                vs_currency: "usd",
                ids: coinId,
                sparkline: true,
                price_change_percentage: "1h,24h,7d"
            },
            headers: {
                "Accept": "application/json",
                "x-cg-demo-api-key": process.env.COINGECKO_API_KEY
            }
        });

        const rawData = marketResponse.data[0];

        if (!rawData) {
            return res.status(404).send("Coin not found");
        }

        const coin = {
            id: rawData.id,
            name: rawData.name,
            symbol: rawData.symbol.toUpperCase(),
            image: rawData.image,
            rank: rawData.market_cap_rank,
            rawPrice: rawData.current_price || 0,
            price: `$${rawData.current_price?.toLocaleString() ?? "0"}`,
            priceChange24h: rawData.price_change_percentage_24h ?? 0,
            marketCap: `$${rawData.market_cap?.toLocaleString() ?? "N/A"}`,
            fdv: rawData.fully_diluted_valuation ? `$${rawData.fully_diluted_valuation.toLocaleString()}` : "N/A",
            volume24h: `$${rawData.total_volume?.toLocaleString() ?? "N/A"}`,
            circulatingSupply: `${rawData.circulating_supply?.toLocaleString() ?? "N/A"} ${rawData.symbol.toUpperCase()}`,
            maxSupply: rawData.max_supply ? `${rawData.max_supply.toLocaleString()} ${rawData.symbol.toUpperCase()}` : "∞",
            high24h: `$${rawData.high_24h?.toLocaleString() ?? "N/A"}`,
            low24h: `$${rawData.low_24h?.toLocaleString() ?? "N/A"}`,
            sparkline: rawData.sparkline_in_7d?.price || []
        };

        res.render("coin_info", {
            user: req.session.currentUser || null,
            coin: coin
        });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;