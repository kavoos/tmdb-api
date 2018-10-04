import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import uniqueValidator from 'mongoose-unique-validator';

const schema = new mongoose.Schema(
  {
    confirmationToken: {
      default: '',
      type: String
    },
    confirmed: {
      default: false,
      type: Boolean
    },
    email: {
      index: true,
      lowercase: true,
      required: true,
      type: String,
      unique: true
    },
    hash: {
      required: true,
      type: String
    }
  },
  {
    timestamps: true
  }
);

schema.methods.isValidPassword = function isValidPassword(password) {
  return bcrypt.compareSync(password, this.hash);
};

schema.methods.generateConfirmationUrl = function generateConfirmationUrl() {
  return `${process.env.HOST}/confirmation/${this.confirmationToken}`;
};

schema.methods.generateResetPasswordLink = function generateResetPasswordLink() {
  return `${process.env.HOST}/reset_password/${this.generateResetPasswordToken()}`;
};

schema.methods.generateJWT = function generateJWT() {
  return jwt.sign(
    {
      confirmed: this.confirmed,
      email: this.email
    },
    process.env.JWT_SECRET
  );
};

schema.methods.generateResetPasswordToken = function generateResetPasswordToken() {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

schema.methods.setConfirmationToken = function setConfirmationToken() {
  this.confirmationToken = this.generateJWT();
};

schema.methods.setPassword = function setPassword(password) {
  this.hash = bcrypt.hashSync(password, 10);
};

schema.methods.toAuthJSON = function toAuthJSON() {
  return {
    confirmed: this.confirmed,
    email: this.email,
    token: this.generateJWT()
  };
};

schema.plugin(uniqueValidator, { message: 'This email is already taken' });

mongoose.set('useCreateIndex', true);
export default mongoose.model('User', schema);
