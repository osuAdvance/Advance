import Logger from "cutesy.js"
import cron from "./modules/cron.js";
import api from "./modules/api.js"

(async () => {
    const logger = new Logger().addTimestamp("hh:mm:ss").purple()

    logger.send("Starting Cron")

    cron()

    logger.send("Starting API")

    api()
})();