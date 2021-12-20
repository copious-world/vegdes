
	import { db_store} from '../utils/db-utils'
    import { writable } from 'svelte/store';

    export let g_graph_control = writable(false)


    function clonify(p) {
        let b = JSON.parse(JSON.stringify(p))
        return b
    }


    let g_c_graph = false

	let g_db_store = null
	let g_exportable = false
    let g_db_ready = false
    let g_db_storage_ref = false
	db_store.subscribe((db_obj) => {
		if ( !db_obj ) {
			project_selected = false
			g_db_store = null
			g_exportable = false
		} else {
			g_db_store = db_obj
			g_db_ready = db_obj.ready
			g_exportable = db_obj.current_file_entry ? db_obj.current_file_entry.name : false
            g_db_storage_ref = g_db_store.db_storage_ref[0]
            if ( (g_c_graph !== undefined) && g_exportable && db_obj.current_file_entry ) {
                //console.log(db_obj.current_file_entry)
                g_c_graph.reset(db_obj.current_file_entry.layer)
            }
			if ( g_exportable === undefined || g_exportable === null ) g_exportable = false
		}
	})


// ---- // ---- // ---- // ---- // ---- // ---- // ----
// 
// ---- ----
class Node {

    constructor(shape_obj) {
        this.inputs = {}        // keeping these independently of other representations such as shapes
        this.outputs = {}
        this.shape = shape_obj
    }

    reset(a_node) {
        this.inputs = a_node.inputs
        this.outputs = a_node.outputs
        this.shape = a_node.shape
    }

    update(shape_obj) {
        if ( !shape_obj ) return
        //
        if ( shape_obj.shared === undefined ) {
            shape_obj.shared = {
                "id" : shape_obj.id,
                "path" : shape_obj.path  // until it changes 
            }
        } else {
            if ( shape_obj.id !== shape_obj.shared.id ) {
                shape_obj.shared.id =  shape_obj.id
            }
        }
        if ( shape_obj.function === "compute" ) {
            if ( shape_obj.refed == undefined ) {
                shape_obj.refed = {
                    "stretching_inputs" : shape_obj.stretching_inputs,
                    "stretching_outputs" : shape_obj.stretching_outputs
                }
            } else {
                if ( shape_obj.stretching_inputs !== undefined ) {
                    shape_obj.refed.stretching_inputs = shape_obj.stretching_inputs
                }
                if ( shape_obj.stretching_outputs !== undefined ) {
                    shape_obj.refed.stretching_outputs = shape_obj.stretching_outputs
                }
            }
        }
        //
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
            if ( outp.in_ref === old_id ) outp.in_ref = new_id
        }
    }

}

// ---- ----
class Edge {

    constructor(shape_obj) {
        this.out_ref = ""
        this.in_ref = ""
        this.shape = shape_obj
        if ( shape_obj ) {
            this.set_shape(shape_obj)
        }
    }

    set_shape(shape_obj) {
        if ( shape_obj.input && shape_obj.input.id ) {
            this.in_ref = shape_obj.input.id
        }
        if ( shape_obj.output && shape_obj.output.id ) {
            this.out_ref = shape_obj.output.id            
        }
    }

    reset(an_edge) {
        this.out_ref = an_edge.out_ref
        this.in_ref = an_edge.in_ref
        this.shape = an_edge.shape
    }

    update(shape_obj) {

    }

}



class ComponentGraph {

    //
    constructor() {
        this.nodes = {} // id -> node record
        this.edges = {} // id -> edge record (refs two node id's or one id and nothing)
        this.transitions  = {}
        this.pre_arcs = {}
        this.post_arcs = {}
        //
        this.db_layer = false
        //
        this.current_viz_graph = []  // the z-list of a graph
        //
        //
        this.active_connections_complete = false
        this.active_connections = false
        //
        this.svg_representation = ""    // not a thing at the moment

        //
        this.current_mode = "panel"
        this.init_modes()
        //
    }

    init_modes() {
        this.modes = {
            "panel" : {
                current_viz_graph : [],
                svg_representation : ""
            },
            "design" : {
                current_viz_graph : [],
                svg_representation : ""
            },
            "causal" : {
                current_viz_graph : [],
                svg_representation : ""
            },
        }
    }

