const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const async = require('async');
const { default: mongoose } = require('mongoose');

exports.index = (req, res, next) => { 
  async.parallel({
    book_count: function(callback) {
      Book.count({}, callback); // Pass an empty object as match condition to find all documents of this collection
    },
    book_instance_count: function(callback) {
      BookInstance.count({}, callback);
    },
    book_instance_available_count: function(callback) {
      BookInstance.count({status:'Available'}, callback);
    },
    author_count: function(callback) {
      Author.count({}, callback);
    },
    genre_count: function(callback) {
      Genre.count({}, callback);
    }
  }, (error, results) => {
      res.render('index', { title: 'Local Library Home', error: error, data: results });
  });
};

// 显示完整的藏书列表
exports.book_list = (req, res, next) => { 
  Book.find({}, 'title author')
    .populate('author')
    .exec(function (err, list_books) {
      if (err) { return next(err); }
      //Successful, so render
      console.log('first book url:', list_books[0]);
      res.render('book_list', { title: 'Book List', book_list: list_books });
    });
};

// 为每位藏书显示详细信息的页面
exports.book_detail = (req, res, next) => { 
  const mongooseId = mongoose.Types.ObjectId(req.params.id);

  async.parallel(
    {
      book: (callback) => {
        Book
          .findById(mongooseId)
          .populate('author')
          .populate('genre')
          .exec()
          .then(
            (book) => {
              callback(null, book);
            },
            (error) => {
              callback(error, null);
            }
          );
      },
      book_instances: (callback) => {
        BookInstance
          .find({book: mongooseId})
          .exec()
          .then(
            (book_instances) => {
              callback(null, book_instances);
            },
            (error) => {
              callback(error, null);
            }
          );
      }
    },
    (error, result) => {
      if (error) {
        return next(error);
      }
      if (result.book === null) {
        const error = new Error('Book Not Found');
        error.status = 404;
        return next(error);
      }
      res.render('book_detail', { title: 'Title', book: result.book, book_instances: result.book_instances});
    }
  );
};

// 由 GET 显示创建藏书的表单
exports.book_create_get = (req, res, next) => { res.send('未实现：藏书创建表单的 GET'); };

// 由 POST 处理藏书创建操作
exports.book_create_post = (req, res, next) => { res.send('未实现：创建藏书的 POST'); };

// 由 GET 显示删除藏书的表单
exports.book_delete_get = (req, res, next) => { res.send('未实现：藏书删除表单的 GET'); };

// 由 POST 处理藏书删除操作
exports.book_delete_post = (req, res, next) => { res.send('未实现：删除藏书的 POST'); };

// 由 GET 显示更新藏书的表单
exports.book_update_get = (req, res, next) => { res.send('未实现：藏书更新表单的 GET'); };

// 由 POST 处理藏书更新操作
exports.book_update_post = (req, res, next) => { res.send('未实现：更新藏书的 POST'); };
