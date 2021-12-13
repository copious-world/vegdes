<script>

    import CanDraw from "svelte-can-draw"
	import { g_commander } from './edit_commands'
	import { tick,afterUpdate } from "svelte";

	import { parameter_publisher } from './param_updates'
	import { redo_list } from "./undo_redo"
	import { c_graph } from "../utils/component_graph"

    export let height = 460
    export let width = 680

    export let doc_height = height
    export let doc_width = width
    export let doc_left = 0
    export let doc_top = 0

    export let drawing_name = "test"

    export let grid_on = false
    export let magnification = 1.0
    //
    export let grid_interval = 50
	export let tool = "select"
	export let tool_parameters = false
	export let component_defaults = false
	export let shape = "rect"

	export let selected_objects
	export let selection_changed

	export let group_selected = false

	let selection_on = false
	let select_left = 0
	let select_top = 0
	let select_width = 0
	let select_height = 0

	let accrued_selections_list = []

    let x_mag = 1.0
    let y_mag = 1.0

	let prev_doc_left = doc_left
	let prev_doc_top = doc_top


	let multi_selected = false

	let canvas_mouse
	let drawing = false

    //
    let can_draw_selected = false
    let shape_index = false

	let canvas_changed = false

    let set_drawing = CanDraw.draw_model.set_drawing

	let draw_cautious = false

	let connector_index = false 

	
	function dist(X,Y) {
		let [x1,y1] = X
		let [x2,y2] = Y

		let delta_x = (x1 - x2)
		let delta_y = (y1 - y2)
		let D = Math.sqrt(delta_x*delta_x + delta_y*delta_y)
		return D
	}

	function object_clone(obj) {
		let new_obj = JSON.parse(JSON.stringify(obj))
		return new_obj
	}

	function remove_max(ilist) {
		let j = -1
		let max = -1000
		let n = ilist.length
		for ( let i = 0; i < n; i++ ) {
			let m = ilist[i]
			if ( m > max ) {
				max = m
				j = i
			}
		}
		ilist.splice(j,1)
		return [ilist,max]
	}

	function close_to_rect(a_rect,x,y) {
		if ( ( x >= a_rect.x ) && ( y >= a_rect.y ) 
				&& ( x <= a_rect.x + a_rect.width ) && ( y <= a_rect.y + a_rect.height ) ) {
			return true
		}
		//
		if ( dist([x,y],[a_rect.x,a_rect.y]) < 5 ) {
			return true
		}
		if ( dist([x,y],[(a_rect.x1 + a_rect.width),a_rect.y]) < 5 ) {
			return true
		}
		if ( dist([x,y],[a_rect.x,(a_rect.new_y + a_rect.height)]) < 5 ) {
			return true
		}
		if ( dist([x,y],[(a_rect.x + a_rect.width),(a_rect.y + a_rect.height)]) < 5 ) {
			return true
		}
		return false
	}

	function gen_id() {
		let id = `${Math.floor(Math.random()*1000)}${Date.now()}`
		return id
	}



	// CONNECTORS
	async function capture_save_state() {
		if ( !drag_selection ) {
			await c_graph.add_viz_graph(z_list)
		}
	}

	// ----
	function indexer_from_disposition(disposition,start_point) {
		let l_indexer = { 'x' : 0, 'y' : 1 }
		let indexes = [0,1,2,3]
		if ( disposition == 'nw' || disposition == 'nw' ) {
			indexes = [2,3,0,1]
		}
		//
		if ( start_point ) {
			l_indexer.x = indexes[0]
			l_indexer.y = indexes[1]
		} else {
			l_indexer.x = indexes[2]
			l_indexer.y = indexes[3]
		}
		return l_indexer
	}


	let g_active_connections_complete = {}
	let g_active_connections = {}

	// semantic part for underlying flow system
	function make_connection(connector,component,in_out) {
		if ( g_active_connections_complete[connector.id] === undefined ) g_active_connections_complete[connector.id] = 0
		if ( g_active_connections_complete[connector.id] < 2 ) {
			g_active_connections_complete[connector.id]++
		}
		g_active_connections[connector.id] = { 
			"connector" : connector, 
			"complete" : (g_active_connections_complete[connector.id] === 2)
		}
	}

	function break_connection(connector,component,in_out) {
		if ( g_active_connections_complete[connector.id] !== undefined ) {
			if ( g_active_connections_complete[connector.id] > 0 ) {
				g_active_connections_complete[connector.id]--
			} else {
				delete g_active_connections_complete[connector.id]
				delete g_active_connections[connector.id]
			}
		}
	}


	function connections_disconnect(connector,component,in_out) {
		if ( in_out === 'in' ) {
			delete component.stretching_inputs[connector.id]
		} else {
			delete component.stretching_outputs[connector.id]
		}
		break_connection(connector,component,in_out)
	}

	async function proximity_check(points,disposition) {
		let proxmimities = [false,false]
		let indexer = indexer_from_disposition(disposition,true)
		let x1 = points[indexer.x]
		let y1 = points[indexer.y]
		draw_control.searching({ "mouse_loc" : [x1,y1], "no_change" : true, "exclude" : shape_index })
		await tick()
		if ( (connector_index !== false) && (connector_index >= 0) ) {
			let possible_connection = draw_cautious.ith_object(connector_index)
			if ( possible_connection ) {
				if ( possible_connection.role === 'component' ) {
					let [x0,y0,w,h] = possible_connection.bounds
					w = Math.max(w,1)
					let percent_points = [(x1 - x0)/w,(y1 - y0)/h]
					proxmimities[0] = [possible_connection,[x1,y1],indexer,percent_points]
				}
			}
		}
		indexer = indexer_from_disposition(disposition,false)
		let x2 = points[indexer.x]
		let y2 = points[indexer.y]
		draw_control.searching({ "mouse_loc" : [x2,y2], "no_change" : true, "exclude" : shape_index })
		await tick()
		if ( (connector_index !== false) && (connector_index >= 0) ) {
			let possible_connection = draw_cautious.ith_object(connector_index)
			if ( possible_connection ) {
				if ( possible_connection.role === 'component' ) {
					let [x0,y0,w,h] = possible_connection.bounds
					w = Math.max(w,1)
					let percent_points = [(x2 - x0)/w,(y2 - y0)/h]
					//
					proxmimities[1] = [possible_connection,[x2,y2],indexer,percent_points]
				}
			}
		}

		if ( proxmimities && proxmimities.length === 1 ) proxmimities.push(false)
	
		return proxmimities
	}


	function register_connections(connector,proximities) {
		//
		if ( connector.id === undefined ) return
		//
		let input_info = proximities[0]
		let output_info = proximities[1]
		let input = input_info[0]
		//
		if ( connector.input && (input !== connector.input) ) {
			connections_disconnect(connector,connector.input,'in')
			connector.input = false
		}
		if ( input ) {
			make_connection(connector,input,'in')
			if ( input.stretching_inputs === undefined ) input.stretching_inputs = {}
			input_info[0] = connector.id
			input.stretching_inputs[connector.id] = input_info
			connector.input = input
		}
		if ( output_info == undefined ) return
		let output = output_info[0]
		if ( connector.output && (output !== connector.output) ) {
			connections_disconnect(connector,connector.output,'out')
			connector.output = false
		}
		if ( output ) {
			make_connection(connector,output,'out')
			if ( output.stretching_outputs === undefined ) output.stretching_outputs = {}
			output_info[0] = connector.id
			output.stretching_outputs[connector.id] = output_info
			connector.output = output
		}
	}


	function neutral_command(cmd) {
		if ( cmd === "redo_to" ) return true
		if ( cmd === "undo_to" ) return true
		return false
	}


    g_commander.subscribe(async (command) => {
        //
        let cmd_pars = command.pars
		if ( command.command !== undefined  ) {
            let cmd = command.command
			//
			let target = can_draw_selected
			//
			if ( target || neutral_command(cmd) ) {
				switch ( cmd ) {
					case "clone" : {
						let c_shape = can_draw_selected.shape
						if ( c_shape === "group" )  {
							capture_save_state()  // go back to no clone if undo
							//
							let sel_list = [].concat(can_draw_selected.select_list)
							sel_list.sort()
							let selector = sel_list.pop()
							sel_list.reverse()
							//
							let dx = cmd_pars.offset_x
							let dy = cmd_pars.offset_y
							//
							let exclusions = can_draw_selected.exclusion_list
							for ( let ith of sel_list ) {
								if ( exclusions && Array.isArray(exclusions) ) {
									if ( exclusions.indexOf(ith) >= 0 ) continue
								}
								draw_control.command("select",{ "select" : ith })
								await tick()
								let member_shape = can_draw_selected.shape
								let mem_pars = JSON.parse(JSON.stringify(can_draw_selected.pars))
								mem_pars.points[0] += dx
								mem_pars.points[1] += dy
								//
								draw_control.add(member_shape,mem_pars)
								await tick()
							}
							draw_control.command("send_top",{ "select" : selector })
							await tick()
							draw_control.command("select_top")
							await tick()
							canvas_changed = true
							await fetch_zlist()
						} else {
							capture_save_state()  // go back to no clone if undo
							let c_pars = JSON.parse(JSON.stringify(can_draw_selected.pars))
							let dx = cmd_pars.offset_x
							let dy = cmd_pars.offset_y
							c_pars.points[0] += dx
							c_pars.points[1] += dy
							select_left += dx
							select_top += dy
							//
							draw_control.add(c_shape,c_pars)
							await tick()
							draw_control.command("select_top")
							await tick()
							canvas_changed = true
							await fetch_zlist()
						}
						break;
					}
					case "delete" : {
						capture_save_state()  // go back to element exists if undo
						draw_control.command("remove_selected")
						await tick()
						set_selection_controls(false)
						await fetch_zlist()
						break;
					}
					case "to_top" : {
						capture_save_state()  // go back to not on top if undo
						//
						if ( can_draw_selected.role !== 'picker' ) {
							draw_control.command("send_top",{ "select" : false })							
						} else {
							let sel_list = [].concat(can_draw_selected.select_list)
							let exclusions = can_draw_selected.exclusion_list
							let travelers = sel_list.filter(trvlr => {
								if ( exclusions.indexOf(trvlr) >= 0 ) return false
								return true
							})
							//
							let n = travelers.length
							draw_control.command("send_top",{ "select" : travelers })
							await tick()
							draw_control.command("select_top")
							await tick()
							canvas_changed = true

							let ii = []
							let m = draw_cautious.z_top()
							for ( let i = 0; i < n; i++ ) {
								ii.push(m)
								m--
							}
							can_draw_selected.select_list = ii


						}
						await fetch_zlist()
						break;
					}
					case "to_bottom" : {
						capture_save_state()  // go back to not on bottom if undo
						//
						if ( can_draw_selected.role !== 'picker' ) {
							draw_control.command("send_bottom",{ "select" : false })							
						} else {
							let sel_list = [].concat(can_draw_selected.select_list)
							let [sels,max] = remove_max(sel_list)
							sel_list = sels
							let exclusions = can_draw_selected.exclusion_list
							let travelers = sel_list.filter(trvlr => {
								if ( exclusions.indexOf(trvlr) >= 0 ) return false
								return true
							})
							let n = travelers.length
							draw_control.command("send_bottom",{ "select" : travelers })
							await tick()
							draw_control.command("select_top")
							await tick()
							let ii = []
							for ( let i = 0; i < n; i++ ) ii.push(i)
							ii.push(max)
							can_draw_selected.select_list = ii
							let old_exclusions = can_draw_selected.exclusion_list
							if ( Array.isArray(old_exclusions) && (old_exclusions.length > 0) ) {
								for ( let i = 0; i < n; i++ ) {
									let v = old_exclusions[i]
									while ( v >= travelers[0] ) {
										travelers.shift()
										n = travelers.length
									}
									can_draw_selected.exclusion_list[i] = (v + n)
								}
							}
							canvas_changed = true
						}
						await fetch_zlist()
						break;
					}
					case "undo_to" : {
						let ith = -cmd_pars.offset
						await redo_restore(ith)
						break;
					}
					case "redo_to" : {
						let ith = cmd_pars.offset  // go in the other direction
						await redo_restore(ith)
						break;
					}
					case "colorize" : {
						if ( cmd_pars.line ) {
							let new_pars = Object.assign(can_draw_selected.pars,{ 'line': cmd_pars.line })
							draw_control.update(new_pars)
						} else if ( cmd_pars.fill ) {
							let new_pars = Object.assign(can_draw_selected.pars,{ 'fill': cmd_pars.fill })
							draw_control.update(new_pars)
						}
						break
					}
					case "update_parameter" : {
						if ( can_draw_selected.shape !== 'group' ) {
							capture_save_state()  // go back to no clone if undo
							let new_pars = Object.assign(can_draw_selected.pars,cmd_pars)
							draw_control.update(new_pars)
						}
						break;
					}
					case "update_connector_id" : {
						let {old_id,new_id} = cmd_pars
						let connector_info = g_active_connections[old_id]
						if ( connector_info ) {
							capture_save_state()  // go back to no clone if undo
							c_graph.change_id(old_id,new_id,'connector')
							let connector = connector_info.connector
							g_active_connections[new_id] = connector_info
							connector.id = new_id
							let output = connector.output
							let input = connector.input
							if ( output ) {
								let output_info = output.stretching_outputs[old_id]
								output_info[0] = new_id
								output.stretching_outputs[new_id] = output_info
								delete output.stretching_outputs[old_id]
							}
							if ( input ) {
								let input_info = input.stretching_inputs[old_id]
								input_info[0] = new_id
								input.stretching_inputs[new_id] = input_info
								delete input.stretching_inputs[old_id]
							}
							delete g_active_connections[old_id]
							g_active_connections_complete[new_id] = g_active_connections_complete[old_id]
							delete g_active_connections_complete[old_id]
						}
						break;
					}
				}
			}
        }
    })


	async function parameters_update(pars) {
		//capture_save_state()  // go back to no clone if undo
		//
		draw_control.update(pars)
		await tick()
		parameter_publisher.command("update_selected",can_draw_selected)
	}



	async function group_parameters_update(pars,dif_x,dif_y) {
		if ( can_draw_selected ) {
			//capture_save_state()  // go back to no clone if undo
			//
			draw_control.update(pars)
			await tick()
			//
			let sel_list = [].concat(can_draw_selected.select_list)
			sel_list.sort()
			let selector = sel_list.pop()
			sel_list.reverse()
			//
			let exclusions = can_draw_selected.exclusion_list
			for ( let ith of sel_list ) {
				if ( exclusions && Array.isArray(exclusions) ) {
					if ( exclusions.indexOf(ith) >= 0 ) continue
				}
				draw_control.command("select",{ "select" : ith })
				await tick()
				update_selected_object(dif_x,dif_y,false,false,false,false)
				await tick()
			}
			draw_control.command("send_top",{ "select" : selector })
			await tick()
			draw_control.command("select_top")
			await tick()
			canvas_changed = true
			//await fetch_zlist()
		}
	}


	async function change_selection(sel_id,prev_shape_index) {
		if ( typeof sel_id === 'string' ) {
			draw_control.command("select_top")
			await tick()
			if ( can_draw_selected ) {
				parameter_publisher.command("selected",can_draw_selected)
			}
		} else if ( typeof sel_id === 'boolean' ) {
			if ( can_draw_selected && (prev_shape_index !== undefined) ) {
				draw_control.command("deselect",{"select" : prev_shape_index})
				await tick()
				parameter_publisher.command("deselect",{})
			}
		} else {
			draw_control.command("select",{"select" : sel_id})
			await tick()
			if ( can_draw_selected ) {
				parameter_publisher.command("selected",can_draw_selected)
			}
		}
	}


	async function multi_selection(option_key) {
		draw_control.multi_select({ "rect" : [(select_left - doc_left),(select_top - doc_top),select_width,select_height] })
		await tick()
		if ( !option_key ) {
			draw_control.command("update_selector_group",{ "list" : multi_selected, "state" : true})
		}
	}


	// ZLIST DEEP CLONE HAS HAPPENED
	let catch_selection = false
	let z_list = false
	async function fetch_zlist() {
		draw_control.z_list()
		await tick()
		if ( z_list ) {
			redo_list.push(z_list)
			await capture_save_state()
		}
	}

	async function redo_restore(ith) {
		let a_z_list = redo_list.offset_pointer(ith)
		if ( a_z_list ) {
			draw_control.command("z_list_replace",{ "z_list" : a_z_list })
			await tick()
			await capture_save_state()
		}
	}


	let selection_active = false
	$: {
		if ( selection_active ) {
			selected_objects = can_draw_selected
		} else {
			selected_objects = false
		}
	}

    let draw_control
    let last_name = ""
    $: if ( !(draw_control) || (last_name !== drawing_name) ) {
        last_name = drawing_name
        draw_control = set_drawing(drawing_name)
        draw_control.command("clear_all")
    }

	//let change_count = 0
    $: if ( draw_control ) {
		if ( magnification !== x_mag ) {
			x_mag = magnification
			y_mag = magnification
			draw_control.command("scale_redraw",{"scale" : [x_mag,y_mag]})
			set_selection_controls((tool === 'select') && selection_on)
			if ( canvas_mouse && (tool === "select") && selection_on ) {
				magnification_recover()
			}
		}
    }

    $: if ( draw_control ) {
        draw_control.command("set_grid",{"interval" : grid_interval, "grid_on" : grid_on })
    }

	let mouse_x = 0
	let mouse_y = 0
	let prev_mouse_x = 0
	let prev_mouse_y = 0
	$: if ( draw_control && canvas_mouse ) {
		//
		mouse_x = (canvas_mouse.x/x_mag)
		mouse_y = (canvas_mouse.y/y_mag)
		let draw_delta_x = canvas_mouse.x - prev_mouse_x
		let draw_delta_y = canvas_mouse.y - prev_mouse_y
		prev_mouse_x = canvas_mouse.x
		prev_mouse_y = canvas_mouse.y
		//
		if ( drawing ) {
			if ( can_draw_selected ) {
				if ( can_draw_selected.shape === 'rect' || can_draw_selected.shape === 'group' ) {
					let points = can_draw_selected.pars.points
					let new_left = mouse_x - points[0]
					if ( new_left > 0 ) { points[2] = new_left }
					let new_top = mouse_y - points[1]
					if ( new_top > 0 ) { points[3] = new_top }
					let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
					parameters_update(new_pars)
				} else if ( can_draw_selected.shape === 'ellipse' ) {
					let points = can_draw_selected.pars.points
					let new_left = mouse_x - points[0]
					if ( new_left > 0 ) { points[2] = new_left/2 }
					let new_top = mouse_y - points[1]
					if ( new_top > 0 ) { points[3] = new_top/2 }
					let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
					parameters_update(new_pars)
				} else if ( (can_draw_selected.shape === 'polygon') || (can_draw_selected.shape === 'star') ) {
					let points = draw_cautious.change_star_radius(can_draw_selected,canvas_mouse,draw_delta_x,draw_delta_y)
					let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
					parameters_update(new_pars)
				} else if ( can_draw_selected.shape === 'line' ) { 
					let points = can_draw_selected.pars.points
					points[2] = mouse_x
					points[3] = mouse_y
					let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
					parameters_update(new_pars)
				}
			}
		}
	}


	let prev_tool = tool
	$: {
		set_selection_controls((tool === 'select') && selection_on)
		if ( tool !== 'select' ) {
			selection_on = false
		}
		prev_tool = tool
	}


	let selection_style = `visibility:hidden;display:none;left:0px;top:0px;width:1px;height:1px`
	let handle_top_left_style = `visibility:hidden;display:none;left:0px;top:0px`
	let handle_left_style = `visibility:hidden;display:none;left:0px;top:0px`
	let handle_bottom_left_style = `visibility:hidden;display:none;left:0px;top:0px`
	//
	let handle_top_style = `visibility:hidden;display:none;left:0px;top:0px`
	let handle_bottom_style = `visibility:hidden;display:none;left:0px;top:0px`
	//
	let handle_top_right_style = `visibility:hidden;display:none;left:0px;top:0px`
	let handle_right_style = `visibility:hidden;display:none;left:0px;top:0px`
	let handle_bottom_right_style = `visibility:hidden;display:none;left:0px;top:0px`



	let handle_rotator_style = `visibility:hidden;display:none;left:0px;top:0px`
	let rotator_center_style = `visibility:hidden;display:none;left:0px;top:0px`

	let prev_select_left = 300
	let prev_select_top = 200
	let prev_select_width = 30
	let prev_select_height = 30

	let handle_box_tl = false
	let handle_box_top = false
	let handle_box_bl = false
	let handle_box_left = false
	let handle_box_bottom = false
	let handle_box_tr = false
	let handle_box_right = false
	let handle_box_br = false

	function calc_line_disposition(points) {
		let ew = 'w'
		let ns = 's'
		let [x1,y1,x2,y2] = points
		ew = ( x1 >= x2 ) ? 'w' : 'e'
		ns = ( y1 <= y2 ) ? 's' : 'n'
		return ( ns + ew )
	}

	function save_selection_bounds() {
		prev_select_left = select_left
		prev_select_top = select_top
		prev_select_width = select_width
		prev_select_height = select_height
	}


	function set_select_bounds() {
		select_left = prev_select_left
		select_top = prev_select_top
		select_width = prev_select_width
		select_height = prev_select_height
	}

	async function update_selected_object(dx,dy,xchange,ychange,diff_source,option_key) {
		await _update_target_object(can_draw_selected,dx,dy,xchange,ychange,diff_source,option_key)
	}

	async function reshape_connectors(target_draw_shape,dx,dy,xchange,ychange,diff_source,option_key) {
		if ( (target_draw_shape.stretching_outputs !== undefined) && (target_draw_shape.stretching_outputs !== false) ) {
			// // [[connector.id,[x1,y1],indexer]]
			for ( let c_id in target_draw_shape.stretching_outputs ) {
				let c_info = g_active_connections[c_id]
				if ( c_info && c_info.connector ) {
					let cc = c_info.connector
					let descr = target_draw_shape.stretching_outputs[c_id]
					let pre_points = descr[1]
					let indexer = descr[2]
					let percent_points = descr[3]
					//
					let x = pre_points[0]
					let y = pre_points[1]
					if ( !diff_source ) {
						x += dx
						y += dy
					} else {
						let [x0,y0,w,h] = target_draw_shape.bounds
						x = x0 + w*percent_points[0]
						y = y0 + h*percent_points[1]
					}

					descr[1] = [x,y]
					//
					let points = cc.pars.points
					points[indexer.x] = x
					points[indexer.y] = y
					//
					let disposition = calc_line_disposition(points)
					cc.disposition = disposition
					//
					let new_pars = Object.assign(cc.pars,{ 'points': points })
					new_pars.id = c_id
					new_pars.role = 'connector'
					draw_control.command('update_by_id',new_pars)
					//
				}
				await tick()
				draw_control.command('refresh',{})
				await tick()
			}
		}
		if ( (target_draw_shape.stretching_inputs !== undefined) && (target_draw_shape.stretching_inputs !== false) ) {
			// // [[connector.id,[x1,y1],indexer]]
			for ( let c_id in target_draw_shape.stretching_inputs ) {
				let c_info = g_active_connections[c_id]
				if ( c_info && c_info.connector ) {
					let cc = c_info.connector
					let descr = target_draw_shape.stretching_inputs[c_id]
					let pre_points = descr[1]
					let indexer = descr[2]
					let percent_points = descr[3]
					//
					let x = pre_points[0]
					let y = pre_points[1]
					if ( !diff_source ) {
						x += dx
						y += dy
					} else {
						let [x0,y0,w,h] = target_draw_shape.bounds
						x = x0 + w*percent_points[0]
						y = y0 + h*percent_points[1]
					}
					descr[1] = [x,y]
					//
					let points = cc.pars.points
					points[indexer.x] = x
					points[indexer.y] = y
					//
					let disposition = calc_line_disposition(points)
					cc.disposition = disposition
					//
					let new_pars = Object.assign(cc.pars,{ 'points': points })
					new_pars.id = c_id
					new_pars.role = 'connector'
					draw_control.command('update_by_id',new_pars)
					//
				}
				await tick()
				draw_control.command('refresh',{})
				await tick()
			}
		}
	}

	async function _update_target_object(target_draw_shape,dx,dy,xchange,ychange,diff_source,option_key) {
		if ( target_draw_shape ) {
			if ( target_draw_shape.shape === 'rect' || target_draw_shape.shape === 'group' ) {
				let points = target_draw_shape.pars.points
				if ( diff_source ) {
					if ( diff_source === handle_box_tl) {
						if ( xchange ) points[0] += dx
						if ( ychange ) points[1] += dy
					} else if ( diff_source === handle_box_top) {
						if ( ychange ) points[1] += dy
					} else if ( diff_source === handle_box_bl) {
						if ( xchange ) points[0] += dx
					} else if ( diff_source === handle_box_left) {
						if ( xchange ) points[0] += dx
					} else if ( diff_source === handle_box_tr) {
						if ( ychange ) points[1] += dy
					}
				} else {
					points[0] += dx
					points[1] += dy
				}
				if ( xchange ) points[2] = select_width
				if ( ychange ) points[3] = select_height
				let new_pars = Object.assign(target_draw_shape.pars,{ 'points': points })
				if ( target_draw_shape.shape === 'group' ) {
					multi_selection(option_key)
				}
				if ( option_key && !diff_source && (target_draw_shape.shape === 'group') ) {
					group_parameters_update(new_pars,dx,dy)
				} else {
					parameters_update(new_pars)
					if ( target_draw_shape.role === 'component' ) {
						//	// if there are connectors change their endpoint positions and call this method...
						await reshape_connectors(target_draw_shape,dx,dy,xchange,ychange,diff_source,option_key)
					}
				}
			} else if ( target_draw_shape.shape === 'line' ) {
				let points = target_draw_shape.pars.points
				if ( diff_source ) {
					let disposition = target_draw_shape.disposition
					if ( !disposition ) {
						disposition = calc_line_disposition(points)
						target_draw_shape.disposition = disposition
					}
					switch ( disposition ) {
						case 'se' : 
						case 'nw' : {
							let indexes = [0,1,2,3]
							if ( disposition == 'nw' ) {
								indexes = [2,3,0,1]
							}
							if ( diff_source === handle_box_tl) {
								if ( xchange ) points[indexes[0]] += dx
								if ( ychange ) points[indexes[1]] += dy
							} else if ( diff_source === handle_box_top ) {
								if ( ychange ) points[indexes[1]] += dy
							} else if ( diff_source === handle_box_bl ) {
								if ( xchange ) points[indexes[0]] += dx
								if ( ychange ) points[indexes[3]] += dy
							} else if ( diff_source === handle_box_left) {
								if ( xchange ) points[indexes[0]] += dx
							} else if ( diff_source === handle_box_tr) {
								if ( ychange ) points[indexes[1]] += dy
								if ( xchange ) points[indexes[2]] += dx
							} else if ( diff_source === handle_box_bottom) {
								if ( ychange ) points[indexes[3]] += dy
							} else if ( diff_source === handle_box_right) {
								if ( xchange ) points[indexes[2]] += dx
							} else if ( diff_source === handle_box_br) {
								if ( xchange ) points[indexes[2]] += dx
								if ( ychange ) points[indexes[3]] += dy
							}
							break
						}
						case 'sw' :
						case 'ne' : {
							let indexes = [0,1,2,3]
							if ( disposition == 'ne' ) {
								indexes = [2,3,0,1]
							}
							if ( diff_source === handle_box_tr) {
								if ( xchange ) points[indexes[0]] += dx
								if ( ychange ) points[indexes[1]] += dy
							} else if ( diff_source === handle_box_top ) {
								if ( ychange ) points[indexes[1]] += dy
							} else if ( diff_source === handle_box_br ) {
								if ( xchange ) points[indexes[0]] += dx
								if ( ychange ) points[indexes[3]] += dy
							} else if ( diff_source === handle_box_left ) {
								if ( xchange ) points[indexes[2]] += dx
							} else if ( diff_source === handle_box_bl ) {
								if ( xchange ) points[indexes[2]] += dx
								if ( ychange ) points[indexes[3]] += dy
							} else if ( diff_source === handle_box_bottom ) {
								if ( ychange ) points[indexes[3]] += dy
							} else if ( diff_source === handle_box_right ) {
								if ( xchange ) points[indexes[0]] += dx
							} else if ( diff_source === handle_box_tl ) {
								if ( xchange ) points[indexes[2]] += dx
								if ( ychange ) points[indexes[1]] += dy
							}
							break
						}
					}
					//
				} else {
					points[0] += dx
					points[1] += dy
					points[2] += dx
					points[3] += dy
				}
				//
				let new_pars = Object.assign(target_draw_shape.pars,{ 'points': points })
				if ( option_key ) {
					let proximities = await proximity_check(points,target_draw_shape.disposition)
					if ( proximities ) {
						register_connections(target_draw_shape,proximities)
					}
				}
				parameters_update(new_pars)
			} else {
				if ( diff_source ) {
					let points = target_draw_shape.pars.points
					if ( diff_source === handle_box_tl) {
						if ( xchange ) points[0] += dx/2
						if ( ychange ) points[1] += dy/2
					} else if ( diff_source === handle_box_top) {
						if ( ychange ) points[1] += dy/2
						dx = 0
					} else if ( diff_source === handle_box_bl) {
						if ( xchange ) points[0] += dx/2
						if ( ychange ) points[1] += dy/2
					} else if ( diff_source === handle_box_left) {
						if ( xchange ) points[0] += dx/2
						dy = 0
					} else if ( diff_source === handle_box_tr) {
						if ( xchange ) points[0] += dx/2
						if ( ychange ) points[1] += dy/2
					} else if ( diff_source === handle_box_bottom) {
						if ( ychange ) points[1] += dy/2
						dx = 0
					} else if ( diff_source === handle_box_right) {
						if ( xchange ) points[0] += dx/2
						dy = 0
					} else if ( diff_source === handle_box_br) {
						if ( xchange ) points[0] += dx/2
						if ( ychange ) points[1] += dy/2
					}

					switch ( target_draw_shape.shape ) {
						case 'ellipse' : {
							if ( xchange ) points[2] = select_width/2
							if ( ychange ) points[3] = select_height/2
							break;
						}
						case 'star' : {
							if ( pure_mouse ) {
								points[0] = (select_left - doc_left) + select_width/2
								points[1] = (select_top - doc_top) +  select_height/2
								let ref_x = { 'x' : (select_left - doc_left), 'y' : (select_top - doc_top) } 
								points = draw_cautious.change_star_radius(target_draw_shape,ref_x,dx,dy)
							}
							break;
						}
						case 'polygon' : {
							if ( xchange|| ychange ) {
								let sw = dx
								let sh = dy
								let area_prior = target_draw_shape.bounds[2]*target_draw_shape.bounds[3]
								let sign = (select_width*select_height < area_prior) ? -1 : 1
								points[2] += sign*Math.sqrt(sw*sw + sh*sh)
							}
							break;
						}
						default: {
							break;
						}
					}
					let new_pars = Object.assign(target_draw_shape.pars,{ 'points': points })
					parameters_update(new_pars)
				} else {
					let points = target_draw_shape.pars.points
					points[0] += dx
					points[1] += dy
					let new_pars = Object.assign(target_draw_shape.pars,{ 'points': points })
					parameters_update(new_pars)
				}
			}
		}
	}


	async function circular_update_selected_object(dx,dy,xchange,ychange,diff_source,option_key) {
		if ( can_draw_selected.shape === 'line' ) {
			//
			let points = can_draw_selected.pars.points  // preserve orientation....
			points[0] = rotator_center_left - doc_left
			points[1] = rotator_center_top - doc_top
			points[2] = rotator_tracker_left - doc_left
			points[3] = rotator_tracker_top - doc_top
			//
			let prev_disposition = can_draw_selected.disposition
			let disposition = calc_line_disposition(points)
			can_draw_selected.disposition = disposition

			let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
			if ( option_key ) {
				let proximities = await proximity_check(points)
				if ( proximities ) {
					register_connections(can_draw_selected,proximities)
				}
			} else if ( (prev_disposition !== disposition) && (can_draw_selected.role === 'connector') ) {
				// reset disposition in connected components
				// break the connections
			}


			parameters_update(new_pars)
		}
	}


	let text_box_style  = "visibility:hidden;display:none;left:0px;top:0px"
	let text_box_field = false
	let text_box_field_style = "visibility:inherit;width:inherit;heightinherit"
	let text_box = false
	let text_value = ""
	let text_initialized = false
	let text_loc = {
		"x" : 0,
		"y" : 0
	}
	async function position_text_box(x,y) {
		if ( text_box ) {
			text_loc.x = x
			text_loc.y = y
			text_box_style = `visibility:visibleiv;display:block;left:${x + doc_left}px;top:${y + doc_top}px`
			text_value = ""
			text_initialized = false
			await tick()
			if ( text_box_field ) {
				text_box_field.focus()
				text_box_field.click()
				await tick()
				setTimeout(function () { text_box_field.focus(); }, 1);
			}
		}
	}

	function turn_off_text() {
		text_initialized = false
		text_complete()
	}


	async function startup_new_text() {
		draw_control.add("text",{ "thick" : tool_parameters.parameters.thick, "line" : tool_parameters.parameters.line, "fill" : tool_parameters.parameters.fill, "points" : [text_loc.x,text_loc.y], 
									"text" : text_value, "font": tool_parameters.parameters.font,
									"textAlign" : "center", "textBaseline" : "middle"
								})
		await tick()
		draw_control.command("select_top")
		await tick()
	}

	$: if ( is_text(tool) ) {
		if ( typeof text_value === 'string'  && text_value.length ) {
			if ( !text_initialized ) {
				text_initialized = true
				startup_new_text()
			} else {
				if ( can_draw_selected ) {
					let new_pars = Object.assign(can_draw_selected.pars,{ 'text': text_value })
					parameters_update(new_pars)
				}
			}
		}
	}



