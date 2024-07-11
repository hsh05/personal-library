'use strict';

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

module.exports = function (app) {

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cors());

  mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection error:', err));

  const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    comments: { type: [String], default: [] }
  });

  const Book = mongoose.model('Book', bookSchema);

  app.route('/api/books')
    .get(async function (req, res) {
      try {
        const books = await Book.find();
        const response = books.map(book => ({
          _id: book._id,
          title: book.title,
          commentcount: book.comments.length
        }));
        res.json(response);
      } catch (err) {
        res.status(500).send('Server error');
      }
    })

    .post(async function (req, res) {
      const title = req.body.title;
      if (!title) {
        return res.status(200).send('missing required field title');
      }

      try {
        const newBook = new Book({ title });
        const savedBook = await newBook.save();
        res.status(200).json({ _id: savedBook._id, title: savedBook.title });
      } catch (err) {
        res.status(500).send('Server error');
      }
    })

    .delete(async function (req, res) {
      try {
        await Book.deleteMany({});
        res.send('complete delete successful');
      } catch (err) {
        res.status(500).send('Server error');
      }
    });

  app.route('/api/books/:id')
    .get(async function (req, res) {
      const bookid = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(bookid)) {
        return res.status(200).send('no book exists');
      }

      try {
        const book = await Book.findById(bookid);
        if (!book) {
          return res.status(200).send('no book exists');
        }
        res.status(200).json({ _id: book._id, title: book.title, comments: book.comments });
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    })

    .post(async function (req, res) {
      const bookid = req.params.id;
      const comment = req.body.comment;
      if (!comment) {
        return res.status(200).send('missing required field comment');
      }

      if (!mongoose.Types.ObjectId.isValid(bookid)) {
        return res.status(200).send('no book exists');
      }

      try {
        const book = await Book.findById(bookid);
        if (!book) {
          return res.status(200).send('no book exists');
        }
        book.comments.push(comment);
        const savedBook = await book.save();
        res.status(200).json({ _id: savedBook._id, title: savedBook.title, comments: savedBook.comments });
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    })

    .delete(async function (req, res) {
      const bookid = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(bookid)) {
        return res.status(200).send('no book exists');
      }

      try {
        const book = await Book.findByIdAndDelete(bookid);
        if (!book) {
          return res.status(200).send('no book exists');
        }
        res.status(200).send('delete successful');
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    });
};
