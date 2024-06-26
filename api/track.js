import auth from "../helper/auth.js"
import database from "../helper/database.js"
import { getSafename } from "../helper/system.js"
import { getUser } from "../modules/fetch.js"
import { trackerWebhook } from "../config.js";
import { WebhookClient, EmbedBuilder } from 'discord.js'
const webhookClient = new WebhookClient({ url: trackerWebhook })
import Logger from "cutesy.js"
const log = new Logger().changeTag("Tracker").green()

export default async function(req, reply){
    if(req.query?.error) return reply.send({ error: "Access denied, please authorize our Application."})
    if(!req.query?.code || !req.query?.state) return reply.send({ error: "Invalid Payload"})
    const token = await auth.authenticate(req.query.code)
    if(token.error == "invalid_request") return reply.send({ error: "Access denied, please authorize our Application."}) 
    
    const user = await auth.request("/me", token.access_token)
    const time = Math.floor(new Date().getTime() / 1000)

    const check = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ${user.id}`))[0]
    const usersTracked = (await database.awaitQuery(`SELECT COUNT(*) count FROM users WHERE available = 1`))[0].count + 1
    if(check){
        await database.awaitQuery(`UPDATE users SET available = 1, discord = "${req.query.state}" WHERE userid = ${user.id}`)
        check.available = 1
        delete check.discord
        await getUser([{ id: user.id, username: user.username }], req.query.state)
        return reply.send({ message: "Updated User", user: check })
    }

    if(user.is_restricted) return reply.send({ error: "We do not support tracking for restricted players. You can track the moment you get unrestricted."})
    await getUser([{ id: user.id, username: user.username }], req.query.state)
    const embed = new EmbedBuilder().setTitle(`${user.username} (${user.id}) is now tracked!`).setColor(0x86DC3D).setThumbnail(`https://a.ppy.sh/${user.id}`).setTimestamp(Date.now()).setFooter({ text: `Users tracked: ${usersTracked}` })
    webhookClient.send({
        embeds: [embed],
    })
    log.send(`${user.username} (${user.id}) - Added user to system - Users tracked: ${usersTracked}`)
    return reply.send({ message: "Added user to system", user: {
        userid: user.id,
        username: user.username,
        username_safe: getSafename(user.username),
        added: time
    }})
}