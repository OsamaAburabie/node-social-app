import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';

const generateToken = (user: User, tokenId: string): string => {
  const token = jwt.sign(user, process.env.JWT_SECRET || 'superSecret', {
    expiresIn: '60d',
    jwtid: tokenId,
  });

  return token;
};

export default generateToken;
