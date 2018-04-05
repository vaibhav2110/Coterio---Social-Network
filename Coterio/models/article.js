const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var User = require('./user');

const commentSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    author:{
        type: String,
        default: ''
    }
}, {timestamps: true}
);
const articleSchema = new Schema({
    mine: {
        type: Boolean,
        required: true,
        default: false
    },
    body: {
        type: String,
        required: true
    },
    img: {
        type: String,
        default: ''
    },
    favoritesCount: {
        type: Number,
        default: 0
    },
    
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comments:[commentSchema]
},
    { timestamps: true }
);

articleSchema.methods.updateFavoriteCount = function() {
  var article = this;
  return User.count({ favorites: { $in: [article._id] } }).then(function(
    count
  ) {
    article.favoritesCount = count;

    return article.save();
  });
};
articleSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Article', articleSchema);