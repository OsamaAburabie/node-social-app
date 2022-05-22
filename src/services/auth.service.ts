import bcrypt from 'bcryptjs';
import { RegisterInput } from '../models/register-input.model';
import prisma from '../../prisma/prisma-client';
import HttpException from '../models/http-exception.model';
import { RegisteredUser } from '../models/registered-user.model';
import generateToken from '../utils/token.utils';
import { User } from '@prisma/client';
import { nanoid } from 'nanoid';

const checkUserUniqueness = async (email: string, username: string) => {
  const existingUserByEmail = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  const existingUserByUsername = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
    },
  });

  if (existingUserByEmail || existingUserByUsername) {
    throw new HttpException(422, {
      errors: {
        ...(existingUserByEmail ? { email: ['has already been taken'] } : {}),
        ...(existingUserByUsername ? { username: ['has already been taken'] } : {}),
      },
    });
  }
};

export const createUser = async (input: RegisterInput): Promise<RegisteredUser> => {
  const email = input.email?.trim();
  const username = input.username?.trim();
  const password = input.password?.trim();
  const { image, bio } = input;

  if (!email) {
    throw new HttpException(422, { errors: { email: ["can't be blank"] } });
  }

  if (!username) {
    throw new HttpException(422, { errors: { username: ["can't be blank"] } });
  }

  if (!password) {
    throw new HttpException(422, { errors: { password: ["can't be blank"] } });
  }

  await checkUserUniqueness(email, username);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      ...(image ? { image } : {}),
      ...(bio ? { bio } : {}),
    },
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      image: true,
    },
  });

  const tokenId = nanoid();
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenId,
    },
  });

  return {
    ...user,
    token: generateToken(user as User, tokenId),
  };
};

export const login = async (userPayload: any) => {
  const email = userPayload.email?.trim();
  const password = userPayload.password?.trim();

  if (!email) {
    throw new HttpException(422, { errors: { email: ["can't be blank"] } });
  }

  if (!password) {
    throw new HttpException(422, { errors: { password: ["can't be blank"] } });
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      bio: true,
      image: true,
    },
  });

  if (user) {
    const match = await bcrypt.compare(password, user.password);

    const tokenId = nanoid();
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenId,
      },
    });

    if (match) {
      return {
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
        token: generateToken(user as User, tokenId),
      };
    }
  }

  throw new HttpException(403, {
    errors: {
      'email or password': ['is invalid'],
    },
  });
};

export const getCurrentUser = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      image: true,
    },
  });

  if (!user) {
    throw new HttpException(404, {
      errors: {
        user: ['not found'],
      },
    });
  }

  const tokenId = nanoid();
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenId,
    },
  });

  return {
    ...user,
    token: generateToken(user as User, tokenId),
  };
};

export const updateUser = async (userPayload: any, loggedInUsername: string) => {
  const { email, username, password, image, bio } = userPayload;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: {
      username: loggedInUsername,
    },
    data: {
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
      ...(password ? { password: hashedPassword } : {}),
      ...(image ? { image } : {}),
      ...(bio ? { bio } : {}),
    },
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      image: true,
    },
  });

  if (!user) {
    throw new HttpException(404, {
      errors: {
        user: ['not found'],
      },
    });
  }

  const tokenId = nanoid();
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenId,
    },
  });

  return {
    ...user,
    token: generateToken(user as User, tokenId),
  };
};

export const findUserIdByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      blocking: {
        select: {
          username: true,
        },
      },
      blockedBy: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!user) {
    throw new HttpException(404, {});
  }

  return user;
};

export const checkSessionRevoked = async (tokenId: string | undefined) => {
  const session = await prisma.session.findUnique({
    where: {
      tokenId,
    },
  });

  if (!session) {
    return true;
  }

  if (session.revoked === true) {
    return true;
  }

  return false;
};
