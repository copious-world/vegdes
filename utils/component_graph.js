

// ---- // ---- // ---- // ---- // ---- // ---- // ----
// 
// ---- ----
class Node {

    constructor(shape_obj) {
        this.inputs = {}        // keeping these independently of other representations such as shapes
        this.outputs = {}
        this.shape = shape_obj
    }

    update(shape_obj) {

    }

    link_edges(edges) {
        let shobj = this.shape
        let outs = shobj.stretching_outputs
        if ( outs ) {
            for ( let oo in outs ) {
                this.outputs[oo] = edges[oo]
            }
        }
        let ins = shobj.stretching_inputs
        if ( ins ) {
            for ( let ii in ins ) {
                this.inputs[ii] = edges[ii]
            }
        }
    }

    change_output(old_id,new_id) {
        let connector = this.outputs[old_id]
        if ( connector ) {
            this.outputs[new_id] = connector
            delete this.outputs[old_id]
        }
    }

    change_input(old_id,new_id) {
        let connector = this.inputs[old_id]
        if ( connector ) {
            this.inputs[new_id] = connector
            delete this.inputs[old_id]
        }
    }

    update_connectors(old_id,new_id) {
        for ( let ii in this.inputs ) {
            let inp = this.inputs[ii]
            if ( inp.out_ref === old_id ) inp.out_ref = new_id
        }
        for ( let oo in this.ouputs ) {
            let outp = this.ouputs[oo]
            if ( inp.out_ref === old_id ) inp.out_ref = new_id
        }
    }

}

// ---- ----
class Edge {

    constructor(shape_obj) {
        this.out_ref = ""
        this.in_ref = ""
        this.shape = shape_obj
        if ( shape_obj.input && shape_obj.input.id ) {
            this.in_ref = shape_obj.input.id
        }
        if ( shape_obj.output && shape_obj.output.id ) {
            this.out_ref = shape_obj.output.id            
        }
    }

    update(shape_obj) {

    }

}



class ComponentGraph {

    //
    constructor() {
        this.nodes = {} // id -> node record
        this.edges = {} // id -> edge record (refs two node id's or one id and nothing)
        this.current_viz_graph = []  // the z-list of a graph
        this.svg_representation = ""    // not a thing at the moment
    }

    // 
    // add, get, del, find, etc.

    add_viz_graph(z_list) {
        //
        if ( Array.isArray(z_list) ) {
            this.current_viz_graph = z_list
            for ( let shape_obj of z_list ) {
                if ( shape_obj.role === "connector" ) {
                    let c_id = shape_obj.id
                    if ( c_id ) {
                        let e = this.edges[c_id]
                        if ( e ) {
                            e.update(shape_obj)
                        } else {
                            e = new Edge(shape_obj)
                            this.edges[c_id] = e
                        }
                    }
                } else if ( shape_obj.role === "component" ) {
                    let c_id = shape_obj.id
                    if ( c_id ) {
                        let nn = this.nodes[c_id]
                        if ( nn ) {
                            nn.update(shape_obj)
                        } else {
                            nn = new Node(shape_obj)
                            this.nodes[c_id] = nn
                        }
                    }                    
                }
            }
        }
        //
        for ( let n_id in this.nodes ) {
            let nn = this.nodes[n_id]
            if ( nn ) {
                nn.link_edges(this.edges)
            }
        }
        //
    }

    change_id(old_id,new_id,role) {
        if ( role === "connector" ) {
            let e = this.edges[old_id]
            this.edges[new_id] = e
            delete this.edges[old_id]
            //
            let e_shape = e.shape_obj()
            if ( e_shape ) {
                if ( e_shape.input ) {
                    let i_id = e_shape.input.id
                    let nn = this.nodes[i_id]
                    if ( nn ) {
                        nn.change_output(old_id,new_id)
                    }
                }
                if ( e_shape.output ) {
                    let o_id = e_shape.ouput.id
                    nn = this.nodes[o_id]
                    if ( nn ) {
                        nn.change_input(old_id,new_id)
                    }
               }
            }
        } else if ( role === "component" ) {
            let nn = this.nodes[old_id]
            this.nodes[new_id] = nn
            delete this.nodes[old_id]
            //
            nn.update_connectors(old_id,new_id)
        }
    }


}




export let c_graph = new ComponentGraph()