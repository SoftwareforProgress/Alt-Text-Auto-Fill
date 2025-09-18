const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        content: "./src/content.js",
        background: "./src/background.js",
        popup: "./src/popup.js",
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "src/manifest.json", to: "manifest.json" },
                { from: "src/popup.html", to: "popup.html" },
                { from: "src/styles.css", to: "styles.css" },
                { from: "src/icons", to: ".", noErrorOnMissing: true },
            ],
        }),
    ],
    resolve: {
        extensions: [".js"],
        fallback: {
            fs: false,
            path: false,
            crypto: false,
        },
    },
    performance: {
        maxAssetSize: 50000000, // 50MB (TensorFlow is large)
        maxEntrypointSize: 50000000,
        hints: "warning",
    },
};
