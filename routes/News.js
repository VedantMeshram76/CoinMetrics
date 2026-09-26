const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");
const CoinData = require("../models/coinData");
const isAuthenticated = require("../middleware/Authentication");

router.use(isAuthenticated);


router.get("/news", async (req, res) => {
    try {
       const newsRes = await axios.get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&limit=12', {
            headers: {
                'authorization': `Apikey ${process.env.CRYPTOCOMPARE_API_KEY}`
            }
        });

        if (!newsRes.data || !newsRes.data.Data) {
            throw new Error("Invalid API response format from CryptoCompare");
        }

        const cryptoNews = newsRes.data.Data.map(article => {

            const targetUrl = article.url || article.URL || "#";


            const rawTitle = article.title || article.TITLE || "Market Update Alert";
            const rawBody = article.body || article.BODY || "";
            const cleanBody = rawBody.length > 140 ? rawBody.substring(0, 140) + '...' : rawBody;


            const rawImg = article.imageurl || article.IMAGE_URL || "";
            let imgUrl = "https://images.cryptocompare.com" + rawImg;
            if (rawImg.startsWith('http')) {
                imgUrl = rawImg;
            }


            let sourceName = "CRYPTO SYSTEM";
            if (article.source_info && article.source_info.name) {
                sourceName = article.source_info.name;
            } else if (article.source) {
                sourceName = article.source;
            }

            let displayTime = "JUST NOW";
            const rawTime = article.published_on || article.PUBLISHED_ON;
            if (rawTime) {
                const unixTimestamp = parseInt(rawTime);
                if (!isNaN(unixTimestamp)) {
                    displayTime = new Date(unixTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
            }

            return {
                title: rawTitle,
                url: targetUrl,
                imageUrl: imgUrl,
                source: sourceName,
                body: cleanBody,
                time: displayTime
            };
        });

        return res.render('news', {
            user: req.session.currentUser || null,
            cryptoNews: cryptoNews
        });
    }
    catch (err) {
        
        return res.render('news', {
            user: req.session.currentUser || null,
            cryptoNews: []
        });
    }
});

module.exports = router;