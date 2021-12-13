class RedoList {

    constructor() {
        //this.commander = g_commander
        this.list = []
        this.pointer = -1
        this.rest = []
    }

    push(z_list) {
        this.list.push(z_list)
        this.pointer = this.list.length - 1
        this.rest = []
    }

    size() {
        return (this.list.length + this.rest.length)
    }

    get(jth) {
        if ( jth < 0 ) return false
        if ( jth > this.list.length ) return false
        return this.list[jth]
    }

    offset_pointer(i) {
        if ( i < 0 ) {
            if (  this.pointer >= 0 ) {
                let old = this.list.pop()
                this.rest.push(old)
                this.pointer = this.list.length - 1    
            }
        } else if ( i > 0 ) {
            if ( this.rest.length > 0 ) {
                let restore = this.rest.pop()
                this.list.push(restore)
                this.pointer = this.list.length - 1
            }
        }
        if ( this.pointer >= 0 ) {
            let current = this.list[this.pointer]
            return current    
        }
        return []
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
