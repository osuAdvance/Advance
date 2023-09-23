import { fetchRate } from "../config.js";
import database from "../helper/database.js";
import { getUser } from "./fetch.js";
import Logger from "cutesy.js"

(async () => {
    const logger = new Logger().addTimestamp("hh:mm:ss").changeTag("Fetch").purple()
    function update(){
        return new Promise(async (resolve) => {
            const users = await database.awaitQuery(`SELECT userid, username FROM users WHERE available = 1`)

            logger.send(`Updating ${users.length} Users`)

            for(let i = 0; i < users.length; i++){
                logger.send(`Updating ${users[i].username}`)
                await getUser(users[i].userid)
            }

            logger.send("Finished update.")

            return resolve()
        })
    }

    await update()

    setInterval(async () => {
        await update()
    }, 1000 * 60 * fetchRate) //! Increase Time if necessary
})();