import app from "./app";

import serveConfig from "./config/config";

app.listen(serveConfig.Port, () => {
    console.log(`Server is running on port http://localhost:${serveConfig.Port}/`);
});
