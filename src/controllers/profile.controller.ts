import { NextFunction, Response, Router } from 'express';
import { Request } from 'express-jwt';
import auth from '../utils/auth';
import {
  blockUser,
  followUser,
  getProfile,
  unblockUser,
  unfollowUser,
} from '../services/profile.service';

const router = Router();

/**
 * Get profile
 * @auth optional
 * @route {GET} /profiles/:username
 * @param username string
 * @returns profile
 */
router.get(
  '/profiles/:username',
  auth.optional,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await getProfile(req.params?.username, req.auth?.username as string);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Follow user
 * @auth required
 * @route {POST} /profiles/:username/follow
 * @param username string
 * @returns profile
 */
router.post(
  '/profiles/:username/follow',
  auth.required,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await followUser(req.params?.username, req.auth?.username as string);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Unfollow user
 * @auth required
 * @route {DELETE} /profiles/:username/follow
 * @param username string
 * @returns profiles
 */
router.delete(
  '/profiles/:username/follow',
  auth.required,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await unfollowUser(req.params.username, req.auth?.username as string);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/profiles/:username/block',
  auth.required,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await blockUser(req.params.username, req.auth?.username as string);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/profiles/:username/block',
  auth.required,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await unblockUser(req.params.username, req.auth?.username as string);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
