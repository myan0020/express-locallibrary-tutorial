const async = require('async');
const mongoose = require('mongoose');
const BookInstance = require('../models/bookinstance');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const Book = require('../models/book');
const book = require('../models/book');

// 显示完整的藏书副本列表
exports.bookinstance_list = (req, res) => { 
  BookInstance
    .find()
    .populate('book')
    .exec()
    .then(
      (list_bookinstances) => {
        res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
      },
      (error) =>{
        return next(error);
      }
    )
};

// 为每位藏书副本显示详细信息的页面
exports.bookinstance_detail = (req, res, next) => { 
  const mongooseId = mongoose.Types.ObjectId(req.params.id);
  BookInstance
    .findById(mongooseId)
    .populate('book')
    .exec()
    .then(
      (bookinstance) => {
        if (bookinstance === null) {
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
        res.render('bookinstance_detail', {bookinstance: bookinstance});
      },
      (error) =>{
        if (error) return next(error);
      }
    );
};

// 由 GET 显示创建藏书副本的表单
exports.bookinstance_create_get = (req, res, next) => { 
  Book
  .find({}, 'title')
  .exec()
  .then(
    (books) => { res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books }) },
    (error) => { return next(error); }
  );
};

// 由 POST 处理藏书副本创建操作
exports.bookinstance_create_post = [
  // Validate fields
  body('book', 'Book must be specified').trim().isLength({ min: 1 }),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
  body('due_back', 'Invalid date').trim().optional({ checkFalsy: true }).isISO8601({ strict: true, strictSeparator: true }),
  body('status', 'Imprint must be specified').trim().isLength({ min: 1 }),
  
  // Sanitize fields
  sanitizeBody('book').escape(),
  sanitizeBody('imprint').escape(),
  sanitizeBody('due_back').toDate(),
  sanitizeBody('status').escape(),

  (req, res, next) => { 
    const errors = validationResult(req);
    const bookinstance = new BookInstance({ 
      book: req.body.book,
      imprint: req.body.imprint,
      due_back: req.body.due_back,
      status: req.body.status,
    })

    if (!errors.isEmpty()) {
      Book
      .find()
      .exec()
      .then(
        (books) => {  
          res.render('bookinstance_form', 
                      { 
                        title: 'Create BookInstance', 
                        book_list: books, 
                        bookinstance: bookinstance,
                        errors: errors.array()
                      } 
                    );
        },
        (error) => {
          return next(error);
        }
      )
    } else {
      bookinstance
      .save()
      .then(
        (saved_new_bookinstance) => {
          if (saved_new_bookinstance === bookinstance) {
            res.redirect(bookinstance.url);
          }
        },
        (error) => {
          return next(error);
        }
      )
    }
  }
]

// 由 GET 显示删除藏书副本的表单
exports.bookinstance_delete_get = (req, res, next) => { 
  BookInstance
  .findById(req.params.id)
  .populate('book')
  .exec()
  .then(
    (bookinstance) => { 
      if (bookinstance == null) {
        res.redirect('/catelog/bookinstances');
      }
      
      res.render('bookinstance_delete', { 
                                          title: 'Delete Book Instance', 
                                          bookinstance: bookinstance 
                                        }
      ); 
    },
    (error) => { return next(error); }
  );
};

// 由 POST 处理藏书副本删除操作
exports.bookinstance_delete_post = [
  // Sanitize fields
  sanitizeBody('bookinstanceid').escape(),
  
  (req, res, next) => { 
    BookInstance
    .findById(req.body.bookinstanceid)
    .exec()
    .then(
      (bookinstance) => { 
        if (bookinstance == null) {
          res.redirect('/catelog/bookinstances');
        }
        return BookInstance.findByIdAndRemove(req.body.bookinstanceid).exec();
      },
      (error) => { return next(error); }
    )
    .then(
      () => {res.redirect('/catalog/bookinstances')},
      (error) => { return next(error); }
    );
  }
];

// 由 GET 显示更新藏书副本的表单
exports.bookinstance_update_get = (req, res, next) => { 
  async.parallel(
    {
      bookinstances: (callback) => {
        BookInstance
        .findById(req.params.id)
        .populate('book')
        .exec()
        .then(
          (bookinstances) => { callback(null, bookinstances); },
          (error) => { callback(error, null); }
        );
      },
      books: (callback) => {
        Book
        .find({}, 'title')
        .exec()
        .then(
          (books) => { callback(null, books); },
          (error) => { callback(error, null); }
        );
      }
    },
    (error, result) => {
      if (error) {
        return next(error);
      }
      res.render('bookinstance_form', 
                 { 
                   title: 'Update BookInstance', 
                   book_list: result.books,
                   bookinstance: result.bookinstances
                 });
    }
  );
};

// 由 POST 处理藏书副本更新操作
exports.bookinstance_update_post = [
  // Validate fields
  body('book', 'Book must be specified').trim().isLength({ min: 1 }),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
  body('due_back', 'Invalid date').trim().optional({ checkFalsy: true }).isISO8601({ strict: true, strictSeparator: true }),
  body('status', 'Imprint must be specified').trim().isLength({ min: 1 }),
  
  // Sanitize fields
  sanitizeBody('book').escape(),
  sanitizeBody('imprint').escape(),
  sanitizeBody('due_back').toDate(),
  sanitizeBody('status').escape(),

  (req, res, next) => { 
    const errors = validationResult(req);
    const bookinstance_detail = { 
      book: req.body.book,
      imprint: req.body.imprint,
      due_back: req.body.due_back,
      status: req.body.status,
    };
    const bookinstance = new BookInstance(bookinstance_detail);

    if (!errors.isEmpty()) {
      Book
      .find()
      .exec()
      .then(
        (books) => {  
          res.render('bookinstance_form', 
                      { 
                        title: 'Update BookInstance', 
                        book_list: books, 
                        bookinstance: bookinstance,
                        errors: errors.array()
                      } 
                    );
        },
        (error) => {
          return next(error);
        }
      )
    } else {
      BookInstance
      .findByIdAndUpdate(req.params.id, bookinstance_detail)
      .then(
        (updated_new_bookinstance) => {
          res.redirect(updated_new_bookinstance.url);
        },
        (error) => {
          return next(error);
        }
      )
    }
  }
];



