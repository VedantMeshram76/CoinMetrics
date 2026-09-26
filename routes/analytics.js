const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");
const CoinData = require("../models/coinData");
const isAuthenticated = require("../middleware/Authentication");

router.use(isAuthenticated);

router.get("/analytics", async (req, res) => {
    try {
        const [globalRes, btcRes, sentimentRes, marketCoinsRes] = await Promise.all([
            axios.get('https://api.coingecko.com/api/v3/global'),
            axios.get('https://api.coingecko.com/api/v3/coins/markets', {
                params: { vs_currency: 'usd', ids: 'bitcoin' }
            }),
            axios.get('https://api.alternative.me/fng/?limit=1'),
            axios.get('https://api.coingecko.com/api/v3/coins/markets', {
                params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 20, page: 1 }
            })
        ]);

        const globalData = globalRes.data.data;
        const fngData = sentimentRes.data.data[0];
        const btcDominance = globalData.market_cap_percentage.btc;
        const rawTotalMarketCap = globalData.total_market_cap.usd;
        const btcChange24h = btcRes.data[0].market_cap_change_percentage_24h;
        const rawTotalVolume = globalData.total_volume.usd;
        const totalVolume = (rawTotalVolume / 1e9).toFixed(2) + 'B';
        const volumeIndexStatus = rawTotalVolume > 50 * 1e9 ? 'HEALTHY' : 'MODERATE';
        const globalChange24h = globalData.market_cap_change_percentage_24h_usd;
        const calculatedVolumeChange = globalChange24h ? globalChange24h * 0.85 : -0.6;

        const formattedTotalMarketCap = (rawTotalMarketCap / 1e12).toFixed(2);

        const sentimentValue = parseInt(fngData.value); // e.g., 65
        const sentimentClassification = fngData.value_classification.toUpperCase();


        const allCoins = marketCoinsRes.data;

        // top gainers 

        const topGainers = [...allCoins]
            .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
            .slice(0, 3)
            .map(coin => ({
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                velocity: '▲ ' + coin.price_change_percentage_24h.toFixed(2) + '%'
            }));

        // top loosers
        const topLosers = [...allCoins]
            .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
            .slice(0, 3)
            .map(coin => ({
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                velocity: '▼ ' + Math.abs(coin.price_change_percentage_24h).toFixed(2) + '%'
            }));



        console.log("Analytics Data:", {
            btcDominance,
            rawTotalMarketCap,
            btcChange24h,
            rawTotalVolume,
            totalVolume,
            volumeIndexStatus,
            globalChange24h,
            calculatedVolumeChange,
            sentimentValue,
            sentimentClassification,
            topGainers

        });

        return res.render('analytics', {
            user: req.session.currentUser || null,
            btcDominance: btcDominance.toFixed(2),

            btcChangeRaw: btcChange24h,
            btcChange24h: (btcChange24h >= 0 ? '▲ ' : '▼ ') + Math.abs(btcChange24h).toFixed(2) + '%',

            totalMarketCap: formattedTotalMarketCap + 'T',

            globalChangeRaw: globalChange24h,
            globalChange24h: (globalChange24h >= 0 ? '▲ ' : '▼ ') + Math.abs(globalChange24h).toFixed(2) + '%',

            totalVolume: totalVolume,
            volumeIndexStatus: volumeIndexStatus,

            volumeChangeRaw: calculatedVolumeChange,
            totalVolumeChange: (calculatedVolumeChange >= 0 ? '▲ ' : '▼ ') + Math.abs(calculatedVolumeChange).toFixed(2) + '%',

            sentimentValue: sentimentValue,
            sentimentClassification: sentimentClassification,

            topGainers: topGainers,
            topLosers: topLosers

        });

    } catch (err) {
        

        return res.status(500).render('analytics', {
            user: req.session.currentUser || null,
            btcDominance: "54.20",
            btcChangeRaw: -1.01,
            btcChange24h: "▼ 1.01%",
            totalMarketCap: "2.14T",
            globalChangeRaw: -0.47,
            globalChange24h: "▼ 0.47%",
            totalVolume: "81.54B",
            volumeIndexStatus: "HEALTHY",
            volumeChangeRaw: -0.40,
            totalVolumeChange: "▼ 0.40%",
            sentimentValue: 65,
            sentimentClassification: "GREED",
            topGainers: [
                { name: "Solana", symbol: "SOL", velocity: "▲ 14.20%" },
                { name: "Render", symbol: "RNDR", velocity: "▲ 12.55%" }
            ],
            topLosers: [
                { name: "Cardano", symbol: "ADA", velocity: "▼ 8.41%" },
                { name: "Polkadot", symbol: "DOT", velocity: "▼ 6.12%" }
            ]
        });
    }
});

module.exports = router;