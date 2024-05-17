import card from "./card.js"
import migrate from "./migrate.js"
import profile from "./profile.js"
import ranks from "./ranks.js"
import scores from "./scores.js"
import wrapped from "./wrapped.js"
export default async function(fastify, opts){
    fastify.get("/migrate", migrate)
    fastify.get("/", profile)
    fastify.get("/scores/:type", scores)
    fastify.get("/ranks", ranks)
    fastify.get("/card", card)
    fastify.get("/wrapped", wrapped)
}