import { getUsername } from "../helper/fetch.js";

export default async function (req, reply) {
        const username = req.params?.username
        if(!username) return reply.send({ error: "Invalid Username" })
        const result = await getUsername(username)
        
        reply.send(result)
}