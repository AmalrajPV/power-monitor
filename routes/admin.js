var express = require("express");
const { signin, signup, getUsers, adminDashboard } = require("../controllers/adminController");
const verifyAdmin = require("../controllers/verifyAdmin");
var router = express.Router();

router.get('/', verifyAdmin, (req, res, next)=>{
    adminDashboard().then((result)=>{
        console.log(result);
        res.render('admin',{user: req.session.user, data: result});
    }).catch((err)=>res.sendStatus(400));
})

router.get('/users', verifyAdmin, (req, res, next)=>{
    let active = req.query.active;
    
    let qry;
    if (active == 'true') {
        qry = {active: true}
    }
    else if(active == 'false'){
        qry = {active: false}
    }
    else{
        qry = {}
    }
    getUsers(qry).then((result)=>{
        res.render('display-users',{user: req.session.user, result});
    }).catch((err)=>res.sendStatus(400));
    
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
