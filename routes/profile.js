const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");
const CoinData = require("../models/coinData");
const isAuthenticated = require("../middleware/Authentication");

router.use(isAuthenticated);


router.get('/profile', async (req, res) => {
   try {
        const userId = req.session.userId || req.session.currentUser?._id;
        const user = await User.findById(userId)

        if (!user) {
            req.session.destroy();
            return res.redirect('/users/login');
        }

        res.render('profile', { user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Server Error');
    }
})


// route for updating user profile  

router.post('/profile/update', async (req, res) => {
    try {

        const userId = req.user ? req.user._id : req.session.userId;
        if (!userId) {
            return res.status(401).send('Unauthorized');
        }
        const { fullName, email } = req.body;
        if (!fullName || !email) {
            return res.status(400).send('Name and email are required');
        }  
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username: fullName, email },
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).send('User not found');
        }

        res.redirect('/users/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
    
        if (error.code === 11000) {
            return res.status(400).send('Email is already registered by another user.');
        }

        res.status(500).send('An unexpected error occurred.');
    }
});



router.post('/security/update-password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
       
        const userId = req.session.userId || req.session.currentUser?._id || req.session.currentUser?.id;

        if (!userId) {
            return res.redirect('/users/login');
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).send('All password fields are required.');
        }

    
        if (newPassword !== confirmPassword) {
            return res.status(400).send('New password and confirmation password do not match.');
        }

   
        const user = await User.findById(userId);

        if (!user) {
            req.session.destroy();
            return res.redirect('/users/login');
        }

 
        const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordCorrect) {
            return res.status(400).send('Incorrect current password.');
        }

   
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).send('New password must be different from current password.');
        }

        const saltRounds = 10;
        user.password = await bcrypt.hash(newPassword, saltRounds);
        await user.save();

        res.redirect('/users/profile');

    } catch (error) {
        console.error('Password Update Error:', error);
        res.status(500).send('An error occurred while updating your password.');
    }
});

module.exports = router;

module.exports = router;