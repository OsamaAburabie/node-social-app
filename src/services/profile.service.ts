import prisma from '../../prisma/prisma-client';
import profileMapper from '../utils/profile.utils';
import HttpException from '../models/http-exception.model';
import { findUserIdByUsername } from './auth.service';

export const getProfile = async (usernamePayload: string, usernameAuth: string) => {
  const profile = await prisma.user.findUnique({
    where: {
      username: usernamePayload,
    },
    include: {
      followers: true,
    },
  });

  if (!profile) {
    throw new HttpException(404, {});
  }

  return profileMapper(profile, usernameAuth);
};

export const followUser = async (usernamePayload: string, usernameAuth: string) => {
  const { id, blocking, blockedBy } = await findUserIdByUsername(usernameAuth);

  const isSameUser = usernamePayload === usernameAuth;
  if (isSameUser) {
    throw new HttpException(403, {
      errors: {
        message: `You can't follow yourself`,
      },
    });
  }

  const isBlocking = blocking.some((user: any) => user.username === usernamePayload);
  if (isBlocking) {
    throw new HttpException(403, {
      errors: {
        message: `You can't follow ${usernamePayload} because you have blocked him/her`,
      },
    });
  }

  const isBlockedBy = blockedBy.some((user: any) => user.username === usernamePayload);
  if (isBlockedBy) {
    throw new HttpException(403, {
      errors: {
        message: `You can't follow ${usernamePayload} because they have blocked you`,
      },
    });
  }

  const profile = await prisma.user.update({
    where: {
      username: usernamePayload,
    },
    data: {
      followers: {
        connect: {
          id,
        },
      },
    },
    include: {
      followers: true,
    },
  });

  return profileMapper(profile, usernameAuth);
};

export const unfollowUser = async (usernamePayload: string, usernameAuth: string) => {
  const { id } = await findUserIdByUsername(usernameAuth);

  const profile = await prisma.user.update({
    where: {
      username: usernamePayload,
    },
    data: {
      followers: {
        disconnect: {
          id,
        },
      },
    },
    include: {
      followers: true,
    },
  });

  return profileMapper(profile, usernameAuth);
};

export const blockUser = async (usernamePayload: string, usernameAuth: string) => {
  const { id } = await findUserIdByUsername(usernameAuth);

  const isSame = usernamePayload === usernameAuth;

  if (isSame) {
    throw new HttpException(403, {
      errors: {
        message: `You can't block yourself`,
      },
    });
  }

  await prisma.user.update({
    where: {
      username: usernamePayload,
    },
    data: {
      blockedBy: {
        connect: {
          id,
        },
      },
      followers: {
        disconnect: {
          id,
        },
      },
      following: {
        disconnect: {
          id,
        },
      },
    },
  });

  return {
    success: true,
    message: `${usernamePayload} has been blocked`,
  };
};

export const unblockUser = async (usernamePayload: string, usernameAuth: string) => {
  const { id } = await findUserIdByUsername(usernameAuth);
  const isSame = usernamePayload === usernameAuth;

  if (isSame) {
    throw new HttpException(403, {
      errors: {
        message: `You can't unblock yourself what the hell`,
      },
    });
  }

  await prisma.user.update({
    where: {
      username: usernamePayload,
    },
    data: {
      blockedBy: {
        disconnect: {
          id,
        },
      },
    },
  });

  return {
    success: true,
    message: `${usernamePayload} has been unblocked`,
  };
};
