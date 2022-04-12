const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    default: 18,
    min: 0
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /\d{11}/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  }
});

module.exports = mongoose.model('UserModel', userSchema, 'users');