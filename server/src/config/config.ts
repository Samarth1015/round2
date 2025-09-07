import dotenv from "dotenv";

dotenv.config();

interface config {
    Port: number;
    nodeEnv: string;

}

const serveConfig: config = {
    Port: Number(process.env.PORT) || 8080,
    nodeEnv: String(process.env.NODE_ENV) || "development"
}

export default serveConfig;