    async project_db_update() {
        let svg = this.svg_representation
        let description = g_db_store ? g_db_store.current_file_entry.description : ""
        let to_layer = {
            "nodes" : this.nodes,
            "edges" : this.edges,
            "display" : this.current_viz_graph,
            "active_complete" : this.active_connections_complete,
            "active" : this.active_connections,
            "modes" : this.modes,
            "current_mode" : this.current_mode
        }
        this.db_layer = to_layer
        if ( g_db_storage_ref && g_exportable ) {
            await g_db_storage_ref.add_file(g_exportable,description,svg,to_layer)
        }
    }


    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
    reset(layer,edit_command) {
        //
        this.modes = layer.modes
        if ( this.modes === undefined ) {
            this.init_modes()
        }
        this.current_mode = (layer.current_mode === undefined) ? "panel" : layer.current_mode
        //
        if ( layer.nodes ) {
            this.nodes = {}
            for ( let nn in layer.nodes ) {
                let a_node = new Node(false)
                a_node.reset(layer.nodes[nn])
                this.nodes[nn] = a_node
            }
        }
        if ( layer.edges ) {
            this.edges = {}
            for ( let ee in layer.edges ) {
                let an_edge = new Edge(false)
                an_edge.reset(layer.edges[ee])
                this.edges[ee] = an_edge
            }
        }
        if ( layer.display ) {
            this.current_viz_graph = layer.display
            if ( g_graph_control ) {
                let e_com = edit_command ? edit_command : 'from_project'
                g_graph_control.update( cmd => {
                    let command = {
                        "command" : edit_command,
                        "pars" : {
                            "z_list" : this.current_viz_graph, 
                            "active_complete" : this.active_connections_complete,
                            "active" : this.active_connections
                        }
                    }
                    return command
                })    
            }
        }
    }


    async set_mode(edit_mode) {
        if ( this.current_mode !== edit_mode ) {
            //
            let old_mode_fields = this.modes[this.current_mode]
            let new_mode_fields = this.modes[edit_mode]
            this.current_mode = edit_mode
            //
            old_mode_fields.current_viz_graph = this.current_viz_graph
            old_mode_fields.svg_representation = this.svg_representation
            //
            this.current_viz_graph = new_mode_fields.current_viz_graph
            this.svg_representation = new_mode_fields.svg_representation
            this.db_layer.display = this.current_viz_graph
            this.db_layer.current_mode = edit_mode
            this.db_layer.svg_representation = this.svg_representation
            //
            this.reset(this.db_layer,'from_mode')
        }
    }

    rectify_views(edit_mode) {
        //
        let panel_viz = this.modes["panel"].current_viz_graph
        let design_viz = this.modes["design"].current_viz_graph
        let causal_viz = this.modes["causal"].current_viz_graph
        //
        let panel_components = panel_viz.filter(descr => {
            return ( (descr.role === "component") && (descr.function === "compute") )
        })
        let design_components = design_viz.filter(descr => {
            return ( (descr.role === "component") && (descr.function === "compute") )
        })
        let causal_components = causal_viz.filter(descr => {
            return ( (descr.role === "component") && (descr.function === "compute") )
        })
        //
        let collector = {}  // a collection of components, which should be shared except for visual properties
        for ( let dscr of panel_components ) {
            collector[dscr.id] = [dscr,false,false]   // start with the panel... if added, then they occur without connectors
        }
        // now the design may have new components (connectors included)
        for ( let dscr of design_components ) {
            if ( collector[dscr.id] !== undefined ) {
                collector[dscr.id][1] = dscr
            } else {
                collector[dscr.id] = [false,dscr,false]
            }
        }
        // a component may be added to the causality graph --- arcs will not appear in the design 
        // -- connectors in the design are communication paths.
        // -- arcs are transition enablement paths
        for ( let dscr of causal_components ) {
            if ( collector[dscr.id] !== undefined ) {
                collector[dscr.id][2] = dscr
            } else {
                collector[dscr.id] = [false,false,dscr]
            }
        }
        //
        for ( let id in collector ) {
            let d_list = collector[id]
            let [p,d,c] = d_list
            //
            let proto = p ? p : ( d ? d : c)  // pick the first view (all connector parts should be the same...)
            if ( edit_mode === "panel" && p ) {
                proto = p
            } else if ( edit_mode === "design" && d ) {
                proto = d
            } else if ( edit_mode === "causal" && c ) {
                proto = c
            }
            //
            let shared = proto.shared
            let refed = d ? d.refed : proto.refed
            if ( !p ) {
                p = clonify(proto)
                panel_viz.push(p)
            }
            if ( !d ) {
                d = clonify(proto)
                design_viz.push(d)
            }
            if ( !c ) {
                c = clonify(proto)
                causal_viz.push(c)
            }
            //
            p.shared = shared       // info the populate component definition editor...
            d.shared = shared
            c.shared = shared
            //
            for ( let sk in shared ) {
                p[sk] = shared[sk]
                d[sk] = shared[sk]
                c[sk] = shared[sk]
            }

            // refereneced but not promoted
            p.refed = refed       // info the populate component definition editor...
            d.refed = refed
            c.refed = refed
            //
        }
    }

    // 
    // add, get, del, find, etc.
    // add_viz_graph(z_list,g_active_connections_complete,g_active_connections)
    async add_viz_graph(z_list,active_connections_complete,active_connections,edit_mode) {
        //
        this.active_connections_complete = active_connections_complete
        this.active_connections = active_connections
        //
        if ( Array.isArray(z_list) ) {
            this.current_viz_graph = z_list
            this.modes[this.current_mode].current_viz_graph = z_list
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
        this.rectify_views(edit_mode)
        //
        await this.project_db_update()
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


g_c_graph = new ComponentGraph()


export let c_graph = g_c_graph