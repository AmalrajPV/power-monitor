const verifyAdmin = (req, res, next) => {
    if (req.session.loggedInAdmin) next();
    else res.redirect("/admin/signin");
  };

  module.exports = verifyAdmin;