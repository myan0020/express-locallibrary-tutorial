const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const async = require('async');
const mongoose = require('mongoose');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// 将‘req.body.genre’字段转换为数组的中间件
const converting_middleware = (req, res, next) => {  
  if (!(req.body.genre instanceof Array)) {
    if (typeof req.body.genre === 'undefined') {
      req.body.genre = [];
    } else {
      req.body.genre = new Array(req.body.genre);
    }
  }
  next();
}

// 用于生成，转换‘req.body.genre’之后一系列操作的中间件builder
const after_converting_middleware_builder = (is_create_book) => {
  const form_title = is_create_book ? 'Create Book' : 'Update Book';

  const save_book_as_new = (book_object, save_success_handling, save_error_handling) => {
    book_object
    .save()
    .then(
      (saved_new_book) => { 
        if (saved_new_book === book_object) {
          save_success_handling(book_object.url);
        }
      },
      (error) => { save_error_handling(error); }
    );
  };

  const save_book_as_existing = (bookid, book_detail, save_success_handling, save_error_handling) => {
    Book
    .findByIdAndUpdate(bookid, book_detail)
    .exec()
    .then(
      (updated_book_object) => { 
        save_success_handling(updated_book_object.url);
      },
      (error) => { save_error_handling(error); }
    );
  };

  const handle_save_success = (res) => {
    return (redirect_url) => { res.redirect(redirect_url); }
  };

  const handle_save_error = (next) => {
    return (error) => next(error);
  }

  return (req, res, next) => { 
    const errors = validationResult(req);
    const book_detail = {
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre
    };
    const book = new Book(book_detail);
    if (!errors.isEmpty()) {
      async.parallel({
        authors: (callback) => { 
          Author
          .find()
          .exec()
          .then(
            (authors) => {callback(null, authors);},
            (error) => {callback(error, null);}
          ); 
        },
        genres: (callback) => {
          Genre
          .find()
          .exec()
          .then(
            (genres) => {callback(null, genres);},
            (error) => {callback(error, null);}
          );
        }
      },
      (error, result) => {
        if (error) { return next(error); }
        for (let i = 0; i < result.genres.length; i++) {
          if (book.genre.indexOf(result.genres[i]._id) > -1) {
            result.genres[i].checked='true';
          }
        }
        res.render('book_form', 
                    { 
                      title: form_title,
                      authors: result.authors, 
                      genres: result.genres, 
                      book: book, 
                      errors: errors.array() 
                    });
      });
      return;
    } else {
      is_create_book ? save_book_as_new(book, 
                                        handle_save_success(res), 
                                        handle_save_error(next)) 
                     : save_book_as_existing(req.params.id, 
                                             book_detail, 
                                             handle_save_success(res), 
                                             handle_save_error(next));
    }
  };
}

// 用于生成，处理’新书‘的中间件数组的builder， is_create_book用于区分‘新书’是create还是update操作
const incoming_new_book_middlewares_builder = (is_create_book) => {
  return [converting_middleware, after_converting_middleware_builder(is_create_book)];
}

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
exports.book_create_get = (req, res, next) => { 
  async.parallel(
    {
      authors: (callback) => {
        Author
          .find()
          .exec()
          .then(
            (authors) => {
              callback(null, authors);
            },
            (error) => {
              callback(error, null);
            }
          );
      },
      genres: (callback) => {
        Genre
          .find()
          .exec()
          .then(
            (genres) => {
              callback(null, genres);
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
      res.render('book_form', { title: 'Title', authors: result.authors, genres: result.genres });
    }
  );
};

// 由 POST 处理藏书创建操作
exports.book_create_post = incoming_new_book_middlewares_builder(true);

// 由 GET 显示删除藏书的表单
exports.book_delete_get = (req, res, next) => { 
  async.parallel(
    {
      book: (callback) => {
        Book
        .findById(req.params.id)
        .exec()
        .then(
          (book) => { callback(null, book); },
          (error) => { callback(error, null); }
        );
      },
      book_bookinstances: (callback) => {
        BookInstance
        .find({ book: req.params.id })
        .exec()
        .then(
          (book_bookinstances) => { callback(null, book_bookinstances); },
          (error) => { callback(error, null); }
        );
      }
    },
    (error, result) => {
      if (error) {
        return next(error);
      }
      if (result.book == null) {
        res.redirect('/catelog/books');
      }
      res.render( 'book_delete',   
                  { 
                    title: 'Delete Book', 
                    book: result.book, 
                    book_bookinstances: result.book_bookinstances 
                  }
      );
    }
  );
};

// 由 POST 处理藏书删除操作
exports.book_delete_post = [
  // Sanitize fields
  sanitizeBody('bookid').escape(),

  // Process request after sanitization
  (req, res, next) => { 
    Book
    .findById(req.body.bookid)
    .exec()
    .then(
      (book) => { 
        if (book == null) {
          res.redirect('/catelog/books');
        }
        return Book.findByIdAndRemove(req.body.bookid).exec();
      },
      (error) => { return next(error); }
    )
    .then(
      () => {res.redirect('/catalog/books')},
      (error) => { return next(error); }
    );
  }
];

// 由 GET 显示更新藏书的表单
exports.book_update_get = (req, res, next) => { 
  async.parallel(
    {
      book: (callback) => {
        Book
        .findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec()
        .then(
          (book) => { callback(null, book); },
          (error) => { callback(error, null); }
        );
      },
      authors: (callback) => {
        Author
        .find()
        .exec()
        .then(
          (author) => { callback(null, author); },
          (error) => { callback(error, null); }
        );
      },
      genres: (callback) => {
        Genre
        .find()
        .exec()
        .then(
          (genres) => { callback(null, genres); },
          (error) => { callback(error, null); }
        );
      }
    },
    (error, result) => {
      if (error) {
        return next(error);
      }

      if (result.book == null) {
        const error = new Error('Book not found');
        error.status = 404;
        return next(error);
      }

      const str_all_genres = [];
      for (genre of result.genres) {
        str_all_genres.push(genre.toString());
      }
      for (let i = 0; i < result.book.genre.length; i++) {
        let index = str_all_genres.indexOf(result.book.genre[i].toString());
        if (index > -1) {
          result.genres[index].checked = true;
        }
      }
      
      res.render( 'book_form',   
                  { 
                    title: 'Update Book', 
                    authors: result.authors, 
                    genres: result.genres,
                    book: result.book
                  }
      );
    }
  );


};

// 由 POST 处理藏书更新操作
exports.book_update_post = incoming_new_book_middlewares_builder(false);



