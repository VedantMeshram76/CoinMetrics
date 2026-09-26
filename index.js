
require('dotenv').config();


const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session'); 
const userRouter = require("./routes/user");
const axios = require('axios');
const marketRouter = require('./routes/market');
const analyticsRouter = require('./routes/analytics');
const NewsRouter = require('./routes/News');
const portfolioRouter = require('./routes/portfolio');
const transactionRouter = require('./routes/transaction');
const aboutRouter = require('./routes/about');
const profileRouter = require('./routes/profile');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(session({
    secret: 'coinmetrics_session_secret_2026',
    resave: false,
    saveUninitialized: false,
}));

const MONGODB_URL = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URL)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

const PORT = process.env.PORT || 4000;

app.use('/users', userRouter);
app.use('/users', marketRouter);
app.use('/users', analyticsRouter);
app.use('/users', NewsRouter);
app.use('/users', portfolioRouter);
app.use('/users', transactionRouter);
app.use('/users', aboutRouter);
app.use('/users', profileRouter);
app.get('/', async (req, res) => {
    return res.render('home.ejs', { 
        user: req.session.currentUser || null, 
        coinData: null 
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});