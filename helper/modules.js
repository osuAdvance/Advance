import { fork } from "child_process"
import Logger from "cutesy.js"
const logger = new Logger().addTimestamp("hh:mm:ss").changeTag("Modules")

const list = {

}

function start(space, file){
    return new Promise((resolve) => {
        const Space = space.charAt(0).toUpperCase() + space.slice(1)
        list[space] = fork(file)
        logger.green(`Starting ${Space}`).send()
    
        list[space].on("spawn", resolve)
    
        list[space].on("close", () => {
            logger.red(`Stopping ${Space}`).send()
            delete list[space]
        })
    })
}

async function restart(space, file){
    list[space] = fork(file)

    list[space].on('message', (msg) => {
        console.log(msg);
    });

    list[space].on("close", () => {
        restart(space, list[space].spawnargs[1])
    })
}

async function redirect(){

}

export default {
    list,
    start,
    restart,
    redirect
}