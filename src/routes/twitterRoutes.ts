// Twitter routes
import express, { Router } from "express";
import { monitorTwitterUser } from "../controllers/twitterController";

const router: Router = express.Router();

/**
 * @route POST /api/twitter/monitor
 * @desc Monitor Twitter user - get user info and latest tweets
 * @access Public
 * @body { username: string, tweetCount?: number }
 */
router.post("/monitor", monitorTwitterUser);

export default router;
