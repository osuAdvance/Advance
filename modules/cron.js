import { fetchRate } from "../config.js";
import database from "../helper/database.js";
import { getUser, fillCache } from "./fetch.js";
import Logger from "cutesy.js"
import { trackerWebhook } from "../config.js";
import { WebhookClient, EmbedBuilder } from 'discord.js'
const webhookClient = new WebhookClient({ url: trackerWebhook })
const logger = new Logger().addTimestamp("hh:mm:ss").changeTag("Fetch").purple()

const stats = await database.awaitQuery(`SELECT user, playcount, time, mode FROM (SELECT user, playcount, time, mode, ROW_NUMBER() OVER (PARTITION BY user, mode ORDER BY time DESC) AS rn FROM stats_2024 s JOIN users u ON s.user = u.userid WHERE u.available = 1) AS ranked WHERE rn = 1`)
fillCache(stats);

function update(){
    return new Promise(async (resolve) => {
        const users = await database.awaitQuery(`SELECT userid id, username FROM users WHERE available = 1`)
        logger.send(`Updating ${users.length} Users`)
        for(let i = 0; i < users.length; i += 50){
            const chunk = users.slice(i, i + 50);
            logger.send(`Updating Batch ${(Math.floor(i / 50) + 1)}/${Math.floor(users.length / 50) + 1}`)
            await getUser(chunk)
        }
        const embed = new EmbedBuilder().setTitle("Update finished!").setColor(0x0000FF).setTimestamp(Date.now()).setFooter({ text: `Users tracked: ${users.length}` })
        webhookClient.send({
            embeds: [embed],
        })
        logger.send("Finished update.")
        return resolve()
    })
}
await update()
setInterval(async () => {
    await update()
}, 1000 * 60 * fetchRate) //! Increase Time if necessary