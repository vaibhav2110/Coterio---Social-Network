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
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
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

User.methods.follow = function(id) {
  if (this.following.indexOf(id) === -1) {
    this.following.push(id);
  }

  return this.save();
};

User.methods.unfollow = function(id) {
  this.following.remove(id);
  return this.save();
};

User.methods.followed = function(id) {
  if (this.followers.indexOf(id) === -1) {
    this.follower.push(id);
  }

  return this.save();
};

User.methods.unfollowed = function(id) {
  this.followers.remove(id);
  return this.save();
};

User.methods.isFollowed = function(user, id) {
  user = this;
  return this.followers.some(function(followId) {
    return followId.toString() === id.toString();
  });
};

User.methods.isFollowing = function(id) {
  return this.following.some(function(followId) {
    return followId.toString() === id.toString();
  });
};

User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);