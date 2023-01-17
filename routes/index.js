var express = require("express");

const {
  register,
  signin,
  homeData,
  saveSensor,
  getSensorLatest,
  getBills,
  weeklySensor,
  monthlyEnergy,
  showPowerStatus,
  togglePower,
} = require("../controllers/userController");
const verifyLogin = require("../controllers/verifyLogin");
const sensor = require("../models/sensorModel");
var router = express.Router();

router.get("/", verifyLogin, async function (req, res, next) {

  homeData(req.session.user.id).then((r) => {
    res.render("index", {
      user: req.session.user,
      details: {
        username: r.username,
        email: r.email,
        mobile: r.mobile,
        cid: r.cid,
        key: r.key,
      },
    });
  });
});

router.get("/signin", function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("signin");
  }
});

router.post("/signin", function (req, res, next) {
  signin(req.body)
    .then((r) => {
      req.session.loggedIn = true;
      req.session.user = {
        username: r._user.username,
        key: r._user.key,
        id: r._user._id,
        cid: r._user.cid
      };
      res.redirect("/");
    })
    .catch((err) => res.render("signin", { err, data: req.body }));
});

router.get("/signup", function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("signup");
  }
});

router.post("/signup", function (req, res, next) {
  register(req.body)
    .then(() => res.redirect("/"))
    .catch((err) => res.render("signup", { err, data: req.body }));
});

router.get("/logout", function (req, res) {
  let isAdmin = req.session.loggedInAdmin;
  req.session.destroy();
  if (isAdmin) res.redirect("/admin/signin");
  res.redirect("/signin");
});

router.get("/sensor", function (req, res, next) {
  getSensorLatest(req.session.user.key)
    .then((e) => {
      res.status(200).json(e);
    })
    .catch((err) => res.status(400));
});

router.get("/monthly-energy", verifyLogin, (req, res, next)=>{
  monthlyEnergy(req.session.user.cid).then((e)=>{
  res.status(200).json(e)
  }
  ).catch((err)=>res.status(400));
})

router.post("/sensor", async function (req, res, next) {
  let { voltage, current, power, frequency, key, energy, pf } = req.body;
  let data = {
    voltage: voltage,
    current: current,
    power: power,
    frequency: frequency,
    key: key,
    energy: energy,
    pf: pf
  };
  let io = req.app.get("socketio");
  io.emit("added", data);
  if (!isNaN(voltage) && !isNaN(current) && !isNaN(power)) {
    saveSensor(data)
      .then(() =>
        res.status(200).json({
          status: 200,
          message: "success",
        })
      )
      .catch(res.status(400));
  } else {
    res.status(400);
  }
});

router.get('/get-weekly-sensor', verifyLogin, (req, res, next)=>{
  weeklySensor(req.session.user.cid).then((e)=>res.status(200).json(e)).catch((e)=>{
    res.send(404).json(e)})
})

router.get("/payment-view", verifyLogin, function (req, res, next) {
  getBills(req.session.user.key).then(async (e) => {
    res.render("payment", {
      user: req.session.user,
      payments: e,
    });
  });
});

router.get("/powerstatus/:key", function (req, res, next) {
  showPowerStatus(req.params.key).then(r=>res.status(200).json({"status": r})).catch((err)=>res.sendStatus(404));
})

router.get("/powertoggle", verifyLogin, function (req, res, next) {
  togglePower(req.session.user.key).then(res.sendStatus(200)).catch(()=>res.sendStatus(404));
})



module.exports = router;
