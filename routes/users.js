var express = require("express");
const { homeData, editProfile } = require("../controllers/userController");
const verifyLogin = require("../controllers/verifyLogin");
var router = express.Router();

router.get("/edit", verifyLogin, function (req, res, next) {
  homeData(req.session.user.id)
    .then(async(r) => {
      res.render("profile-edit", {
        user: req.session.user,
        details: {
          username: r.username,
          mobile: r.mobile,
          key: r.key,
        },
        active: await isUserActive(req.session.user.id)
      });
    })
});

router.post("/edit", verifyLogin, function (req, res, next) {
  editProfile(req.body, req.session.user.id)
    .then((r) => res.redirect("/"))
    .catch((err) => res.send("error"));
});
module.exports = router;
