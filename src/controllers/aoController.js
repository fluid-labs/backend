// AO Controller
// Handles interactions with the AO platform

const aoService = require("../services/aoService");

// Connect to the AO platform
const connectToAO = async (req, res) => {
    try {
        const { processId, emailBotId } = req.body;

        if (!processId) {
            return res.status(400).json({ error: "Process ID is required" });
        }

        // Connect to AO using the service
        const result = await aoService.connectToAO(processId, emailBotId);

        if (!result.success) {
            return res
                .status(500)
                .json({ error: "Failed to connect to AO platform" });
        }

        return res.status(200).json({
            success: true,
            message: "Connected to AO platform",
            processId: result.processId,
            emailBotId: result.emailBotId,
        });
    } catch (error) {
        console.error("Error connecting to AO:", error);
        return res
            .status(500)
            .json({ error: "Failed to connect to AO platform" });
    }
};

// Disconnect from the AO platform
const disconnectFromAO = async (req, res) => {
    try {
        // Reset the process IDs
        processBuilderID = null;
        emailBotID = null;

        console.log("Disconnected from AO platform");

        return res.status(200).json({
            success: true,
            message: "Disconnected from AO platform",
        });
    } catch (error) {
        console.error("Error disconnecting from AO:", error);
        return res
            .status(500)
            .json({ error: "Failed to disconnect from AO platform" });
    }
};

// Get the status of the AO platform
const getStatus = async (req, res) => {
    try {
        if (!processBuilderID) {
            return res
                .status(400)
                .json({ error: "Not connected to AO platform" });
        }

        // In a real implementation, this would query the AO platform for status
        const status = {
            connected: !!processBuilderID,
            processId: processBuilderID,
            emailBotId: emailBotID,
        };

        return res.status(200).json(status);
    } catch (error) {
        console.error("Error getting AO status:", error);
        return res.status(500).json({ error: "Failed to get AO status" });
    }
};

// Get available targets
const getTargets = async (req, res) => {
    try {
        if (!processBuilderID) {
            return res
                .status(400)
                .json({ error: "Not connected to AO platform" });
        }

        // In a real implementation, this would query the AO platform for targets
        const targets = [
            {
                id: emailBotID,
                name: "Email Bot",
                description: "Sends emails and notifications",
                icon: "bi-envelope",
            },
            {
                id: processBuilderID,
                name: "Process Builder",
                description: "Creates and manages automations",
                icon: "bi-gear",
            },
        ];

        return res.status(200).json(targets);
    } catch (error) {
        console.error("Error getting targets:", error);
        return res.status(500).json({ error: "Failed to get targets" });
    }
};

// Send a message to an AO process
const sendMessage = async (req, res) => {
    try {
        const { target, action, data, tags } = req.body;

        if (!target) {
            return res.status(400).json({ error: "Target is required" });
        }

        if (!action) {
            return res.status(400).json({ error: "Action is required" });
        }

        console.log(`Sending message to ${target} on AO network:`);
        console.log(`  Action: ${action}`);
        console.log(`  Data: ${data || "none"}`);
        console.log(`  Tags: ${JSON.stringify(tags || {})}`);

        try {
            // Send the message to the AO network
            const result = await aoService.sendMessage(
                target,
                action,
                data || ""
            );

            console.log(`Message sent to AO network successfully`);
            console.log(`AO response:`, result);

            const response = {
                success: true,
                message: "Message sent to AO network",
                target,
                action,
                result,
                timestamp: new Date().toISOString(),
            };

            return res.status(200).json(response);
        } catch (aoError) {
            console.error("Error sending message to AO:", aoError);

            return res.status(500).json({
                success: false,
                message: "Failed to send message to AO network",
                target,
                action,
                error: aoError.message,
            });
        }
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ error: "Failed to send message" });
    }
};

// Get messages from an AO process
const getMessages = async (req, res) => {
    try {
        const { processId } = req.params;

        if (!processId) {
            return res.status(400).json({ error: "Process ID is required" });
        }

        // In a real implementation, this would query the AO platform for messages
        const messages = [
            {
                from: "system",
                action: "ProcessStarted",
                data: "Process started successfully",
                timestamp: new Date().toISOString(),
            },
        ];

        return res.status(200).json(messages);
    } catch (error) {
        console.error("Error getting messages:", error);
        return res.status(500).json({ error: "Failed to get messages" });
    }
};

// Export the process IDs for use in other controllers
const getProcessId = () => processBuilderID;
const getEmailBotId = () => emailBotID;

module.exports = {
    connectToAO,
    disconnectFromAO,
    getStatus,
    getTargets,
    sendMessage,
    getMessages,
    getProcessId,
    getEmailBotId,
};
