// Token price service
import axios from "axios";

/**
 * Token price information interface
 */
export interface TokenPriceInfo {
    token: string;
    processId: string;
    price: string;
    currency?: string;
    timestamp: string;
}

/**
 * Token configuration mapping
 */
const TOKEN_CONFIG = {
    AO: {
        processId: "0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc",
        endpoint: "usd-price",
    },
    AR: {
        processId: "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10",
        endpoint: "usd-price",
    },
    ARIO: {
        processId: "qNvAoz0TgcH7DMg8BCVn8jF32QH5L6T29VjHxhHqqGE",
        endpoint: "hopper",
    },
    TRUNK: {
        processId: "wOrb8b_V8QixWyXZub48Ki5B6OIDyf_p1ngoonsaRpQ",
        endpoint: "hopper",
    },
    GAME: {
        processId: "s6jcB3ctSbiDNwR-paJgy5iOAhahXahLul8exSLHbGE",
        endpoint: "hopper",
    },
} as const;

/**
 * Base Supabase configuration
 */
const SUPABASE_CONFIG = {
    baseUrl: "https://kzmzniagsfcfnhgsjkpv.supabase.co/functions/v1",
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bXpuaWFnc2ZjZm5oZ3Nqa3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjI5NDEsImV4cCI6MjA2Mzk5ODk0MX0.IjB7j34CjhqUXQcO_dKM_9k3okmSomSpu9dtyPV2agU",
    headers: {
        accept: "*/*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "content-type": "application/json",
        dnt: "1",
        origin: "https://dexi.defi.ao",
        priority: "u=1, i",
        referer: "https://dexi.defi.ao/",
        "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        "x-client-info": "supabase-js-web/2.50.0",
    },
};

/**
 * Fetch price using USD-Price endpoint (for AO and AR tokens)
 */
async function fetchUsdPrice(processId: string): Promise<any> {
    const url = `${SUPABASE_CONFIG.baseUrl}/usd-price`;

    const response = await axios.post(
        url,
        { processId },
        {
            headers: {
                ...SUPABASE_CONFIG.headers,
                apikey: SUPABASE_CONFIG.apiKey,
                authorization: `Bearer ${SUPABASE_CONFIG.apiKey}`,
            },
        }
    );

    return response.data;
}

/**
 * Fetch price using Hopper endpoint (for ARIO and TRUNK tokens)
 */
async function fetchHopperPrice(baseToken: string): Promise<any> {
    const url = `${SUPABASE_CONFIG.baseUrl}/hopper`;

    const response = await axios.post(
        url,
        {
            baseToken,
            quoteToken: "USD",
            priceOnly: true,
        },
        {
            headers: {
                ...SUPABASE_CONFIG.headers,
                apikey: SUPABASE_CONFIG.apiKey,
                authorization: `Bearer ${SUPABASE_CONFIG.apiKey}`,
            },
        }
    );

    return response.data;
}

/**
 * Get token price by token symbol
 * @param tokenSymbol Token symbol (AO, AR, ARIO, TRUNK, GAME)
 * @returns Promise<TokenPriceInfo> Price information for the specified token
 */
export async function getTokenPrice(
    tokenSymbol: string
): Promise<TokenPriceInfo> {
    const upperSymbol = tokenSymbol.toUpperCase() as keyof typeof TOKEN_CONFIG;

    if (!TOKEN_CONFIG[upperSymbol]) {
        throw new Error(
            `Unsupported token: ${tokenSymbol}. Supported tokens: ${Object.keys(
                TOKEN_CONFIG
            ).join(", ")}`
        );
    }

    const config = TOKEN_CONFIG[upperSymbol];

    try {
        let responseData: any;

        if (config.endpoint === "usd-price") {
            responseData = await fetchUsdPrice(config.processId);

            return {
                token: upperSymbol,
                processId: responseData.processId || config.processId,
                price: responseData.price,
                currency: "USD",
                timestamp: new Date().toISOString(),
            };
        } else {
            responseData = await fetchHopperPrice(config.processId);

            return {
                token: upperSymbol,
                processId:
                    responseData["Base-Token-Process"] || config.processId,
                price: responseData.Price,
                currency: responseData["Quote-Token-Process"] || "USD",
                timestamp: new Date().toISOString(),
            };
        }
    } catch (error: any) {
        console.error(`Error fetching ${upperSymbol} price:`, error);
        throw new Error(
            `Failed to fetch ${upperSymbol} price: ${error.message}`
        );
    }
}

/**
 * Get supported tokens list
 * @returns Array of supported token symbols
 */
export function getSupportedTokens(): string[] {
    return Object.keys(TOKEN_CONFIG);
}
