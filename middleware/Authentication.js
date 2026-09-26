const isAuthenticated = (req, res, next) => {

    if (req.session && req.session.currentUser) {
        return next();
    }

    return res.redirect('/users/login');
};

module.exports = isAuthenticated;