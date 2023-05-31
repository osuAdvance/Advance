import Logger from "cutesy.js"
import modules from "./helper/modules.js";

(async () => {
    const logger = new Logger().addTimestamp("hh:mm:ss").purple()

    logger.send("Starting API")

    await modules.start("api", "./modules/api.js")
    await modules.start("fetch", "./modules/fetch.js")
})();