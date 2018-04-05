var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
var User = require('../models/user');
const cors = require('./cors');
var passport = require('passport');
var authenticate = require('../authenticate');
router.use(bodyParser.json());


/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); } )
router.post('/signup', cors.corsWithOptions,(req, res, next) => {
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
          res.json({success: true,user: req.user, status: 'Registration Successful!'});
        });
      });
    }
  });
});

router.post('/login', cors.corsWithOptions, (req, res, next) => {

  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);

    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Login Unsuccessful!', err: info});
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!'});          
      }

      var token = authenticate.getToken({_id: req.user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, status: 'Login Successful!',user: user, token: token});
    }); 
  }) (req, res, next);
});

router.get('/me', cors.cors, authenticate.verifyUser, (req,res,next)=>{
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(req.user);
});
router.get('/me/followers',cors.cors, authenticate.verifyUser, (req,res,next)=>{
      User.findById(req.user._id)
      .populate('followers')
      .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user.followers);
      }, (err)=> next(err))
      .catch((err)=> next(err));  
      
});
router.get('/me/following',cors.cors, authenticate.verifyUser, (req,res,next)=>{
      User.findById(req.user._id)
      .populate('following')
      .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user.following);
      }, (err)=> next(err))
      .catch((err)=> next(err));  
      
});

router.get('/me/favorites',cors.cors, authenticate.verifyUser, (req,res,next)=>{
      User.findById(req.user._id)
      .populate('favorites')
      .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user.favorites);
      }, (err)=> next(err))
      .catch((err)=> next(err));  
      
});
router.get('/checkJWTToken', cors.corsWithOptions, (req, res) => {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
    if (err)
      return next(err);
    
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({status: 'JWT invalid!', success: false, err: info});
    }
    else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({status: 'JWT valid!', success: true, user: user});

    }
  }) (req, res);
});

router.get('/:userId',cors.cors, authenticate.verifyUser, (req,res,next)=>{
      User.findById(req.params.userId)
      .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user);
      }, (err)=> next(err))
      .catch((err)=> next(err));     
});

router.post('/:userId/follow',cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
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
router.post('/:userId/unfollow',cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
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
