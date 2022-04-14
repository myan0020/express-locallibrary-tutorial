const mongoose = require('mongoose');
const async = require('async');
const Author = require('../models/author');
const Book = require('../models/book');
const author = require('../models/author');

// 显示完整的作者列表
exports.author_list = (req, res, next) => { 
  Author
    .find()
    .sort({family_name: 1})
    .exec()
    .then(
      (list_authors) => {
        res.render('author_list', {title: 'Author List', author_list: list_authors});
      },
      (error) => {
        return next(error);
      }
    );
};

// 为每位作者显示详细信息的页面
exports.author_detail = (req, res, next) => { 
  const mongooseId = mongoose.Types.ObjectId(req.params.id);
  async.parallel(
    {
      author: (callback) => {
        Author
          .findById(mongooseId)
          .exec()
          .then(
            (author) => {callback(null, author)},
            (error) => {callback(error, null)}
          )
      },
      author_books: (callback) => {
        Book
          .find({author: mongooseId}, 'title summary')
          .exec()
          .then(
            (books) => {callback(null, books)},
            (error) => {callback(error, null)}
          );
      }
    },
    (error, result) => {
      if (error) {
        return next(error);
      }
      if (result.author === null) {
        const error = new Error('Author Not Found');
        error.status = 404;
        return next(error);
      }
      res.render('author_detail', {author: result.author, author_books: result.author_books});
    }
  );
};

// 由 GET 显示创建作者的表单
exports.author_create_get = (req, res, next) => { res.send('未实现：作者创建表单的 GET'); };

// 由 POST 处理作者创建操作
exports.author_create_post = (req, res, next) => { res.send('未实现：创建作者的 POST'); };

// 由 GET 显示删除作者的表单
exports.author_delete_get = (req, res, next) => { res.send('未实现：作者删除表单的 GET'); };

// 由 POST 处理作者删除操作
exports.author_delete_post = (req, res, next) => { res.send('未实现：删除作者的 POST'); };

// 由 GET 显示更新作者的表单
exports.author_update_get = (req, res, next) => { res.send('未实现：作者更新表单的 GET'); };

// 由 POST 处理作者更新操作
exports.author_update_post = (req, res, next) => { res.send('未实现：更新作者的 POST'); };
