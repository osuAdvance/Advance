import Logger from "cutesy.js"
import modules from "./helper/modules.js";

(async () => {
    const logger = new Logger().addTimestamp("hh:mm:ss").purple()

    logger.send("Starting API")

    await modules.restart("api", "./modules/api.js")
    await modules.restart("fetch", "./modules/cron.js")
})();