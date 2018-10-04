import express from 'express';
import request from 'request-promise';
import { parseString } from 'xml2js';
import authenticate from '../middlewares/authenticate';
import Book from '../models/Book';
import parseErrors from '../utils/parseErrors';

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  Book.find({ userId: req.currentUser._id }).then(books => res.json({ books }));
});

router.post('/', (req, res) => {
  Book.create({ ...req.body.book, userId: req.currentUser._id })
    .then(book => res.json({ book }))
    .catch(err => res.status(400).json({ errors: parseErrors(err.errors) }));
});

router.get('/search', (req, res) => {
  request
    .get(
      `https://www.goodreads.com/search/index.xml?key=${process.env.GOODREADS_KEY}&q=${
        req.query.q
      }&search[field]=title`
    )
    .then(result =>
      parseString(result, (err, goodreadsResult) => {
        if (err || !goodreadsResult.GoodreadsResponse.search[0].results[0].work) {
          return res.json({ error: 'Nothing found' });
        }
        return res.json({
          books: goodreadsResult.GoodreadsResponse.search[0].results[0].work.map(work => ({
            goodreadsId: work.best_book[0].id[0]._,
            title: work.best_book[0].title[0],
            author: work.best_book[0].author[0].name[0],
            cover: work.best_book[0].image_url[0],
            smallCover: work.best_book[0].small_image_url[0]
          }))
        });
      })
    )
    .catch(() => res.status(400).json({ errors: { global: 'Invalid search result' } }));
});

export default router;
