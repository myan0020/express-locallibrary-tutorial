const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const indexRouter = require('./routes/index');     
const catalogRouter = require('./routes/catalog'); // 导入 catalog 路由

const app = express();

/**
 * mongoose connection setup
 */
const mongooseUrl = process.env.MONGODB_URI || 'mongodb://mingdongshensen:mingdongshensen@localhost/admin';
const mongooseOptions = { dbName: 'test' };       
mongoose.connect(mongooseUrl, mongooseOptions);   
mongoose.connection.on('connecting', function(){
  console.log("mongodb connecting...");
});
mongoose.connection.on('connected', function() {
  console.log("mongodb connection established");
});
mongoose.connection.on('disconnected', function() {
  console.log('mongodb connection closed');
});
mongoose.connection.on('error', console.error.bind(console, 'MongoDB 连接错误：'));

/**
 * view engine 'pug' setup
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

/**
 * ??? middleware setup
 */
app.use(logger('dev'));

/**
 * ??? middleware setup
 */
app.use(express.json());

/**
 * ??? middleware setup
 */
app.use(express.urlencoded({ extended: false }));

/**
 * cookieParser middleware setup
 */
app.use(cookieParser());

/**
 * static files serving middleware setup
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * router setup
 */
app.use('/', indexRouter);
app.use('/catalog', catalogRouter);

/**
 * routing failure handling: 
 * if route fails, create 404 error and forward to error handler
 */ 
app.use(function(req, res, next) {
  next(createError(404));
});

/**
 * error handling middleware setup
 */
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
