"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const serveConfig = {
    Port: Number(process.env.PORT) || 8080,
    nodeEnv: String(process.env.NODE_ENV) || "development"
};
exports.default = serveConfig;
