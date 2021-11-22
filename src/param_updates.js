import { writable } from 'svelte/store';


export let g_select_parameters = writable(false)

class ParamSink {

    constructor() {
        this.parameter_changes = g_select_parameters
    }

    command(action,parameters) {
        this.parameter_changes.update( cmd => {
            let command = {
                "command" : action,
                "pars" : parameters
            }
            return command
        })
    }

}

export let parameter_publisher = new ParamSink()
