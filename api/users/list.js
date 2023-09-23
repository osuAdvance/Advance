import database from "../../helper/database.js";

export default async function(req, reply){
    return await database.awaitQuery(`SELECT username FROM users WHERE available = 1`)
}