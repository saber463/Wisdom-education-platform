import express from 'express';
import {
  publishTweet,
  getTweets,
  getSingleTweet,
  likeTweet,
  addComment,
  replyComment,
  likeComment,
  shareTweet,
  deleteTweet,
  getUserTweets,
} from '../controllers/tweetController.js';
import { auth } from '../middleware/auth.js';
import { checkSensitive } from '../middleware/sensitiveCheck.js';
import { uploadTweetImages } from '../middleware/upload.js';
import { verifyCsrfToken } from '../middleware/csrf.js';

const router = express.Router();

router.post('/', auth, verifyCsrfToken, uploadTweetImages, checkSensitive, publishTweet);

router.post('/:id/comments', auth, verifyCsrfToken, checkSensitive, addComment);

router.post('/:id/comments/:commentId/reply', auth, verifyCsrfToken, checkSensitive, replyComment);

router.post('/:id/comments/:commentId/like', auth, verifyCsrfToken, likeComment);

router.get('/', auth, getTweets);

router.get('/:id', getSingleTweet);

router.post('/:id/like', auth, verifyCsrfToken, likeTweet);

router.post('/:id/share', auth, verifyCsrfToken, shareTweet);

router.delete('/:id', auth, verifyCsrfToken, deleteTweet);

router.get('/user/list', auth, getUserTweets);

export default router;
