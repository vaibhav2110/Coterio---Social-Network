const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');

const Article = require('../models/article');

const multer = require('multer');
const articleRouter = express.Router();

const storage = multer.diskStorage({
    destination: (req,file,cb)=> {
        cb(null, 'public/images');
    },
    filename: (req, file, cb)=>{
        cb(null, file.originalname)
    }
});

const imageFileFilter = (req, file, cb)=>{
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter});

articleRouter.use(bodyParser.json());

articleRouter.route('/')
.get((req,res,next) => {
    Article.find({})
    .populate('comments.author')
    .populate('author')
    .then((articles)=>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(articles);
    }, (err)=> next(err))
    .catch((err)=> next(err));
})
.post(authenticate.verifyUser, (req,res,next) => {
    req.body.author = req.user._id;
    Article.create(req.body)
    .then((article)=>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(article);
    }, (err)=> next(err))
    .catch((err)=> next(err));
});
articleRouter.route('/home')
.get(authenticate.verifyUser, (req,res,next) => {
    if(req.user.following.length > 0 ){
        Article.find({$or: [{'author' : { $in: [req.user.following] }}, {'author': req.user._id}]
        })
        .populate('comments.author')
        .populate('author')
        .then((articles)=>{
            console.log(articles);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(articles);
        }, (err)=> next(err))
        .catch((err)=> next(err));
        }
    else{
        Article.find({'author': req.user._id})
        .populate('comments.author')
        .populate('author')
        .then((articles)=>{
            console.log(articles);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(articles);
        }, (err)=> next(err))
        .catch((err)=> next(err));
        }
    
});
articleRouter.route('/img')
.post(authenticate.verifyUser,upload.single('avatar'), (req,res,next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(req.file);
});

articleRouter.route('/:articleId')
.get((req,res,next)=>{
    Article.findById(req.params.articleId)
    .populate('author')
    .then((article)=>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(article);
    },(err)=> next(err))
    .catch((err)=>next(err));
})
.delete(authenticate.verifyUser, (req,res,next)=>{
    Article.findById(req.params.articleId)
    .then((article) => {
        if( article != null ){
            var id1 = req.user._id;
            var id2 = article.author;
            if(id1.equals(id2)){
                article.remove();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(article);
            }
            else{
                err = new Error('not allowed');
                err.status = 404;
                return next(err);
            }
            
        }
    }, (err)=> next(err))
    .catch((err)=> next(err));
});
articleRouter.route('/:articleId/favorite')
.get(authenticate.verifyUser, (req,res,next)=>{
    if(req.user.isFavorite(req.params.articleId)){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true});
    }
    else{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false});
    }
})
.post(authenticate.verifyUser, (req,res,next)=>{
    if(req.user.isFavorite(req.params.articleId)){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: 'Already favorited'});
    }
    else{
        req.user.favorite(req.params.articleId)
        .then((user)=>{
            Article.findById(req.params.articleId).
            then((article)=>{
                article.updateFavoriteCount()
                .then((article)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(article);
                },(err)=> next(err))
                .catch((err)=> next(err));
            },(err)=> next(err))
            .catch((err)=> next(err));
        },(err)=> next(err))
        .catch((err)=> next(err));
        }
    });
articleRouter.route('/:articleId/unfavorite')
.get(authenticate.verifyUser, (req,res,next)=>{
    if(req.user.isFavorite(req.params.articleId)){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true});
    }
    else{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false});
    }
})
.post(authenticate.verifyUser, (req,res,next)=>{
    if(!req.user.isFavorite(req.params.articleId)){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: 'Already unfavorited'});
    }
    else{
        req.user.unfavorite(req.params.articleId)
        .then((user)=>{
            Article.findById(req.params.articleId).
            then((article)=>{
                article.updateFavoriteCount()
                .then((article)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(article);
                },(err)=> next(err))
                .catch((err)=> next(err));
            },(err)=> next(err))
            .catch((err)=> next(err));
        },(err)=> next(err))
        .catch((err)=> next(err));
        }
});

articleRouter.route('/:articleId/comments')
.get((req,res,next)=>{
    Article.findById(req.params.articleId)
    .populate('comments.author')
    .then((article)=>{
        if(article != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(article.comments); 
        }
        else {
            err = new Error('Article ' + req.params.articleId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req,res,next)=>{
    Article.findById(req.params.articleId)
    .then((article)=>{
        if(article != null){
            req.body.author = req.user._id;
            article.comments = article.comments.concat([req.body]);
            article.save()
            .then((article)=>{
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(article);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Article ' + req.params.articleId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

articleRouter.route('/:articleId/comments/:commentId')
.get((req,res,next)=>{
    Article.findById(req.params.articleId)
    .populate('comments.author')
    .populate('author')
    .then((article)=>{
        if( article != null && 
          article.comments.id(req.params.commentId) != null)
            {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(article.comments.id(req.params.commentId));
            }
            else if (article == null) {
                err = new Error('Article ' + req.params.articleId + ' not found');
                err.status = 404;
                return next(err);
           }
            else {
                err = new Error('Comment ' + req.params.commentId + ' not found');
                err.status = 404;
                return next(err);            
            }
        }, (err) => next(err))
        .catch((err) => next(err)); 
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Article.findById(req.params.articleId)
    .then((article) => {
        if (article != null && article.comments.id(req.params.commentId) != null) {
            var id1 = req.user._id;
            var id2 = article.comments.id(req.params.commentId).author;
            
            console.log(id1);
            console.log(id2);
            if(id1.equals(id2)){
            article.comments.id(req.params.commentId).remove();
                article.save()
                .then((article) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(article);                
                }, (err) => next(err));      
        }
            else{
                err = new Error('Dusra ka comment hai bhai');
                err.status = 404;
                return next(err);
            }
        }
        else if (article == null) {
            err = new Error('Article ' + req.params.articleId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = articleRouter;