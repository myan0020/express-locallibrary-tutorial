const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const mongoose = require('mongoose');

// 显示完整的藏书种类列表
exports.genre_list = (req, res, next) => { 
  Genre
    .find()
    .sort({name: 1})
    .exec()
    .then(
      (list_genres) => {
        res.render('genre_list', {title: 'Genre List', genre_list: list_genres});
      },
      (error) => {
        return next(error);
      }
    );
};

// 为每位藏书种类显示详细信息的页面
exports.genre_detail = (req, res, next) => { 
  const mongooseId = mongoose.Types.ObjectId(req.params.id);

  async.parallel(
    {
      genre: (callback) => {
        Genre
          .findById(mongooseId)
          .exec()
          .then(
            (genre) => {
              callback(null, genre);
            },
            (error) => {
              callback(error, null);
            }
          )
      },
      genre_books: (callback) => {
        Book
          .find({genre: mongooseId})
          .exec()
          .then(
            (books) => {
              callback(null, books);
            },
            (error) => {
              callback(error, null);
            }
          )
      }
    },
    (error, result) => {
      if (error) {
        return next(error);
      }
      if (result.genre === null) {
        const error = new Error('Genre Not Found');
        error.status = 404;
        return next(error);
      }
      res.render('genre_detail', {genre: result.genre, genre_books: result.genre_books});
    }
  )
};

// 由 GET 显示创建藏书种类的表单
exports.genre_create_get = (req, res, next) => { res.send('未实现：藏书种类创建表单的 GET'); };

// 由 POST 处理藏书种类创建操作
exports.genre_create_post = (req, res, next) => { res.send('未实现：创建藏书种类的 POST'); };

// 由 GET 显示删除藏书种类的表单
exports.genre_delete_get = (req, res, next) => { res.send('未实现：藏书种类删除表单的 GET'); };

// 由 POST 处理藏书种类删除操作
exports.genre_delete_post = (req, res, next) => { res.send('未实现：删除藏书种类的 POST'); };

// 由 GET 显示更新藏书种类的表单
exports.genre_update_get = (req, res, next) => { res.send('未实现：藏书种类更新表单的 GET'); };

// 由 POST 处理藏书种类更新操作
exports.genre_update_post = (req, res, next) => { res.send('未实现：更新藏书种类的 POST'); };