/*
	let [x,y] = pars.points
            let text = pars.text
            //
            ctxt.lineWidth = pars.thick;
            ctxt.strokeStyle = pars.line;
            ctxt.font = pars.font;
            ctxt.textAlign = pars.textAlign;
            ctxt.textBaseline = pars.textBaseline;
*/

	function text_complete() {
		let new_text = text_value
		text_value = ""
		text_box_style  = "visibility:hidden;display:none;left:0px;top:0px"
	}


	//
	function selection_positions() {
		// mag
		let half_height = Math.floor(magnification*select_height/2)
		let half_width = Math.floor(magnification*select_width/2)
		let mag_select_left = (select_left)*magnification
		let mag_select_top = (select_top)*magnification
		let mag_select_width = select_width*magnification + magnification
		let mag_select_height = select_height*magnification + magnification
		let delta = 2*magnification
		selection_style = `visibility:visible;display:block;left:${mag_select_left - delta/2}px;top:${mag_select_top - delta/2}px;width:${mag_select_width}px;height:${mag_select_height}px`
		selection_style += ";cursor:move"
		//grab_selection
		//
		handle_top_left_style = `visibility:visible;display:block;left:${mag_select_left - delta}px;top:${mag_select_top - delta}px;`
		handle_left_style = `visibility:visible;display:block;left:${mag_select_left - delta}px;top:${mag_select_top + half_height - delta}px;`
		handle_bottom_left_style = `visibility:visible;display:block;left:${mag_select_left - delta}px;top:${mag_select_top + mag_select_height - delta}px;`
		//
		handle_top_style = `visibility:visible;display:block;left:${mag_select_left + half_width - delta}px;top:${mag_select_top - delta}px;`
		handle_bottom_style = `visibility:visible;display:block;left:${mag_select_left + half_width - delta}px;top:${mag_select_top + mag_select_height - delta}px;`
		//
		handle_top_right_style = `visibility:visible;display:block;left:${mag_select_left + mag_select_width - delta}px;top:${mag_select_top - delta}px;`
		handle_right_style = `visibility:visible;display:block;left:${mag_select_left + mag_select_width - delta}px;top:${mag_select_top + half_height - delta}px;`
		handle_bottom_right_style = `visibility:visible;display:block;left:${mag_select_left + mag_select_width - delta}px;top:${mag_select_top + mag_select_height - delta}px;`
	}


	// 
	let rotator_center_left = 0		// fixed
	let rotator_center_top = 0
	let rotator_tracker_left = 0	// in motion
	let rotator_tracker_top = 0
	function selection_circular_positions() {
		//
		let [x1,y1,x2,y2] = [
			Math.min(rotator_tracker_left,rotator_center_left),
			Math.min(rotator_tracker_top,rotator_center_top),
			Math.max(rotator_tracker_left,rotator_center_left),
			Math.max(rotator_tracker_top,rotator_center_top)
		]
		// set globals
		select_left = x1
		select_top = y1
		select_width = (x2 - x1)
		select_height = (y2 - y1)

		//
		let mag_rt_left = rotator_tracker_left*magnification
		let mag_rt_top = rotator_tracker_top*magnification
		let mag_rc_left = rotator_center_left*magnification
		let mag_rc_top = rotator_center_top*magnification
		handle_rotator_style = `visibility:visible;display:block;left:${mag_rt_left}px;top:${mag_rt_top}px;`
		rotator_center_style = `visibility:visible;display:block;left:${mag_rc_left}px;top:${mag_rc_top}px;`

		selection_positions()
	}

	function fix_rotation_center(tracker,center_fixed,move_ref,center_ref) {
		//
		if ( can_draw_selected.shape === 'line' ) {
			let points = can_draw_selected.pars.points
			let lc_x = points[0] + doc_left
			let lc_y = points[1] + doc_top
			let move_ref_rect = { x :  move_ref.offsetLeft, y : move_ref.offsetTop, width: move_ref.offsetWidth, height: move_ref.offsetHeight}
			if ( !close_to_rect(move_ref_rect,lc_x,lc_y) ) {
				rotator_center_left = lc_x
				rotator_center_top = lc_y
				let x = move_ref.offsetLeft
				let y = move_ref.offsetTop
				x += move_ref.offsetWidth/2
				y += move_ref.offsetHeight/2
				let w = 10	// as defined
				let h = 10
				rotator_tracker_left = (x - w/2)
				rotator_tracker_top = (y - h/2)
				return
			}
			//
		}

		//
		{	// always based on the center ... so, the selection rect center or a handle center
			let x = center_ref.offsetLeft
			let y = center_ref.offsetTop
			x += center_ref.offsetWidth/2
			y += center_ref.offsetHeight/2
			let w = center_fixed.offsetWidth
			let h = center_fixed.offsetHeight
			rotator_center_left = (x - w)
			rotator_center_top = (y - h)
		}
		//
		{
			let x = move_ref.offsetLeft
			let y = move_ref.offsetTop
			x += move_ref.offsetWidth/2
			y += move_ref.offsetHeight/2
			let w = tracker.offsetWidth
			let h = tracker.offsetHeight
			rotator_tracker_left = (x - w/2)
			rotator_tracker_top = (y - h/2)
		}
		//
	}


	function set_selection_controls(sel) {
		if ( sel ) {
			selection_active = true && (shape_index !== false) && (shape_index >= 0)
			set_select_bounds()
			selection_positions()
		} else {
			selection_active = false
			selected_objects = false
			select_left = 0
			select_top = 0
			select_width = 0
			select_height = 0
			// rectangles
			selection_style = `visibility:hidden;display:none;left:0px;top:0px;width:1px;height:1px`
			selection_style += ";cursor:grabbing"
			handle_top_left_style = `visibility:hidden;display:none;left:0px;top:0px`
			handle_left_style = `visibility:hidden;display:none;left:0px;top:0px`
			handle_bottom_left_style = `visibility:hidden;display:none;left:0px;top:0px`
			//
			handle_top_style = `visibility:hidden;display:none;left:0px;top:0px`
			handle_bottom_style = `visibility:hidden;display:none;left:0px;top:0px`
			//
			handle_top_right_style = `visibility:hidden;display:none;left:0px;top:0px`
			handle_right_style = `visibility:hidden;display:none;left:0px;top:0px`
			handle_bottom_right_style = `visibility:hidden;display:none;left:0px;top:0px`

			// Rotator
			handle_rotator_style = `visibility:hidden;display:none;left:0px;top:0px`
			rotator_center_style = `visibility:hidden;display:none;left:0px;top:0px`

		}
	}


	let g_recovering_resize = false
	let g_previous_magnification = 1.0
	let g_recover_selection_mag_after_update = false
	async function magnification_recover() {
		g_recovering_resize = true
		//
		/*
		if ( selection_box.style.visibility === 'visible' ) {
			g_recover_selection_mag_after_update = [(select_left - doc_left),(select_top - doc_top),select_width,select_height]
			await tick()
		}
		*/
	}

	let pure_mouse = false
	$: {
		pure_mouse = Object.assign({},canvas_mouse)
		if ( canvas_changed ) {
			canvas_changed = false
			prev_doc_left = doc_left
			prev_doc_top = doc_top
			if ( g_recovering_resize ) {
				g_recovering_resize = false
				setTimeout(() => {
					if ( can_draw_selected ) {
						if ( can_draw_selected.shape === 'star' ) return
						selection_on = false
						let points = can_draw_selected.pars.points
						canvas_mouse.x = points[0]*magnification + 2
						canvas_mouse.y = points[1]*magnification + 2
						//
						let mock_evt = {
										target : selection_box,
										clientX : 0,
										clientY : 0
									}
						//
						start_tracking(mock_evt)
					}
				},20)
			}
		//}
		}
	}


	function is_text(tool) {
		return ( tool === "text" )
	}

	const gc_shape_list = [ 'ellipse', 'circle', 'polygon', 'star' ]
	function is_shape(tool) {
		if ( gc_shape_list.indexOf(tool) >= 0 ) {
			return true
		}
		return false
	}

	function is_line(a_shape) {
		if ( a_shape === "line" ) {
			return true
		}  // maybe for other line types as well
		return false
	}

	function is_component(tool) {
		if ( tool === "component" ) {
			return true
		}  // maybe for other line types as well
		return false
	}


	function is_connector(tool) {
		if ( tool === "connector" ) {
			return true
		}  // maybe for other line types as well
		return false
	}


	let abeyance = false

	/*
	event.ctrlKey && event.shiftKey && event.altKey	
	*/

	async function start_tracking(evt) {
		let shift_key = evt.shiftKey
		let alt_key = evt.altKey
		let ctrl_key = evt.ctrlKey

		group_selected = false

		turn_off_text()
		draw_control.command("deselect")
		if ( tool !== 'select' ) {
			draw_control.command("remove_top_if_empty_group",{})
		}
		await tick()
		if ( tool === 'rect'  ) {
			selection_on = false
			set_selection_controls(false)
			drawing = true
			draw_control.add("rect",{ "thick" : tool_parameters.parameters.thick, "line" : tool_parameters.parameters.line, "fill" : tool_parameters.parameters.fill, "points" : [mouse_x,mouse_y,2,2] })
			change_selection("select_top")
		} else if ( is_text(tool) ) {
			selection_on = false
			set_selection_controls(false)
			drawing = false
			tool_parameters.parameters.points = [mouse_x,mouse_y]
			position_text_box(mouse_x,mouse_y)
		} else if ( is_shape(tool) && ( tool_parameters !== false ) ) {
			selection_on = false
			set_selection_controls(false)
			drawing = true
			tool_parameters.parameters.points = [mouse_x,mouse_y,2,2]
			let pars = object_clone(tool_parameters.parameters)
			draw_control.add(tool_parameters.shape,pars)
			change_selection("select_top")
			//
		} else if ( !( tool === 'select' ) && is_line(shape) ) {
			selection_on = false
			set_selection_controls(false)
			drawing = true
			tool_parameters.parameters.points = [mouse_x,mouse_y,mouse_x+2,mouse_y+2]
			let pars = object_clone(tool_parameters.parameters)
			draw_control.add(tool_parameters.shape,pars)
			change_selection("select_top")
		} else if ( is_component(tool) ) {
			selection_on = false
			set_selection_controls(false)
			drawing = true
			let cpars = false
			if ( component_defaults ) {
				cpars = component_defaults.parameters
			} else {
				cpars = tool_parameters.parameters
			}
			draw_control.add("rect",{
				"role" : "component",
				"id" : gen_id(),
				"thick" : cpars.thick, 
				"line" : cpars.line, 
				"fill" : cpars.fill,
				"line_dash" : cpars.line_dash,
				"points" : [mouse_x,mouse_y,2,2] })
			change_selection("select_top")
		} else if ( is_connector(tool) ) {
			selection_on = false
			set_selection_controls(false)
			drawing = true
			draw_control.add("line",{
				"role" : "connector",
				"id" : gen_id(),
				"thick" : tool_parameters.parameters.thick, 
				"line" : tool_parameters.parameters.line, 
				"fill" : tool_parameters.parameters.fill,
				"points" : [mouse_x,mouse_y,2,2] })
			change_selection("select_top")
		} else if ( tool === 'select' ) {
			selection_on = !selection_on
			//
			let prev_shape_index = shape_index
			draw_control.searching({ "mouse_loc" : [canvas_mouse.x/magnification,canvas_mouse.y/magnification] })
			await tick()
			selection_changed = (prev_shape_index !== shape_index) || abeyance
			if ( selection_changed && (shape_index !== false) && (shape_index >= 0) ) {
				draw_control.command("remove_top_if_empty_group",{ 'except' : shape_index })
				await tick()
			}
			if ( (shape_index !== false) && (shape_index >= 0) ) {
				if ( can_draw_selected ) can_draw_selected.do_drawing_state = false // do this for all and catch the case required
				change_selection(shape_index)
				//
				if ( shape_index >= 0 ) {
					selection_on = true
				}
			} else {
				change_selection(false,prev_shape_index)
			}
			//
			if ( (shape_index !== false) && (shape_index >= 0) ) {
				let sel_bounds = can_draw_selected.bounds
				if ( sel_bounds !== undefined ) {
					prev_select_left = sel_bounds[0] + doc_left/magnification // relative to the canvas
					prev_select_top = sel_bounds[1] + doc_top/magnification
					prev_select_width = sel_bounds[2]
					prev_select_height = sel_bounds[3]
				}
				set_selection_controls(selection_on)
				if ( selection_on ) {
					if ( shift_key ) {	// alt_key  ctrl_key
						if ( (can_draw_selected.shape === "group") && (can_draw_selected.role === 'picker') ) {
							draw_control.command('search_selection_toggle',{
								"mouse_loc" : [canvas_mouse.x/magnification,canvas_mouse.y/magnification] 
							})
						} else if ( selection_changed ) {
							let in_selected = accrued_selections_list.indexOf(shape_index)
							if ( in_selected >= 0 ) {
								accrued_selections_list.splice(in_selected,1)
							} else {
								accrued_selections_list.push(shape_index)
								if ( prev_shape_index !== false ) {
									in_selected = accrued_selections_list.indexOf(prev_shape_index)
									if ( in_selected < 0 ) {
										accrued_selections_list.push(prev_shape_index)
									}
								}
							}
						}
						//draw_control.add("bounding_group",{ "thick" : 1, "line" : "rgba(1,1,1,5.0)", "fill" : "rgba(1,1,1,0.0)", "points" : [mouse_x,mouse_y,10,10], "role" : "picker", "selections" : accrued_selections_list })
					} else {
						accrued_selections_list = []
					}
					if ( accrued_selections_list.length <= 1 ) {
						let mock_evt = {
							target : selection_box,
							clientX : evt.clientX,
							clientY : evt.clientY
						}
						grab_selection(mock_evt)
					} else {
						console.log(accrued_selections_list)
					}	// // // // // // // // // 
				}
				if ( (can_draw_selected.shape === "group") && (can_draw_selected.role === 'picker') ) {
					group_selected = true
				}
				set_selection_controls(selection_on)
			} else {
				accrued_selections_list = []
				//
				draw_control.command("remove_top_if_empty_group",{})
				abeyance = false
				selection_on = false
				set_selection_controls(false)
				drawing = true
				group_selected = true
				draw_control.add("group",{ "thick" : 1, "line" : "rgba(1,1,1,5.0)", "fill" : "rgba(1,1,1,0.0)", "points" : [mouse_x,mouse_y,10,10], "role" : "picker" })
				change_selection("select_top")
				await tick()
				can_draw_selected.do_drawing_state = true
				//
				set_selection_controls(selection_on)
			}
		} 
	}

	async function stop_tracking(evt) {
		if ( drawing ) {
			await fetch_zlist()
			await capture_save_state()
		}
		drawing = false
	}


	let drag_selection = false
	let drag_region = false
	let selection_box = false


	let selection_mouse = {
		x : 0,
		y : 0
	}

	function grab_selection(evt) {
		drag_selection = true
		selection_mouse.x = evt.clientX
		selection_mouse.y = evt.clientY
	}


	let handle_rotator = false
	let rotator_center = false

	let handle_selected = false
	let grabbable_handle = false

	async function reposition(evt) {
		let option_key = evt.altKey
		//
		if ( drag_selection && selection_box && (evt.buttons == 1) ) {
			let new_x = evt.clientX
			let new_y = evt.clientY
			let dif_x = (new_x - selection_mouse.x)/magnification
			let dif_y = (new_y - selection_mouse.y)/magnification
			selection_mouse.x = new_x
			selection_mouse.y = new_y
			select_left += dif_x
			select_top += dif_y
			selection_positions()    // set style left, top, width, height
			save_selection_bounds()
			update_selected_object(dif_x,dif_y,true,true,false,option_key)
		} else if ( handle_selected && (grabbable_handle === handle_rotator) && (evt.buttons == 1) ) {
			// rotation
			let new_x = evt.clientX
			let new_y = evt.clientY
			let dif_x = (new_x - selection_mouse.x)/magnification
			let dif_y = (new_y - selection_mouse.y)/magnification
			selection_mouse.x = new_x
			selection_mouse.y = new_y
			grabbable_handle._added_size_changer(dif_x,dif_y)
			selection_circular_positions()    // set style left, top, width, height
			save_selection_bounds()
			circular_update_selected_object(dif_x,dif_y,true,true,grabbable_handle,option_key)
		} else if ( handle_selected && grabbable_handle && (evt.buttons == 1) ) {
			let new_x = evt.clientX
			let new_y = evt.clientY
			let dif_x = (new_x - selection_mouse.x)/magnification
			let dif_y = (new_y - selection_mouse.y)/magnification
			selection_mouse.x = new_x
			selection_mouse.y = new_y
			let [xtrue,ytrue] = grabbable_handle._added_size_changer(dif_x,dif_y)
			selection_positions()    // set style left, top, width, height
			save_selection_bounds()
			update_selected_object(dif_x,dif_y,xtrue,ytrue,grabbable_handle,option_key)
		}
		if ( evt.buttons === 0 ) {
			drag_selection = false
			handle_selected = false
			if ( catch_selection ) {
				catch_selection = false
				await fetch_zlist()
			}
		}
	}

	async function stop_drags(evt) {
		if ( drag_selection ) {
			drag_selection = false
			handle_selected = false
			if ( shape_index !== false && shape_index >= 0  ) {
				selection_style = `visibility:hidden;display:none;left:0px;top:0px;width:1px;height:1px`
				abeyance = true
			}
			await tick()
			if ( catch_selection ) {
				catch_selection = false
				await fetch_zlist()
			}
		}
		handle_rotator_style = `visibility:hidden;display:none;left:0px;top:0px`
		rotator_center_style = `visibility:hidden;display:none;left:0px;top:0px`
		//
		await capture_save_state()
	}


	function grab_handle(evt) {
		//
		let shift_key = evt.shiftKey
		if ( shift_key ) {
			console.log("SHIFT KEY")
			shift_key = (can_draw_selected.shape === 'line')
		}
		//
		handle_selected = true
		selection_mouse.x = evt.clientX
		selection_mouse.y = evt.clientY
		grabbable_handle = evt.target
		if ( shift_key ) {
			handle_rotator._added_size_changer = (dx,dy) => {
				rotator_tracker_left += dx
				rotator_tracker_top += dy
				return [true,true]
			}
		}
		//
		if ( handle_box_tl == grabbable_handle ) {
			if ( shift_key ) {
				grabbable_handle = handle_rotator
				fix_rotation_center(handle_rotator,rotator_center,handle_box_tl,handle_box_br)
			} else {
				handle_box_tl._added_size_changer = (dx,dy) => {
					let xchange = false
					let ychange = false
					if ( (select_width - dx) >= 0 ) {
						select_left += dx
						select_width -= dx
						xchange = true
					}
					if ( (select_height - dy) >= 0 ) {
						select_top += dy
						select_height -= dy
						ychange = true
					}
					return [xchange,ychange]
				}
			}
			return
		}
		if ( handle_box_top == grabbable_handle ) {
			if ( shift_key && false ) {			// later when doing full rotations...
				grabbable_handle = handle_rotator
				fix_rotation_center(handle_rotator,rotator_center,handle_box_top,selection_box)
			} else {
				handle_box_top._added_size_changer = (dx,dy) => {
					let xchange = false
					let ychange = false
					if ( (select_height - dy) >= 0 ) {
						select_top += dy
						select_height -= dy
						ychange = true
					}
					return [xchange,ychange]
				}
			}
		}
		if ( handle_box_bl == grabbable_handle ) {
			if ( shift_key ) {
				grabbable_handle = handle_rotator
				fix_rotation_center(handle_rotator,rotator_center,handle_box_bl,handle_box_tr)
			} else {
				handle_box_bl._added_size_changer = (dx,dy) => {
					let xchange = false
					let ychange = false
					if ( (select_width - dx) >= 0 ) {
						select_left += dx
						select_width -= dx
						xchange = true
					}
					if ( (select_height + dy) >= 0 ) {
						select_height += dy
						ychange = true
					}
					return [xchange,ychange]
				}
			}
		}
		if ( handle_box_left == grabbable_handle ) {
			if ( shift_key && false ) {
				grabbable_handle = handle_rotator
				fix_rotation_center(handle_rotator,rotator_center,handle_box_left,selection_box)
			} else {
				handle_box_left._added_size_changer = (dx,dy) => {
					let xchange = false
					let ychange = false
					if ( (select_width - dx) >= 0 ) {
						select_left += dx
						select_width -= dx
						xchange = true
					}
					return [xchange,ychange]
				}
			}
		}
		if ( handle_box_bottom == grabbable_handle ) {
			if ( shift_key && false ) {
				grabbable_handle = handle_rotator
				fix_rotation_center(handle_rotator,rotator_center,handle_box_bottom,selection_box)
			} else {
				handle_box_bottom._added_size_changer = (dx,dy) => {
					let xchange = false
					let ychange = false
					if ( (select_height + dy) >= 0 ) {
						select_height += dy
						ychange = true
					}
					return [xchange,ychange]
				}
			}
		}
		if ( handle_box_tr == grabbable_handle ) {
			if ( shift_key ) {
				grabbable_handle = handle_rotator
				fix_rotation_center(handle_rotator,rotator_center,handle_box_tr,handle_box_bl)
			} else {
				handle_box_tr._added_size_changer = (dx,dy) => {
					let xchange = false
					let ychange = false
					if ( (select_height - dy) >= 0 ) {
						select_top += dy
						select_height -= dy
						ychange = true
					}
					if ( (select_width + dx) >= 0 ) {
						select_width += dx
						xchange = true
					}
					return [xchange,ychange]
				}
			}
		}
		if ( handle_box_right == grabbable_handle ) {
			if ( shift_key && false ) {
				grabbable_handle = handle_rotator
				fix_rotation_center(handle_rotator,rotator_center,handle_box_right,selection_box)
			} else {
				handle_box_right._added_size_changer = (dx,dy) => {
					let xchange = false
					let ychange = false
					if ( (select_width + dx) >= 0 ) {
						select_width += dx
						xchange = true
					}
					return [xchange,ychange]
				}
			}
		}
		if ( handle_box_br == grabbable_handle ) {
			if ( shift_key ) {
				grabbable_handle = handle_rotator
				fix_rotation_center(handle_rotator,rotator_center,handle_box_br,handle_box_tl)
			} else {
				handle_box_br._added_size_changer = (dx,dy) => {
					let xchange = false
					let ychange = false
					if ( (select_width + dx) >= 0 ) {
						select_width += dx
						xchange = true
					}
					if ( (select_height + dy) >= 0 ) {
						select_height += dy
						ychange = true
					}
					return [xchange,ychange]
				}
			}
		}

	}


