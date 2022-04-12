/**
 * requirements
 */
const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/usermodel');

/**
 * mongodb connection status setup
 */
mongoose.connection.on('connecting', function(){
  console.log("mongodb connecting...");
});

mongoose.connection.on('connected', function() {
  console.log("mongodb connection established");
});

mongoose.connection.on('error', function(err) {
  console.log('mongodb connection failed: ' + err);
});

mongoose.connection.on('disconnected', function() {
  console.log('mongodb connection closed');
})

/**
 * mongodb operations setup
 */
const mongooseUrl = 'mongodb://mingdongshensen:mingdongshensen@localhost/admin';
const mongooseOptions = {dbName: 'test'};

async function persistUser(firstName, lastName, age, phone) {
  await mongoose.connect(mongooseUrl, mongooseOptions);
  const user = new User({ firstName: firstName, lastName: lastName, age: age, phone: phone});

  console.log('mongodb saving...');

  await user.save();
}

async function queryUser() {
  await mongoose.connect(mongooseUrl, mongooseOptions);
  console.log('mongodb querying...');
  const result = await User.find({ phone: '55544422211' }, 'firstName').exec();
  return result;
}

/**
 * router setup
 */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/saveUser', function(req, res, next) {
  persistUser('Xiao','Nan', 20, '55544422211')
  .then(
    () => { 
      console.log('mongodb save succss');
      res.status(200).send('save user done');
    }, 
    (error) => { 
      console.log('mongodb save failed: ', error);
      res.status(500).send('save user failed \n');
    }
  )
  .then(() => { mongoose.disconnect() });
});

router.get('/queryUser', function(req, res, next) {
  queryUser()
  .then(
    (result) => { 
      console.log('query result: \n', result);
      res.status(200).send(JSON.stringify(result));
    }, 
    (error) => { 
      console.log('mongodb query failed: \n', error);
      res.status(500).send('query user failed \n', error);
    }
  )
  .then(() => { mongoose.disconnect() });
});


module.exports = router;
