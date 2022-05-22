// const jwt = require('express-jwt');
import { expressjwt, TokenGetter, IsRevoked } from 'express-jwt';
import * as jwt from 'jsonwebtoken';
import { checkSessionRevoked } from '../services/auth.service';

const getTokenFromHeaders: TokenGetter = req => {
  if (
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') ||
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
};

const IsRevokedCallback: IsRevoked = async (req, token) => {
  const { jti } = token?.payload as jwt.JwtPayload;
  return await checkSessionRevoked(jti);
};

const auth = {
  required: expressjwt({
    secret: process.env.JWT_SECRET || 'superSecret',
    getToken: getTokenFromHeaders,
    isRevoked: IsRevokedCallback,
    algorithms: ['HS256'],
  }),
  optional: expressjwt({
    secret: process.env.JWT_SECRET || 'superSecret',
    credentialsRequired: false,
    getToken: getTokenFromHeaders,
    algorithms: ['HS256'],
  }),
};

export default auth;
