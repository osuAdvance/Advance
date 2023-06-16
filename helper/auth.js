import fetch from "node-fetch"
import { clientID, clientSecret, redirect } from "../config.js"
import database from "./database.js";
import { getTime } from "./system.js";

export async function GET(url, id, token){
    let key = token;
    if(!key){
        const time = getTime()
        const search = await database.awaitQuery(`SELECT * FROM tokens WHERE user = ${id}`)
        if(time > search[0].expires){
            const t = await refresh(search[0].refresh)
            if(t.error == "invalid_request") return { authentication : "basic" }
            await database.awaitQuery(`
            UPDATE tokens SET access = "${t.access_token}",
            refresh = "${t.refresh_token}",
            expires = ${time + t.expires_in}
            WHERE user = ${id}`)
            key = t.access_token
        } else {
            key = search[0].access
        }
    }

    const request = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${key}`
        }
    })
    return await request.json()
}

async function auth(headers, body){
    const request = await fetch("https://osu.ppy.sh/oauth/token", {
        method: "POST",
        headers,
        body
    })

    return await request.json()
}

export async function authenticate(code){
    return await auth({
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
    },
    new URLSearchParams({
        client_id: clientID,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirect
    }))
}

async function refresh(token){
    return await auth({
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    JSON.stringify({
        client_id: clientID,
        client_secret: clientSecret,
        refresh_token: token,
        grant_type: "refresh_token",
    }))
}