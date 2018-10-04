import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendResetPasswordEmail } from '../mailer';

const router = express.Router();

router.post('/', (req, res) => {
  const { credentials } = req.body;
  User.findOne({ email: credentials.email }).then(user => {
    if (user && user.isValidPassword(credentials.password)) {
      res.json({
        user: user.toAuthJSON()
      });
    } else {
      res.status(400).json({
        errors: {
          global: 'Invalid credentials'
        }
      });
    }
  });
});

router.post('/confirmation', (req, res) => {
  const { token } = req.body;
  User.findOneAndUpdate(
    {
      confirmationToken: token
    },
    {
      confirmationToken: '',
      confirmed: true
    },
    {
      new: true
    }
  ).then(
    user =>
      user
        ? res.json({ user: user.toAuthJSON() })
        : res.status(400).json({
            errors: {
              global: 'No user found'
            }
          })
  );
});

router.post('/reset_password', (req, res) => {
  const { password, token } = req.body.data;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({
        errors: {
          global: 'Something went wrong during resetting password'
        }
      });
    } else {
      User.findOne({
        _id: decoded._id
      }).then(user => {
        if (user) {
          user.setPassword(password);
          user.save().then(() => res.json({}));
        } else {
          res.status(404).json({
            errors: {
              global: 'Invalid token'
            }
          });
        }
      });
    }
  });
});

router.post('/reset_password_request', (req, res) => {
  const { email } = req.body;
  User.findOne({
    email
  }).then(user => {
    if (user) {
      sendResetPasswordEmail(user);
      res.json({});
    } else {
      res.status(400).json({
        errors: {
          global: 'There is no user with such email'
        }
      });
    }
  });
});

router.post('/validate_token', (req, res) => {
  const { token } = req.body;
  jwt.verify(token, process.env.JWT_SECRET, err => {
    if (err) {
      res.status(401).json({
        errors: {
          global: 'Something went wrong during validating token'
        }
      });
    } else {
      res.json({});
    }
  });
});

export default router;
