import database from "../database.js"
export default function (user, id) {
    return new Promise(async (resolve) => {
        const check = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ?`, [ id ]))[0]

        if(!check) return resolve({ error: "User does not exist" })

        if(check.username != user.username || check.country != user.country_code){
            database.awaitQuery(`UPDATE users SET username = ?, username_safe = ?, country = ?
            WHERE userid = ?`, [
                user.username,
                user.username.toLowerCase().replaceAll(" ", "_"),
                user.country_code,
                id
            ])
        }
        return resolve()
    })
}