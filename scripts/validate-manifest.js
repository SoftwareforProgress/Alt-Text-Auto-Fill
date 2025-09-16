#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const manifestPath = path.join(__dirname, "..", "src", "manifest.json");

console.log("🔍 Validating manifest.json...");
console.log("━".repeat(40));

try {
    // Read and parse manifest
    const manifestContent = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(manifestContent);

    // Required fields for Manifest V3
    const requiredFields = [
        "manifest_version",
        "name",
        "version",
        "description",
    ];

    const errors = [];

    // Check required fields
    requiredFields.forEach((field) => {
        if (!manifest[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    // Validate manifest version
    if (manifest.manifest_version !== 3) {
        errors.push("manifest_version must be 3");
    }

    // Validate version format
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        errors.push("Version must be in format X.Y.Z");
    }

    // Check description length (max 132 characters for Chrome Web Store)
    if (manifest.description && manifest.description.length > 132) {
        errors.push(
            `Description too long: ${manifest.description.length}/132 characters`
        );
    }

    // Report results
    if (errors.length > 0) {
        console.error("❌ Validation failed:");
        errors.forEach((error) => console.error(`   - ${error}`));
        process.exit(1);
    } else {
        console.log("✅ manifest.json is valid");
        console.log(`   Name: ${manifest.name}`);
        console.log(`   Version: ${manifest.version}`);
        console.log(
            `   Description: ${manifest.description.substring(0, 50)}...`
        );
    }
} catch (error) {
    console.error("❌ Failed to validate manifest:", error.message);
    process.exit(1);
}

console.log("━".repeat(40));
