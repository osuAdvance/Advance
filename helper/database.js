import mysql from "mysql-await"
import { database as db } from "../config.js"

export default mysql.createPool({
    host: db.host,
    user: db.user,
    password: db.password,
    database: db.database
})