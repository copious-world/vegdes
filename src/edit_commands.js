import { writable } from 'svelte/store';


export let g_commander = writable(false)

class Editor {

    constructor() {
        this.commander = g_commander
    }

    command(action,parameters) {
        this.commander.update( cmd => {
            let command = {
                "command" : action,
                "pars" : parameters
            }
            return command
        })
    }

}

export let commander = new Editor()
