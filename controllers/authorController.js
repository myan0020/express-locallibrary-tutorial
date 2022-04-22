const mongoose = require('mongoose');
const async = require('async');
const Author = require('../models/author');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

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
exports.author_create_get = (req, res, next) => { 
  res.render('author_form', { title: 'Create Author' });
};

// 由 POST 处理作者创建操作
exports.author_create_post = [
  // Validate fields
  body('first_name').trim()
  .isLength({ min: 1 }).withMessage('First name must be specified.')
  .isAlphanumeric().withMessage('First name has non-alphanumeric'),
  body('family_name').trim()
  .isLength({ min: 1 }).withMessage('Family name must be specified.')
  .isAlphanumeric().withMessage('Family name has non-alphanumeric'),
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601({ strict: true, strictSeparator: true }),
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601({ strict: true, strictSeparator: true }),

  // Sanitize fields
  sanitizeBody('first_name').escape(),
  sanitizeBody('family_name').escape(),
  sanitizeBody('date_of_birth').toDate(),
  sanitizeBody('date_of_death').toDate(),

  // Process request after validation and sanitization
  (req, res, next) => { 
    const errors = validationResult(req);
    const author_detail = { 
      first_name: req.body.first_name,
      family_name: req.body.family_name, 
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death
    };
    const author = new Author(author_detail);
    if (!errors.isEmpty()) {
      res.render('author_form', { title: 'Create Author', author: author, errors: errors.array() });
      return;
    } else {
      author
      .save()
      .then(
        (saved_new_author) => { 
          if (saved_new_author === author) {
            res.redirect(author.url); 
          }
        },
        (error) => next(error)
      )
    }
  }
];

// 由 GET 显示删除作者的表单
exports.author_delete_get = (req, res, next) => { 
  async.parallel(
    {
      author: (callback) => {
        Author
        .findById(req.params.id)
        .exec()
        .then(
          (author) => { callback(null, author); },
          (error) => { callback(error, null); }
        );
      },
      author_books: (callback) => {
        Book
        .find({ author: req.params.id })
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
      if (result.author == null) {
        res.redirect('/catelog/authors');
      }
      res.render( 'author_delete',   
                  { 
                    title: 'Delete Author', 
                    author: result.author, 
                    author_books: result.author_books 
                  }
      );
    }
  );
};

// 由 POST 处理作者删除操作
exports.author_delete_post = [
  // Sanitize fields
  sanitizeBody('authorid').escape(),

  // Process request after sanitization
  (req, res, next) => { 
    Author
    .findById(req.body.authorid)
    .exec()
    .then(
      (author) => { 
        if (author == null) {
          res.redirect('/catelog/authors');
        }
        return Author.findByIdAndRemove(req.body.authorid).exec();
      },
      (error) => { return next(error); }
    )
    .then(
      () => {res.redirect('/catalog/authors')},
      (error) => { return next(error); }
    );
  }
];

// 由 GET 显示更新作者的表单
exports.author_update_get = (req, res, next) => { 
  Author
  .findById(req.params.id)
  .exec()
  .then(
    (author) => { 
      res.render('author_form', 
                   { 
                     title: 'Update Author', 
                     author: author
                   }
                );
    },
    (error) => next(error)
  );
};

// 由 POST 处理作者更新操作
exports.author_update_post = [
  // Validate fields
  body('first_name').trim()
  .isLength({ min: 1 }).withMessage('First name must be specified.')
  .isAlphanumeric().withMessage('First name has non-alphanumeric'),
  body('family_name').trim()
  .isLength({ min: 1 }).withMessage('Family name must be specified.')
  .isAlphanumeric().withMessage('Family name has non-alphanumeric'),
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601({ strict: true, strictSeparator: true }),
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601({ strict: true, strictSeparator: true }),

  // Sanitize fields
  sanitizeBody('first_name').escape(),
  sanitizeBody('family_name').escape(),
  sanitizeBody('date_of_birth').toDate(),
  sanitizeBody('date_of_death').toDate(),

  // Process request after validation and sanitization
  (req, res, next) => { 
    const errors = validationResult(req);
    const author_detail = { 
      first_name: req.body.first_name,
      family_name: req.body.family_name, 
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death
    };
    const author = new Author(author_detail);
    if (!errors.isEmpty()) {
      res.render('author_form', { title: 'Create Author', author: author, errors: errors.array() });
      return;
    } else {
      Author
      .findByIdAndUpdate(req.params.id, author_detail)
      .exec()
      .then(
        (updated_new_author) => { 
          res.redirect(updated_new_author.url);
        },
        (error) => next(error)
      )
    }
  }
];
