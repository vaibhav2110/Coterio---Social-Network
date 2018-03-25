var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
var User = require('../models/user');

var passport = require('passport');
var authenticate = require('../authenticate');
router.use(bodyParser.json());

/* GET users listing. */

router.post('/signup', (req, res, next) => {
  User.register(new User({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
     if (req.body.firstname)
        user.firstname = req.body.firstname;
      if (req.body.lastname)
        user.lastname = req.body.lastname;
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return ;
        }
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful!'});
        });
      });
    }
  });
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  var token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true,token: token, status: 'You are successfully logged in!'});
});
router.get('/me', authenticate.verifyUser, (req,res,next)=>{
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(req.user);
});
router.get('/me/followers', authenticate.verifyUser, (req,res,next)=>{
      User.findById(req.user._id)
      .populate('followers')
      .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user.followers);
      }, (err)=> next(err))
      .catch((err)=> next(err));  
      
});
router.get('/me/following', authenticate.verifyUser, (req,res,next)=>{
      User.findById(req.user._id)
      .populate('following')
      .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user.following);
      }, (err)=> next(err))
      .catch((err)=> next(err));  
      
});

router.get('/me/favorites', authenticate.verifyUser, (req,res,next)=>{
      User.findById(req.user._id)
      .populate('favorites')
      .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user.favorites);
      }, (err)=> next(err))
      .catch((err)=> next(err));  
      
});

router.get('/:userId', authenticate.verifyUser, (req,res,next)=>{
      User.findById(req.params.userId)
      .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user);
      }, (err)=> next(err))
      .catch((err)=> next(err));     
});

router.post('/:userId/follow', authenticate.verifyUser, (req, res, next)=>{
    if(req.user.isFollowing(req.params.userId)){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({alreadyfollowing: 'true'});
    }
    else{
        req.user.follow(req.params.userId)
        .then((user)=>{
            User.findById(req.params.userId)
            .then((user)=>{
                if(user.followers.indexOf(req.user._id)==-1){
                    user.followers = user.followers.concat([req.user._id]);
                }
                user.save()
                .then((user)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user);
                },(err)=> next(err))
                .catch((err)=> next(err)); 
            },(err)=> next(err))
            .catch((err)=> next(err)); 
        },(err)=> next(err))
        .catch((err)=> next(err));
    }
    
    /*User.findById(req.params.userId)
    .then((user)=>{
        console.log(user);
        if(user.isFollowed(user, req.user._id)){
           res.statusCode = 200;
           res.setHeader('Content-Type', 'application/json');
           res.json({alreadyfollowed: 'true'});
           }
        else{
            user.followed(req.user._id)
            .then((user)=>{
                req.user.follow(user._id)
                .then((user)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user);
                }, (err)=> next(err))
                .catch((err)=> next(err));  
            }, (err)=> next(err))
            .catch((err)=> next(err));  
        }
    }, (err)=> next(err))
      .catch((err)=> next(err));  */
});
router.post('/:userId/unfollow', authenticate.verifyUser, (req, res, next)=>{
    if(!req.user.isFollowing(req.params.userId)){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({alreadynotfollowing: 'true'});
    }
    else{
        req.user.unfollow(req.params.userId)
        .then((user)=>{
            User.findById(req.params.userId)
            .then((user)=>{
                console.log(user.followers);
                if(user.followers.indexOf(req.user._id)>-1){
                    user.followers.splice(user.followers.indexOf(req.user._id),1);
                }
                user.save()
                .then((user)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user);
                },(err)=> next(err))
                .catch((err)=> next(err)); 
            },(err)=> next(err))
            .catch((err)=> next(err)); 
        },(err)=> next(err))
        .catch((err)=> next(err));
    }
    
    /*User.findById(req.params.userId)
    .then((user)=>{
        console.log(user);
        if(user.isFollowed(user, req.user._id)){
           res.statusCode = 200;
           res.setHeader('Content-Type', 'application/json');
           res.json({alreadyfollowed: 'true'});
           }
        else{
            user.followed(req.user._id)
            .then((user)=>{
                req.user.follow(user._id)
                .then((user)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user);
                }, (err)=> next(err))
                .catch((err)=> next(err));  
            }, (err)=> next(err))
            .catch((err)=> next(err));  
        }
    }, (err)=> next(err))
      .catch((err)=> next(err));  */
});
/*router.post('/:userId/unfollow', authenticate.verifyUser, (req, res, next)=>{
    User.findById(req.params.userId)
    .then((user)=>{
        if(!user.isFollowed(req.user._id)){
           res.statusCode = 200;
           res.setHeader('Content-Type', 'application/json');
           res.json({alreadyunfollowed: 'true'});
           }
        else{
            user.unfollowed(req.user._id)
            .then((user)=>{
                req.user.unfollow(user._id)
                .then((user)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user);
                }, (err)=> next(err))
                .catch((err)=> next(err));  
            }, (err)=> next(err))
            .catch((err)=> next(err));  
        }
    }, (err)=> next(err))
      .catch((err)=> next(err));  
});*/


module.exports = router;
