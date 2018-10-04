import jwt from 'jsonwebtoken';
import User from '../models/User';

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  let token;

  if (header) [, token] = header.split(' ');

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({ errors: { global: 'Invalid token' } });
      } else {
        User.findOne({ email: decoded.email }).then(user => {
          req.currentUser = user;
          next();
        });
      }
    });
  } else {
    res.status(401).json({ errors: { global: 'No token provided' } });
  }
};

export default authenticate;
