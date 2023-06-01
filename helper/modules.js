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

function restart(space, file){
    return new Promise((resolve) => {
        const Space = space.charAt(0).toUpperCase() + space.slice(1)
        list[space] = fork(file)
        logger.green(`Starting ${Space}`).send()
    
        list[space].on("spawn", resolve)
    
        list[space].on("close", async () => {
            logger.red(`Stopping ${Space}`).send()
            delete list[space]
            await restart(space, file)
        })
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