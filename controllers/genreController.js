const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// 显示完整的藏书种类列表
exports.genre_list = (req, res, next) => {
  Genre
    .find()
    .sort({ name: 1 })
    .exec()
    .then(
      (list_genres) => {
        res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
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
          .find({ genre: mongooseId })
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
      res.render('genre_detail', { genre: result.genre, genre_books: result.genre_books });
    }
  )
};

// 由 GET 显示创建藏书种类的表单
exports.genre_create_get = (req, res, next) => {
  res.render('genre_form', { title: 'Create Genre' });
};

// 由 POST 处理藏书种类创建操作
exports.genre_create_post = [
  // Validate fields
  body('name', 'Genre Name Required').trim().isLength({ min: 1 }),

  // Sanitize fields
  sanitizeBody('name').escape(),

  // Process request after validation and sanitization
  (req, res, next) => {
    const errors = validationResult(req);
    const genre_detail = { name: req.body.name };
    const genre = new Genre(genre_detail);
    if (!errors.isEmpty()) {
      res.render('genre_form', { title: 'Create Genre', genre: genre_detail, errors: errors.array() });
      return;
    } else {
      Genre
        .findOne({ name: req.body.name })
        .exec()
        .then(
          (found_genre) => {
            if (found_genre) {
              res.redirect(found_genre.url);
            }
            else {
              return genre.save();
            };
          },
          (error) => next(error)
        )
        .then(
          (saved_new_genre) => {
            if (saved_new_genre === genre) {
              res.redirect(genre.url);
            }
          },
          (error) => next(error)
        )
    }
  }
];

// 由 GET 显示删除藏书种类的表单
exports.genre_delete_get = [
  // Sanitize fields
  sanitizeBody('authorid').escape(),

  // Process request after sanitization
  (req, res, next) => {
    async.parallel(
      {
        genre: (callback) => {
          Genre
            .findById(req.params.id)
            .exec()
            .then(
              (genre) => { callback(null, genre); },
              (error) => { callback(error, null); }
            );
        },
        genre_books: (callback) => {
          Book
            .find({ genre: req.params.id })
            .exec()
            .then(
              (genre_books) => { callback(null, genre_books); },
              (error) => { callback(error, null); }
            );
        }
      },
      (error, result) => {
        if (error) {
          return next(error);
        }
        if (result.genre == null) {
          res.redirect('/catelog/genres');
        }
        res.render('genre_delete',
          {
            title: 'Delete Genre',
            genre: result.genre,
            genre_books: result.genre_books
          }
        );
      }
    );
  }
];

// 由 POST 处理藏书种类删除操作
exports.genre_delete_post = [
  // Sanitize fields
  sanitizeBody('genreid').escape(),

  // Process request after sanitization
  (req, res, next) => {
    Genre
      .findById(req.body.genreid)
      .exec()
      .then(
        (genre) => {
          if (genre == null) {
            res.redirect('/catelog/genres');
          }
          return Genre.findByIdAndRemove(req.body.genreid).exec();
        },
        (error) => { return next(error); }
      )
      .then(
        () => { res.redirect('/catalog/genres') },
        (error) => { return next(error); }
      );
  }
]

// 由 GET 显示更新藏书种类的表单
exports.genre_update_get = (req, res, next) => {
  Genre
    .findById(req.params.id)
    .exec()
    .then(
      (genre) => {
        res.render('genre_form', { title: 'Create Genre', genre: genre });
      },
      (error) => { return next(error); }
    );
};

// 由 POST 处理藏书种类更新操作
exports.genre_update_post = [
  // Validate fields
  body('name', 'Genre Name Required').trim().isLength({ min: 1 }),

  // Sanitize fields
  sanitizeBody('name').escape(),

  // Process request after validation and sanitization
  (req, res, next) => {
    const errors = validationResult(req);
    const genre_detail = { name: req.body.name };
    const genre = new Genre(genre_detail);
    if (!errors.isEmpty()) {
      res.render(
        'genre_form',
        {
          title: 'Update Genre',
          genre: genre,
          errors: errors.array()
        });
      return;
    } else {
      Genre
        .findByIdAndUpdate(req.params.id, genre_detail)
        .exec()
        .then(
          (updated_genre) => {
            res.redirect(updated_genre.url);
          },
          (error) => next(error)
        );
    }
  }
];