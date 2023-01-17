var express = require("express");
const { signin, signup } = require("../controllers/adminController");
const verifyAdmin = require("../controllers/verifyAdmin");
var router = express.Router();

router.get('/', verifyAdmin, (req, res, next)=>{
    res.render('admin',{user: req.session.user,});
})
router.get('/signin', (req, res, next)=>{
    res.render('admin-signin');
})
router.post('/signin', (req, res, next)=>{
    signin(req.body).then((r)=>{
        req.session.loggedInAdmin = true;
      req.session.user = {
        username: r._user.username,
        id: r._user._id,
      };
        res.redirect('/admin/')
    }).catch(err=>res.render('admin-signin'))
});
router.post('/signup', (req, res, next)=>{
    signup(req.body).then(r=>res.status(200).json({msg:"success"})).catch(e=>res.status(400).json({msg:"error"}));
});

module.exports = router;
