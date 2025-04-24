// Token price service
import { spawn } from "child_process";
import path from "path";
import axios from "axios";

/**
 * Token price information interface
 */
export interface TokenPriceInfo {
    token: string;
    id: string;
    price: string;
    currency: string;
    timestamp: string;
    method?: string;
}

/**
 * Get Arweave token price using the Get-Oracle-Price action
 * @returns Promise<TokenPriceInfo> Price information for Arweave token
 */
export async function getArweaveTokenPrice(): Promise<TokenPriceInfo> {
    return new Promise((resolve, reject) => {
        try {
            // Path to the script in the @randao-test directory
            const scriptPath = path.resolve(
                process.cwd(),
                "../@randao-test/arweave-price.js"
            );

            console.log(`Running script: ${scriptPath}`);

            // Spawn a Node.js process to run the script
            const childProcess = spawn("node", [scriptPath]);

            let stdout = "";
            let stderr = "";

            // Collect stdout data
            childProcess.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            // Collect stderr data
            childProcess.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            childProcess.on("close", (code) => {
                if (code === 0) {
                    try {
                        // Try to find the JSON output in the stdout
                        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const priceInfo = JSON.parse(jsonMatch[0]);
                            console.log("Price info:", priceInfo);
                            resolve(priceInfo);
                        } else {
                            // If no JSON found, try to extract the price from the output
                            const priceMatch = stdout.match(
                                /WRAPPED_ARWEAVE price: \$(\d+\.\d+) USD/
                            );
                            if (priceMatch) {
                                const price = priceMatch[1];
                                const priceInfo: TokenPriceInfo = {
                                    token: "WRAPPED_ARWEAVE",
                                    id: "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10",
                                    price: price,
                                    currency: "USD",
                                    timestamp: new Date().toISOString(),
                                };
                                console.log("Extracted price info:", priceInfo);
                                resolve(priceInfo);
                            } else {
                                reject(
                                    new Error(
                                        "Could not extract price information from script output"
                                    )
                                );
                            }
                        }
                    } catch (error) {
                        console.error("Error parsing script output:", error);
                        reject(error);
                    }
                } else {
                    console.error(`Script exited with code ${code}`);
                    console.error("Stderr:", stderr);
                    reject(
                        new Error(`Script exited with code ${code}: ${stderr}`)
                    );
                }
            });

            // Handle process errors
            childProcess.on("error", (error) => {
                console.error("Error running script:", error);
                reject(error);
            });
        } catch (error) {
            console.error("Error in getArweaveTokenPrice:", error);
            reject(error);
        }
    });
}

/**
 * Get updated token price using the Get-Price-For-Token action
 * @returns Promise<TokenPriceInfo> Price information for Arweave token
 */
export async function getUpdatedTokenPrice(): Promise<TokenPriceInfo> {
    return new Promise((resolve, reject) => {
        try {
            // Path to the script in the @randao-test directory
            const scriptPath = path.resolve(
                process.cwd(),
                "../@randao-test/final-arweave-price.js"
            );

            console.log(`Running script: ${scriptPath}`);

            // Spawn a Node.js process to run the script
            const childProcess = spawn("node", [scriptPath]);

            let stdout = "";
            let stderr = "";

            // Collect stdout data
            childProcess.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            // Collect stderr data
            childProcess.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            childProcess.on("close", (code) => {
                if (code === 0) {
                    try {
                        // Try to find the JSON output in the stdout
                        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const priceInfo = JSON.parse(jsonMatch[0]);
                            console.log("Price info:", priceInfo);
                            resolve(priceInfo);
                        } else {
                            // If no JSON found, try to extract the price from the output
                            const priceMatch = stdout.match(
                                /WRAPPED_ARWEAVE price: \$(\d+\.\d+) USD/
                            );
                            if (priceMatch) {
                                const price = priceMatch[1];
                                const priceInfo: TokenPriceInfo = {
                                    token: "WRAPPED_ARWEAVE",
                                    id: "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10",
                                    price: price,
                                    currency: "USD",
                                    timestamp: new Date().toISOString(),
                                };
                                console.log("Extracted price info:", priceInfo);
                                resolve(priceInfo);
                            } else {
                                reject(
                                    new Error(
                                        "Could not extract price information from script output"
                                    )
                                );
                            }
                        }
                    } catch (error) {
                        console.error("Error parsing script output:", error);
                        reject(error);
                    }
                } else {
                    console.error(`Script exited with code ${code}`);
                    console.error("Stderr:", stderr);
                    reject(
                        new Error(`Script exited with code ${code}: ${stderr}`)
                    );
                }
            });

            // Handle process errors
            childProcess.on("error", (error) => {
                console.error("Error running script:", error);
                reject(error);
            });
        } catch (error) {
            console.error("Error in getUpdatedTokenPrice:", error);
            reject(error);
        }
    });
}

/**
 * Get AO token price using the Get-Stats action
 * @returns Promise<TokenPriceInfo> Price information for AO token
 */
export async function getAOTokenPrice(): Promise<TokenPriceInfo> {
    return new Promise((resolve, reject) => {
        try {
            // Path to the script in the @randao-test directory
            const scriptPath = path.resolve(
                process.cwd(),
                "../@randao-test/ao-token-price.js"
            );

            console.log(`Running script: ${scriptPath}`);

            // Spawn a Node.js process to run the script
            const childProcess = spawn("node", [scriptPath]);

            let stdout = "";
            let stderr = "";

            // Collect stdout data
            childProcess.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            // Collect stderr data
            childProcess.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            childProcess.on("close", (code) => {
                if (code === 0) {
                    try {
                        // Try to find the JSON output in the stdout
                        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const priceInfo = JSON.parse(jsonMatch[0]);
                            console.log("Price info:", priceInfo);
                            resolve(priceInfo);
                        } else {
                            // If no JSON found, try to extract the price from the output
                            const priceMatch = stdout.match(
                                /AO token price: \$(\d+\.\d+) USD/
                            );
                            if (priceMatch) {
                                const price = priceMatch[1];
                                const priceInfo: TokenPriceInfo = {
                                    token: "AO",
                                    id: "0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc",
                                    price: price,
                                    currency: "USD",
                                    timestamp: new Date().toISOString(),
                                };
                                console.log("Extracted price info:", priceInfo);
                                resolve(priceInfo);
                            } else {
                                reject(
                                    new Error(
                                        "Could not extract price information from script output"
                                    )
                                );
                            }
                        }
                    } catch (error) {
                        console.error("Error parsing script output:", error);
                        reject(error);
                    }
                } else {
                    console.error(`Script exited with code ${code}`);
                    console.error("Stderr:", stderr);
                    reject(
                        new Error(`Script exited with code ${code}: ${stderr}`)
                    );
                }
            });

            // Handle process errors
            childProcess.on("error", (error) => {
                console.error("Error running script:", error);
                reject(error);
            });
        } catch (error) {
            console.error("Error in getAOTokenPrice:", error);
            reject(error);
        }
    });
}
