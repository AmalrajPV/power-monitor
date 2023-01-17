const verifyLogin = (req, res, next) => {
    if (req.session.loggedIn) next();
    else res.redirect("/signin");
  };



  module.exports = verifyLogin;