/*
    //
	//
	function reverse_stuff() {
		draw_control.command("reverse_redraw")		
	}

	function top_to_bottom() {
		draw_control.command("select_top")
		draw_control.command("send_bottom",{"select" : false})
	}

	function bottom_to_top() {
		draw_control.command("select_bottom")
		draw_control.command("send_top",{"select" : false})
	}

*/

</script>
<div bind:this={drag_region} on:mousedown={start_tracking} on:mouseup={stop_tracking} style="height:inherit;width:inherit" on:mousemove={reposition} on:mouseup={stop_drags}>
	<CanDraw bind:internal_draw={draw_cautious} bind:selected={can_draw_selected} bind:mouse_to_shape={shape_index} bind:secondary_shape={connector_index} bind:multi_select={multi_selected} bind:canvas_mouse={canvas_mouse}  bind:canvas_changed={canvas_changed} bind:z_list={z_list} {height} {width} {doc_left} {doc_top} {doc_width} {doc_height}  />
	<div bind:this={selection_box} class="selection-box" style={selection_style} on:mousedown|capture|preventDefault|stopPropagation={grab_selection} >&nbsp</div>
	<div bind:this={handle_box_tl} class="handle-box top-left-c" style={handle_top_left_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_top} class="handle-box top-c"  style={handle_top_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_bl} class="handle-box bottom-left-c" style={handle_bottom_left_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_left} class="handle-box left-c" style={handle_left_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_bottom} class="handle-box bottom-c" style={handle_bottom_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_tr} class="handle-box top-right-c" style={handle_top_right_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_right} class="handle-box right-c" style={handle_right_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_br} class="handle-box bottom-right-c" style={handle_bottom_right_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={text_box} class="text-box" style={text_box_style} >
		<input bind:this={text_box_field} type="text"  style={text_box_field_style} bind:value={text_value}  />
	</div>
	<div bind:this={handle_rotator} class="handle-box rotator-c" style={handle_rotator_style} on:mousedown|capture|preventDefault|stopPropagation={(evt) => {}} >&nbsp</div>
	<div bind:this={rotator_center} class="handle-box rotator-center-c" style={rotator_center_style} on:mousedown|capture|preventDefault|stopPropagation={(evt) => {}} >&nbsp</div>
</div>
<style>

	.top-left-c { cursor:nw-resize }
	.left-c {cursor:w-resize }
	.bottom-left-c {cursor:sw-resize }

	.top-c { cursor:n-resize }
	.bottom-c {cursor:s-resize }

	.top-right-c { cursor:ne-resize }
	.right-c {cursor:e-resize }
	.bottom-right-c {cursor:se-resize }


	.selection-box {
		position: absolute;
		border : dotted grey 1px;
		background-color: transparent;
	}

	.handle-box {
		position: absolute;
		border : solid black 1px;
		width: 5px;
		height: 5px;
		background-color: black;
	}

	.rotator-c  {
		position: absolute;
		width: 10px;
        height: 10px;
        text-align: center;
        vertical-align: middle;
        border-radius: 50%; /*magic to turn square into circle*/
        background: white;
        border: 2px solid #4286f4;
        box-sizing: border-box;
        position:absolute;
        cursor: nwse-resize;
	}

	.rotator-center-c {
		position: absolute;
		width: 10px;
        height: 10px;
        text-align: center;
        vertical-align: middle;
        border-radius: 50%; /*magic to turn square into circle*/
        background: rgb(253, 153, 3);
        border: 2px solid #ec0b0b;
        box-sizing: border-box;
        cursor: nwse-resize;
	}



	.text-box {
		position: absolute;
		border : solid rgba(228, 227, 227, 0.336) 2px;
		width: 150px;
		height: 60px;
		background-color: rgba(255, 255, 255, 0.267);

	}


</style>
