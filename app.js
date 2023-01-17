var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var dotenv = require("dotenv");
var session = require("express-session");
var http=require("http");
var socket = require("socket.io");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var adminRouter = require("./routes/admin");

var hbs = require('express-handlebars');
var mongoose =  require("mongoose");
mongoose.set('strictQuery', false);
dotenv.config();


const connect = () =>{
  try {
      mongoose.connect(process.env.DB);
      console.log("connected to database");
  } catch (error) {
      throw error;
  }
}

var app = express();

const server = require('http').createServer(app);
var io = socket(server);
app.set('socketio', io);
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials'
}))

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "key",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 6000000 },
  })
);


const schedule = require('node-schedule');
const { addBill } = require("./controllers/userController");
const job = schedule.scheduleJob('* * * 1 * *', function(){
  addBill();
  job.cancelNext('* * * 1 * *');
});

app.use("/", indexRouter);
app.use("/user", usersRouter);
app.use("/admin", adminRouter);

connect();


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


module.exports = { app: app, server: server };;
