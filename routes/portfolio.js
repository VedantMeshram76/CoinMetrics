const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");
const CoinData = require("../models/coinData");
const isAuthenticated = require("../middleware/Authentication");

router.use(isAuthenticated);


router.get('/portfolio', async (req, res) => {
    try {
        const userId = req.session.currentUser?._id;
        if (!userId) {
            return res.redirect("/users/login");
        }

        const transactions = await CoinData.find({ user: userId });

        // 1. Calculate current net balance per coin
        const balances = {};
        transactions.forEach(tx => {
            const coinId = tx.coin.id;
            const amount = Number(tx.amount);
            if (!balances[coinId]) balances[coinId] = 0;

            if (tx.type === 'buy') {
                balances[coinId] += amount;
            } else if (tx.type === 'sell') {
                balances[coinId] -= amount;
            }
        });

        // 2. Compute current holdings data & performance metrics
        let totalLiveValue = 0;
        let totalValue24hAgo = 0;
        const activeHoldings = [];

        Object.keys(balances).forEach(coinId => {
            const currentBalance = balances[coinId];

            if (currentBalance > 0) {
                const match = transactions.find(tx => tx.coin?.id === coinId);
                const coin = match?.coin || {};

                const currentPrice = coin.current_price || match?.price || 0;
                const change24hPct = coin.price_change_percentage_24h || 0;

                const price24hAgo = currentPrice / (1 + (change24hPct / 100));
                const currentValue = currentBalance * currentPrice;
                const value24hAgo = currentBalance * price24hAgo;

                totalLiveValue += currentValue;
                totalValue24hAgo += value24hAgo;

                activeHoldings.push({
                    id: coinId,
                    name: coin.name || coinId,
                    symbol: (coin.symbol || coinId).toUpperCase(),
                    amount: currentBalance,
                    currentPrice: currentPrice,
                    currentValue: currentValue,
                    change24hPct: change24hPct
                });
            }
        });

        // 3. Compute 24h overall portfolio percentage change
        let portfolioChange24hPct = 0;
        if (totalValue24hAgo > 0) {
            portfolioChange24hPct = ((totalLiveValue - totalValue24hAgo) / totalValue24hAgo) * 100;
        }

        // 4. Safe Best & Worst Performers defaults
        let bestPerformer = null;
        let worstPerformer = null;

        if (activeHoldings.length > 0) {
            const sortedHoldings = [...activeHoldings].sort((a, b) => b.change24hPct - a.change24hPct);

            bestPerformer = {
                symbol: sortedHoldings[0].symbol,
                change24hPct: sortedHoldings[0].change24hPct.toFixed(2)
            };

            worstPerformer = {
                symbol: sortedHoldings[sortedHoldings.length - 1].symbol,
                change24hPct: sortedHoldings[sortedHoldings.length - 1].change24hPct.toFixed(2)
            };
        }

        // 5. Calculate Asset Allocations (%)
        const allocations = activeHoldings.map(item => ({
            symbol: item.symbol,
            percentage: totalLiveValue > 0 ? ((item.currentValue / totalLiveValue) * 100).toFixed(2) : "0.00"
        }));

        // 6. Generate 30-Day Historical Chart Data Points
        const chartLabels = [];
        const chartDataPoints = [];

        for (let i = 29; i >= 0; i--) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - i);
            targetDate.setHours(23, 59, 59, 999);

            const formattedDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            chartLabels.push(formattedDate);

            const balanceAtDate = {};
            transactions.forEach(tx => {
                const txDate = new Date(tx.createdAt || tx.date);
                if (txDate <= targetDate) {
                    const coinId = tx.coin?.id;
                    if (!coinId) return;
                    const amount = Number(tx.amount);

                    if (!balanceAtDate[coinId]) balanceAtDate[coinId] = 0;

                    if (tx.type === 'buy') balanceAtDate[coinId] += amount;
                    else if (tx.type === 'sell') balanceAtDate[coinId] -= amount;
                }
            });

            let totalPortfolioValueForThisDay = 0;
            Object.keys(balanceAtDate).forEach(coinId => {
                const match = transactions.find(tx => tx.coin?.id === coinId);
                const price = match?.coin?.current_price || match?.price || 0;
                totalPortfolioValueForThisDay += (balanceAtDate[coinId] * price);
            });

            chartDataPoints.push(Number(totalPortfolioValueForThisDay.toFixed(2)));
        }

        // 7. Render View
        res.render('portfolio', {
            user: req.session.currentUser || null,
            transactions: transactions,
            holdings: activeHoldings,
            currentLiveValue: totalLiveValue.toFixed(2),
            portfolioChange24hPct: portfolioChange24hPct.toFixed(2),
            bestPerformer: bestPerformer,
            worstPerformer: worstPerformer,
            allocations: allocations,
            chartLabels: JSON.stringify(chartLabels),
            chartDataPoints: JSON.stringify(chartDataPoints)
        });

    } catch (err) {
       
        return res.status(500).render('portfolio', {
            user: req.session.currentUser || null,
            transactions: [],
            holdings: [],
            currentLiveValue: "0.00",
            portfolioChange24hPct: "0.00",
            bestPerformer: null,
            worstPerformer: null,
            allocations: [],
            chartLabels: JSON.stringify([]),
            chartDataPoints: JSON.stringify([])
        });
    }
});

module.exports = router;