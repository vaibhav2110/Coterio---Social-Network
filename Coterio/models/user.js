var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },
    propic: {
        type: String,
        default: ""
    },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
});

User.methods.favorite = function(id) {
  if (this.favorites.indexOf(id) === -1) {
    this.favorites.push(id);
  }

  return this.save();
};

User.methods.unfavorite = function(id) {
  this.favorites.remove(id);
  return this.save();
};

User.methods.isFavorite = function(id) {
  return this.favorites.some(function(favoriteId) {
    return favoriteId.toString() === id.toString();
  });
};

User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);