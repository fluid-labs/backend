// Twitter service
import axios from "axios";

// RapidAPI configuration
const RAPIDAPI_KEY =
    process.env.RAPIDAPI_KEY ||
    "b5b88c23c4msh86056fa6761d794p1104afjsnca09380d751b";
const RAPIDAPI_HOST = "twitter241.p.rapidapi.com";

/**
 * Twitter user information interface
 */
export interface TwitterUser {
    id: string;
    rest_id: string;
    name: string;
    screen_name: string;
    description: string;
    followers_count: number;
    friends_count: number;
    verified: boolean;
    profile_image_url_https: string;
}

/**
 * Twitter tweet interface
 */
export interface TwitterTweet {
    id: string;
    text: string;
    created_at: string;
    author: {
        name: string;
        screen_name: string;
        profile_image_url: string;
    };
    public_metrics?: {
        retweet_count: number;
        like_count: number;
        reply_count: number;
        quote_count: number;
    };
    media?: Array<{
        type: string;
        url: string;
        preview_image_url?: string;
    }>;
}

/**
 * Twitter monitoring response interface
 */
export interface TwitterMonitoringResponse {
    user: TwitterUser;
    tweets: TwitterTweet[];
    timestamp: string;
}

/**
 * Get Twitter user information by username
 * @param username Twitter username (without @)
 * @returns Promise<TwitterUser> User information
 */
export async function getTwitterUserByUsername(
    username: string
): Promise<TwitterUser> {
    try {
        const url = `https://${RAPIDAPI_HOST}/user?username=${username}`;

        console.log(`🔍 Fetching Twitter user: ${username}`);

        const response = await axios.get(url, {
            headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
            },
        });

        if (!response.data) {
            console.error("❌ No response data received");
            throw new Error(`No data received for user ${username}`);
        }

        if (!response.data.result) {
            console.error(
                "❌ No result field in response:",
                JSON.stringify(response.data, null, 2)
            );
            throw new Error(`Result field missing in response for ${username}`);
        }

        if (!response.data.result.data) {
            console.error(
                "❌ No data field in result:",
                JSON.stringify(response.data.result, null, 2)
            );
            throw new Error(`Data field missing in result for ${username}`);
        }

        if (!response.data.result.data.user) {
            console.error(
                "❌ No user field in data:",
                JSON.stringify(response.data.result.data, null, 2)
            );
            throw new Error(`User field missing in data for ${username}`);
        }

        if (!response.data.result.data.user.result) {
            console.error(
                "❌ No result field in user:",
                JSON.stringify(response.data.result.data.user, null, 2)
            );
            throw new Error(`User result field missing for ${username}`);
        }

        const userData = response.data.result.data.user.result;
        const legacy = userData.legacy;

        if (!legacy) {
            console.error(
                "❌ No legacy field in user data:",
                JSON.stringify(userData, null, 2)
            );
            throw new Error(`User legacy data missing for ${username}`);
        }

        console.log(`✅ Successfully parsed user data for ${username}`);

        return {
            id: userData.id,
            rest_id: userData.rest_id,
            name: legacy.name,
            screen_name: legacy.screen_name,
            description: legacy.description,
            followers_count: legacy.followers_count,
            friends_count: legacy.friends_count,
            verified: legacy.verified || userData.is_blue_verified || false,
            profile_image_url_https: legacy.profile_image_url_https,
        };
    } catch (error: any) {
        console.error("❌ Error fetching Twitter user:", error);

        if (error.response) {
            console.error(
                "🔴 HTTP Error Response:",
                error.response.status,
                error.response.statusText
            );
            console.error(
                "🔴 Error Response Data:",
                JSON.stringify(error.response.data, null, 2)
            );
        }

        throw new Error(`Failed to fetch user ${username}: ${error.message}`);
    }
}

/**
 * Get latest tweets for a user by their rest_id
 * @param userId Twitter user rest_id
 * @param count Number of tweets to fetch (default: 10)
 * @returns Promise<TwitterTweet[]> Array of tweets
 */
