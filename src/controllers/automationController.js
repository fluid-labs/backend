// Automation Controller
// Handles automation-related operations

const aoService = require("../services/aoService");

// Store automations
const automations = {};

// Get process IDs from aoService
let processBuilderID = null;

// Create a new automation
const createAutomation = async (req, res) => {
    try {
        processBuilderID = aoService.getProcessId();

        if (!processBuilderID) {
            return res
                .status(400)
                .json({ error: "Not connected to AO platform" });
        }

        const { When, Then, Target, Name, Description } = req.body;

        if (!When || !Then || !Target) {
            return res
                .status(400)
                .json({ error: "When, Then, and Target are required" });
        }

        // Generate a unique ID for the automation
        const automationId = `auto-${Date.now()}-${Math.floor(
            Math.random() * 1000
        )}`;

        // Store the automation
        automations[automationId] = {
            id: automationId,
            name: Name || "Unnamed Automation",
            description: Description || "",
            when: When,
            then: Then,
            target: Target,
            createdAt: new Date().toISOString(),
        };

        // Send a message to the ProcessBuilder to create the automation
        const config = {
            When,
            Then,
            Target,
            Name: Name || "Unnamed Automation",
            Description: Description || "",
        };

        try {
            // Send the message to the AO network
            const result = await aoService.sendMessage(
                processBuilderID,
                "CreateAutomation",
                JSON.stringify(config)
            );

            console.log(`Created automation on AO network: ${automationId}`);
            console.log(`AO response:`, result);

            return res.status(201).json({
                success: true,
                message: "Automation created successfully",
                id: automationId,
                config,
            });
        } catch (aoError) {
            console.error("Error sending message to AO:", aoError);

            // Even if AO communication fails, we still return success since we stored the automation locally
            return res.status(201).json({
                success: true,
                message:
                    "Automation created locally but AO communication failed",
                id: automationId,
                config,
                aoError: aoError.message,
            });
        }
    } catch (error) {
        console.error("Error creating automation:", error);
        return res.status(500).json({ error: "Failed to create automation" });
    }
};

// Get all automations
const getAutomations = async (req, res) => {
    try {
        processBuilderID = getProcessId();

        if (!processBuilderID) {
            return res
                .status(400)
                .json({ error: "Not connected to AO platform" });
        }

        // Convert automations object to array
        const automationsList = Object.values(automations);

        return res.status(200).json(automationsList);
    } catch (error) {
        console.error("Error getting automations:", error);
        return res.status(500).json({ error: "Failed to get automations" });
    }
};

// Get a specific automation
const getAutomation = async (req, res) => {
    try {
        processBuilderID = getProcessId();

        if (!processBuilderID) {
            return res
                .status(400)
                .json({ error: "Not connected to AO platform" });
        }

        const { id } = req.params;

        if (!automations[id]) {
            return res.status(404).json({ error: "Automation not found" });
        }

        return res.status(200).json(automations[id]);
    } catch (error) {
        console.error("Error getting automation:", error);
        return res.status(500).json({ error: "Failed to get automation" });
    }
};

// Update an automation
const updateAutomation = async (req, res) => {
    try {
        processBuilderID = getProcessId();

        if (!processBuilderID) {
            return res
                .status(400)
                .json({ error: "Not connected to AO platform" });
        }

        const { id } = req.params;

        if (!automations[id]) {
            return res.status(404).json({ error: "Automation not found" });
        }

        const { When, Then, Target, Name, Description } = req.body;

        // Update the automation
        automations[id] = {
            ...automations[id],
            name: Name || automations[id].name,
            description: Description || automations[id].description,
            when: When || automations[id].when,
            then: Then || automations[id].then,
            target: Target || automations[id].target,
            updatedAt: new Date().toISOString(),
        };

        console.log(`Updated automation: ${id}`);

        return res.status(200).json(automations[id]);
    } catch (error) {
        console.error("Error updating automation:", error);
        return res.status(500).json({ error: "Failed to update automation" });
    }
};

// Delete an automation
const deleteAutomation = async (req, res) => {
    try {
        processBuilderID = getProcessId();

        if (!processBuilderID) {
            return res
                .status(400)
                .json({ error: "Not connected to AO platform" });
        }

        const { id } = req.params;

        if (!automations[id]) {
            return res.status(404).json({ error: "Automation not found" });
        }

        // Store the automation for the response
        const deletedAutomation = automations[id];

        // Delete the automation
        delete automations[id];

        console.log(`Deleted automation: ${id}`);

        return res.status(200).json(deletedAutomation);
    } catch (error) {
        console.error("Error deleting automation:", error);
        return res.status(500).json({ error: "Failed to delete automation" });
    }
};

// Trigger an automation
const triggerAutomation = async (req, res) => {
    try {
        processBuilderID = aoService.getProcessId();

        if (!processBuilderID) {
            return res
                .status(400)
                .json({ error: "Not connected to AO platform" });
        }

        const { id } = req.params;

        if (!automations[id]) {
            return res.status(404).json({ error: "Automation not found" });
        }

        const { action, data } = req.body;

        if (!action) {
            return res.status(400).json({ error: "Action is required" });
        }

        // Check if the action matches the automation's trigger
        if (action !== automations[id].when) {
            return res.status(400).json({
                error: `Action does not match automation trigger. Expected: ${automations[id].when}, Got: ${action}`,
            });
        }

        console.log(`Triggering automation on AO network: ${id}`);
        console.log(`  Action: ${action}`);
        console.log(`  Data: ${data || "none"}`);

        try {
            // Send the message to the AO network
            const result = await aoService.sendMessage(
                id, // Send directly to the automation process
                action,
                data || ""
            );

            console.log(`Automation triggered on AO network: ${id}`);
            console.log(`AO response:`, result);

            const response = {
                success: true,
                message: "Automation triggered successfully",
                id,
                action,
                result,
            };

            return res.status(200).json(response);
        } catch (aoError) {
            console.error("Error sending message to AO:", aoError);

            return res.status(500).json({
                success: false,
                message: "Failed to trigger automation on AO network",
                id,
                action,
                error: aoError.message,
            });
        }
    } catch (error) {
        console.error("Error triggering automation:", error);
        return res.status(500).json({ error: "Failed to trigger automation" });
    }
};

module.exports = {
    createAutomation,
    getAutomations,
    getAutomation,
    updateAutomation,
    deleteAutomation,
    triggerAutomation,
};
