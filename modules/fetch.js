import database from "../helper/database.js";
import { getUser } from "../helper/fetch.js";
import Logger from "cutesy.js"
import { sleep } from "../helper/system.js";

(async () => {
    const logger = new Logger().addTimestamp("hh:mm:ss").changeTag("Fetch").purple()
    function update(){
        return new Promise(async (resolve) => {
            const users = await database.awaitQuery(`SELECT userid FROM users WHERE available = 1`)

            logger.send(`Updating ${users.length} Users`)

            const payload = []

            for(let i = 0; i < users.length; i++){
                payload.push(users[i].userid)
                if(payload.length == 50 || i == users.length - 1){
                    logger.send(`Payloads left: ${Math.floor((users.length - i) / 50 + 1)}/${Math.floor(users.length / 50) + 1}`)
                    await getUser(payload)
                    await sleep(5000)
                    payload.length = 0;
                }
            }

            logger.send("Finished update.")

            return resolve()
        })
    }

    await update()

    setInterval(async () => {
        await update()
    }, 1000 * 60 * 60) //! Increase Time if necessary
})();