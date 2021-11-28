<script>

    import CanDraw from "svelte-can-draw"
	import { g_commander } from './edit_commands'
	import { tick,afterUpdate } from "svelte";

	import { parameter_publisher } from './param_updates'
	import { redo_list } from "./undo_redo"

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
	export let shape = "rect"

	export let selected_objects
	export let selection_changed

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


	function object_clone(obj) {
		let new_obj = JSON.parse(JSON.stringify(obj))
		return new_obj
	}


    g_commander.subscribe(async (command) => {
        //
        let cmd_pars = command.pars
		if ( command.command !== undefined  ) {
            let cmd = command.command
			//
			let target = can_draw_selected
			//
			if ( target  ) {
				switch ( cmd ) {
					case "clone" : {
						let c_shape = can_draw_selected.shape
						if ( c_shape === "group" )  {
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
						draw_control.command("remove_selected")
						await tick()
						set_selection_controls(false)
						await fetch_zlist()
						break;
					}
					case "to_top" : {
						draw_control.command("send_top",{ "select" : false })
						await fetch_zlist()
						break;
					}
					case "to_bottom" : {
						draw_control.command("send_bottom",{ "select" : false })
						await fetch_zlist()
						break;
					}
					case "undo_to" : {
						let ith = cmd_pars.offset
						redo_restore(ith)
						break;
					}
					case "redo_to" : {
						let ith = -cmd_pars.offset
						redo_restore(ith)
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
							let new_pars = Object.assign(can_draw_selected.pars,cmd_pars)
							draw_control.update(new_pars)
						}
						break;
					}
				}
			}
        }
    })


	async function parameters_update(pars) {
		draw_control.update(pars)
		await tick()
		parameter_publisher.command("update_selected",can_draw_selected)
	}



	async function group_parameters_update(pars,dif_x,dif_y) {
		if ( can_draw_selected ) {
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
			await fetch_zlist()
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


	let catch_selection = false
	let z_list = false
	async function fetch_zlist() {
		draw_control.z_list()
		await tick()
		if ( z_list ) {
			redo_list.push(z_list)
		}
	}

	async function redo_restore(ith) {
		let n = redo_list.size()
		if ( n > 0 ) {
			let a_z_list = redo_list.get(n - ith)
			if ( a_z_list ) {
				draw_control.command("z_list_replace",{ "z_list" : a_z_list })
			}
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
	$: if ( draw_control && canvas_mouse ) {
		mouse_x = (canvas_mouse.x/x_mag)
		mouse_y = (canvas_mouse.y/y_mag)
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
					let points = can_draw_selected.pars.points
					let new_left = mouse_x - points[0]
					let new_top = mouse_y - points[1]
					if ( new_left > 0 ) { points[2] = Math.sqrt(new_left*new_left + new_top*new_top) }
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
		if ( can_draw_selected ) {
			if ( can_draw_selected.shape === 'rect' || can_draw_selected.shape === 'group' ) {
				let points = can_draw_selected.pars.points
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
				let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
				if ( can_draw_selected.shape === 'group' ) {
					multi_selection(option_key)
				}
				if ( option_key && !diff_source && (can_draw_selected.shape === 'group') ) {
					group_parameters_update(new_pars,dx,dy)
				} else {
					parameters_update(new_pars)
				}
			} else if ( can_draw_selected.shape === 'line' ) {
				let points = can_draw_selected.pars.points
				if ( diff_source ) {
					let disposition = can_draw_selected.disposition
					if ( !disposition ) {
						disposition = calc_line_disposition(points)
						can_draw_selected.disposition = disposition
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

				let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
				parameters_update(new_pars)
			} else {
				if ( diff_source ) {
					let points = can_draw_selected.pars.points
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

					switch ( can_draw_selected.shape ) {
						case 'ellipse' : {
							if ( xchange ) points[2] = select_width/2
							if ( ychange ) points[3] = select_height/2
							break;
						}
						case 'star' : {
							if ( xchange|| ychange ) {
								let sw = dx/2
								let sh = dy/2
								points[2] = Math.sqrt(sw*sw + sh*sh)
							}
							break;
						}
						case 'polygon' : {
							if ( xchange|| ychange ) {
								let sw = dx
								let sh = dy
								let area_prior = can_draw_selected.bounds[2]*can_draw_selected.bounds[3]
								let sign = (select_width*select_height < area_prior) ? -1 : 1
								points[2] += sign*Math.sqrt(sw*sw + sh*sh)
							}
							break;
						}
						default: {
							break;
						}
					}
					let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
					parameters_update(new_pars)
				} else {
					let points = can_draw_selected.pars.points
					points[0] += dx
					points[1] += dy
					let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
					parameters_update(new_pars)
				}
			}
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

	function set_selection_controls(sel) {
		if ( sel ) {
			selection_active = true && (shape_index !== false) && (shape_index >= 0)
			set_select_bounds()
			selection_positions()
		} else {
			selection_active = false
			select_left = 0
			select_top = 0
			select_width = 0
			select_height = 0
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


	$: {
		if ( canvas_changed ) {
			canvas_changed = false
			prev_doc_left = doc_left
			prev_doc_top = doc_top
			if ( g_recovering_resize ) {
				g_recovering_resize = false
				setTimeout(() => {
					if ( can_draw_selected ) {
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


	let abeyance = false

	/*
	event.ctrlKey && event.shiftKey && event.altKey	
	*/

	async function start_tracking(evt) {
		let shift_key = evt.shiftKey
		let alt_key = evt.altKey
		let ctrl_key = evt.ctrlKey

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
				prev_select_left = sel_bounds[0] + doc_left/magnification // relative to the canvas
				prev_select_top = sel_bounds[1] + doc_top/magnification
				prev_select_width = sel_bounds[2]
				prev_select_height = sel_bounds[3]
				set_selection_controls(selection_on)
				if ( selection_on ) {
					if ( shift_key ) {    // alt_key  ctrl_key
						if ( can_draw_selected.shape === "group" && can_draw_selected.role === 'picker' ) {
							draw_control.command('search_selection_toggle',{ "mouse_loc" : [canvas_mouse.x/magnification,canvas_mouse.y/magnification] })
						}
					}
					let mock_evt = {
						target : selection_box,
						clientX : evt.clientX,
						clientY : evt.clientY
					}
					grab_selection(mock_evt)
				}
				set_selection_controls(selection_on)
			} else {
				draw_control.command("remove_top_if_empty_group",{})
				abeyance = false
				selection_on = false
				set_selection_controls(false)
				drawing = true
				draw_control.add("group",{ "thick" : 1, "line" : "rgba(1,1,1,5.0)", "fill" : "rgba(1,1,1,0.0)", "points" : [mouse_x,mouse_y,10,10], "role" : "picker" })
				change_selection("select_top")
				await tick()
				can_draw_selected.do_drawing_state = true

				set_selection_controls(selection_on)
			}
		} 
	}

	async function stop_tracking(evt) {
		if ( drawing ) {
			await fetch_zlist()
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


	let handle_selected = false
	let grabbable_handle = false

	async function reposition(evt) {
		if ( drag_selection && selection_box && (evt.buttons == 1) ) {
			let new_x = evt.clientX
			let new_y = evt.clientY
			let dif_x = (new_x - selection_mouse.x)/magnification
			let dif_y = (new_y - selection_mouse.y)/magnification
			selection_mouse.x = new_x
			selection_mouse.y = new_y
			select_left += dif_x
			select_top += dif_y
			selection_positions()
			save_selection_bounds()
			let option_key = evt.altKey
			update_selected_object(dif_x,dif_y,true,true,false,option_key)
		}
		if ( handle_selected && grabbable_handle && (evt.buttons == 1) ) {
			let new_x = evt.clientX
			let new_y = evt.clientY
			let dif_x = (new_x - selection_mouse.x)/magnification
			let dif_y = (new_y - selection_mouse.y)/magnification
			selection_mouse.x = new_x
			selection_mouse.y = new_y
			let [xtrue,ytrue] = grabbable_handle._added_size_changer(dif_x,dif_y)
			selection_positions()
			save_selection_bounds()
			update_selected_object(dif_x,dif_y,xtrue,ytrue,grabbable_handle,false)
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
	}


	function grab_handle(evt) {
		handle_selected = true
		selection_mouse.x = evt.clientX
		selection_mouse.y = evt.clientY
		grabbable_handle = evt.target
		if ( handle_box_tl == evt.target ) {
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
		if ( handle_box_top == evt.target ) {
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
		if ( handle_box_bl == evt.target ) {
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
		if ( handle_box_left == evt.target ) {
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
		if ( handle_box_bottom == evt.target ) {
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
		if ( handle_box_tr == evt.target ) {
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
		if ( handle_box_right == evt.target ) {
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
		if ( handle_box_br == evt.target ) {
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
	<CanDraw bind:selected={can_draw_selected} bind:mouse_to_shape={shape_index} bind:multi_select={multi_selected} bind:canvas_mouse={canvas_mouse}  bind:canvas_changed={canvas_changed} bind:z_list={z_list} {height} {width} {doc_left} {doc_top} {doc_width} {doc_height}  />
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

	.text-box {
		position: absolute;
		border : solid rgba(228, 227, 227, 0.336) 2px;
		width: 150px;
		height: 60px;
		background-color: rgba(255, 255, 255, 0.267);

	}


</style>
