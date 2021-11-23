import { writable } from 'svelte/store';


//export let g_commander = writable(false)

class RedoList {

    constructor() {
        //this.commander = g_commander
        this.list = []
    }

    push(z_list) {
        this.list.push(z_list)
    }

    size() {
        return this.list.length
    }

    get(jth) {
        if ( jth < 0 ) return false
        if ( jth > this.list.length ) return false
        return this.list[jth]
    }

    /*
    command(action,parameters) {
        this.commander.update( cmd => {
            let command = {
                "command" : action,
                "pars" : parameters
            }
            return command
        })
    }
    */

}

export let redo_list = new RedoList()
