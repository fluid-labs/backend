// Twitter controller
import { Request, Response } from "express";
import {
    monitorTwitterUser as monitorTwitterUserService,
    getTwitterUserByUsername,
} from "../services/twitterService";

/**
 * Request interface for Twitter monitoring
 */
interface TwitterMonitorRequest {
    username: string;
    tweetCount?: number;
}

/**
 * Monitor Twitter user - get user info and latest tweets
 * @param req Express request
 * @param res Express response
 */
export const monitorTwitterUser = async (req: Request, res: Response) => {
    try {
        const { username, tweetCount = 10 }: TwitterMonitorRequest = req.body;

        // Validate request
        if (!username) {
            return res.status(400).json({
                error: "Missing required parameter",
                message: "Username is required",
            });
        }

        // Clean username (remove @ if present)
        const cleanUsername = username.replace(/^@/, "");

        // Validate tweet count
        const validTweetCount = Math.min(Math.max(tweetCount || 10, 1), 20); // Max 20 tweets

        console.log(
            `Monitoring Twitter user: ${cleanUsername}, fetching ${validTweetCount} tweets`
        );

        // Call the service to monitor the user
        const result = await monitorTwitterUserService(
            cleanUsername,
            validTweetCount
        );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error("Error monitoring Twitter user:", error);
        res.status(500).json({
            error: "Failed to monitor Twitter user",
            message: error.message || "Unknown error",
        });
    }
};