export async function getLatestTweetsByUserId(
    userId: string,
    count: number = 10
): Promise<TwitterTweet[]> {
    try {
        const url = `https://${RAPIDAPI_HOST}/user-tweets?user=${userId}&count=${count}`;

        const response = await axios.get(url, {
            headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
            },
        });

        if (!response.data) {
            throw new Error("No response data received");
        }

        if (!response.data.result) {
            throw new Error("No result field in response");
        }

        if (!response.data.result.timeline) {
            throw new Error("No timeline field in result");
        }

        const timeline = response.data.result.timeline;
        console.log(
            `📋 Timeline instructions count: ${
                timeline.instructions?.length || 0
            }`
        );

        const tweets: TwitterTweet[] = [];

        // Parse timeline instructions to extract tweets
        if (timeline.instructions) {
            for (const instruction of timeline.instructions) {
                if (
                    instruction.type === "TimelineAddEntries" &&
                    instruction.entries
                ) {
                    for (const entry of instruction.entries) {
                        if (
                            entry.content?.itemContent?.__typename ===
                            "TimelineTweet"
                        ) {
                            const tweetData =
                                entry.content.itemContent.tweet_results?.result;

                            // Handle both Tweet and TweetWithVisibilityResults
                            let actualTweetData = tweetData;
                            if (
                                tweetData?.__typename ===
                                "TweetWithVisibilityResults"
                            ) {
                                actualTweetData = tweetData.tweet;
                            }

                            // For TweetWithVisibilityResults, the inner tweet doesn't have __typename
                            // but it has the required fields like rest_id and legacy
                            if (
                                actualTweetData &&
                                (actualTweetData.__typename === "Tweet" ||
                                    actualTweetData.rest_id)
                            ) {
                                const tweet = parseTweetData(actualTweetData);
                                if (tweet) {
                                    tweets.push(tweet);
                                }
                            }
                        }
                    }
                } else if (
                    instruction.type === "TimelinePinEntry" &&
                    instruction.entry
                ) {
                    // Handle pinned tweets
                    const entry = instruction.entry;
                    if (
                        entry.content?.itemContent?.__typename ===
                        "TimelineTweet"
                    ) {
                        const tweetData =
                            entry.content.itemContent.tweet_results?.result;

                        // Handle both Tweet and TweetWithVisibilityResults
                        let actualTweetData = tweetData;
                        if (
                            tweetData?.__typename ===
                            "TweetWithVisibilityResults"
                        ) {
                            actualTweetData = tweetData.tweet;
                        }

                        // For TweetWithVisibilityResults, the inner tweet doesn't have __typename
                        // but it has the required fields like rest_id and legacy
                        if (
                            actualTweetData &&
                            (actualTweetData.__typename === "Tweet" ||
                                actualTweetData.rest_id)
                        ) {
                            const tweet = parseTweetData(actualTweetData);
                            if (tweet) {
                                tweets.push(tweet);
                            }
                        }
                    }
                }
            }
        }

        console.log(`📊 Total tweets parsed: ${tweets.length}`);

        return tweets.slice(0, count);
    } catch (error: any) {
        console.error("Error fetching tweets:", error);
        throw new Error(
            `Failed to fetch tweets for user ${userId}: ${error.message}`
        );
    }
}

/**
 * Parse tweet data from Twitter API response
 * @param tweetData Raw tweet data from API
 * @returns TwitterTweet | null
 */
function parseTweetData(tweetData: any): TwitterTweet | null {
    try {
        if (!tweetData.legacy) {
            return null;
        }

        const legacy = tweetData.legacy;
        const userResult = tweetData.core?.user_results?.result;

        if (!userResult || !userResult.legacy) {
            return null;
        }

        const userLegacy = userResult.legacy;

        // Extract media if present
        const media: Array<{
            type: string;
            url: string;
            preview_image_url?: string;
        }> = [];
        if (legacy.entities?.media) {
            for (const mediaItem of legacy.entities.media) {
                media.push({
                    type: mediaItem.type,
                    url: mediaItem.media_url_https || mediaItem.url,
                    preview_image_url: mediaItem.media_url_https,
                });
            }
        }

        return {
            id: tweetData.rest_id,
            text: legacy.full_text || legacy.text || "",
            created_at: legacy.created_at,
            author: {
                name: userLegacy.name,
                screen_name: userLegacy.screen_name,
                profile_image_url: userLegacy.profile_image_url_https,
            },
            public_metrics: {
                retweet_count: legacy.retweet_count || 0,
                like_count: legacy.favorite_count || 0,
                reply_count: legacy.reply_count || 0,
                quote_count: legacy.quote_count || 0,
            },
            media: media.length > 0 ? media : undefined,
        };
    } catch (error) {
        console.error("Error parsing tweet data:", error);
        return null;
    }
}

/**
 * Monitor Twitter user - get user info and latest tweets
 * @param username Twitter username (without @)
 * @param tweetCount Number of tweets to fetch (default: 10)
 * @returns Promise<TwitterMonitoringResponse> Complete monitoring response
 */
export async function monitorTwitterUser(
    username: string,
    tweetCount: number = 10
): Promise<TwitterMonitoringResponse> {
    try {
        // First, get user information
        const user = await getTwitterUserByUsername(username);

        let tweets: TwitterTweet[] = [];

        try {
            // Add a small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Then, get their latest tweets
            tweets = await getLatestTweetsByUserId(user.rest_id, tweetCount);
        } catch (tweetsError: any) {
            console.warn(
                `⚠️ Could not fetch tweets for ${username}:`,
                tweetsError.message
            );

            // If it's a rate limit error, still return the user data
            if (tweetsError.response?.status === 429) {
                console.warn(
                    "⚠️ Rate limit reached for tweets API. Returning user data only."
                );
            }
        }

        return {
            user,
            tweets,
            timestamp: new Date().toISOString(),
        };
    } catch (error: any) {
        console.error(`Error monitoring Twitter user ${username}:`, error);
        throw new Error(
            `Failed to monitor Twitter user ${username}: ${error.message}`
        );
    }
}
