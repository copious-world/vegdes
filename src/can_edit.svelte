<script>
    import CanDraw from "svelte-can-draw"
    import { draggable } from 'svelte-drag';
import { bind } from "svelte/internal";

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

	let selection_on = false
	let select_left = 0
	let select_top = 0
	let select_width = 0
	let select_height = 0

    let x_mag = 1.0
    let y_mag = 1.0


	let canvas_mouse
	let drawing = false

    //
    let can_draw_selected = false
    let shape_index = false

    let set_drawing = CanDraw.draw_model.set_drawing

    let draw_control
    let last_name = ""
    $: if ( !(draw_control) || (last_name !== drawing_name) ) {
        last_name = drawing_name
        draw_control = set_drawing(drawing_name)
        draw_control.command("clear_all")
    }

    $: if ( draw_control ) {
        x_mag = magnification
        y_mag = magnification
        draw_control.command("scale_redraw",{"scale" : [x_mag,y_mag]})
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
				let points = can_draw_selected.pars.points
				points[2] = mouse_x - points[0]
				points[3] = mouse_y - points[1]
				let new_pars = Object.assign(can_draw_selected.pars,{ 'points': points })
				draw_control.update(new_pars)
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


	let selection_style = `visibilty:hidden;display:none;left:0px;top:0px;width:1px;height:1px`
	let handle_top_left_style = `visibilty:hidden;display:none;left:0px;top:0px`
	let handle_left_style = `visibilty:hidden;display:none;left:0px;top:0px`
	let handle_bottom_left_style = `visibilty:hidden;display:none;left:0px;top:0px`
	//
	let handle_top_style = `visibilty:hidden;display:none;left:0px;top:0px`
	let handle_bottom_style = `visibilty:hidden;display:none;left:0px;top:0px`
	//
	let handle_top_right_style = `visibilty:hidden;display:none;left:0px;top:0px`
	let handle_right_style = `visibilty:hidden;display:none;left:0px;top:0px`
	let handle_bottom_right_style = `visibilty:hidden;display:none;left:0px;top:0px`

	let prev_select_left = 300
	let prev_select_top = 200
	let prev_select_width = 30
	let prev_select_height = 30

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

	function selection_positions() {
		let half_height = Math.floor(select_height/2)
		let half_width = Math.floor(select_width/2)
		let delta = 2
		selection_style = `visibilty:visible;display:block;left:${select_left}px;top:${select_top}px;width:${select_width}px;height:${select_height}px`
		selection_style += ";cursor:move"
		//grab_selection
		//
		handle_top_left_style = `visibilty:visible;display:block;left:${select_left - delta}px;top:${select_top - delta}px;`
		handle_left_style = `visibilty:visible;display:block;left:${select_left - delta}px;top:${select_top + half_height - delta}px;`
		handle_bottom_left_style = `visibilty:visible;display:block;left:${select_left - delta}px;top:${select_top + select_height - delta}px;`
		//
		handle_top_style = `visibilty:visible;display:block;left:${select_left + half_width - delta}px;top:${select_top - delta}px;`
		handle_bottom_style = `visibilty:visible;display:block;left:${select_left + half_width - delta}px;top:${select_top + select_height - delta}px;`
		//
		handle_top_right_style = `visibilty:visible;display:block;left:${select_left + select_width - delta}px;top:${select_top - delta}px;`
		handle_right_style = `visibilty:visible;display:block;left:${select_left + select_width - delta}px;top:${select_top + half_height- delta}px;`
		handle_bottom_right_style = `visibilty:visible;display:block;left:${select_left + select_width - delta}px;top:${select_top + select_height - delta}px;`
	}

	function set_selection_controls(sel) {
		if ( sel ) {
			set_select_bounds()
			selection_positions()
		} else {
			select_left = 0
			select_top = 0
			select_width = 0
			select_height = 0
			selection_style = `visibilty:hidden;display:none;left:0px;top:0px;width:1px;height:1px`
			selection_style += ";cursor:grabbing"
			handle_top_left_style = `visibilty:hidden;display:none;left:0px;top:0px`
			handle_left_style = `visibilty:hidden;display:none;left:0px;top:0px`
			handle_bottom_left_style = `visibilty:hidden;display:none;left:0px;top:0px`
			//
			handle_top_style = `visibilty:hidden;display:none;left:0px;top:0px`
			handle_bottom_style = `visibilty:hidden;display:none;left:0px;top:0px`
			//
			handle_top_right_style = `visibilty:hidden;display:none;left:0px;top:0px`
			handle_right_style = `visibilty:hidden;display:none;left:0px;top:0px`
			handle_bottom_right_style = `visibilty:hidden;display:none;left:0px;top:0px`
		}
	}


	function start_tracking(evt) {
		if ( tool === 'rect'  ) {
			selection_on = false
			set_selection_controls(false)
			drawing = true
			draw_control.add("rect",{ "thick" : 2, "line" : "black", "fill" : "rgba(100,200,220,0.9)", "points" : [mouse_x,mouse_y,2,2] })
			draw_control.command("select_top")
		} else if ( tool === 'select' ) {
			selection_on = !selection_on
			set_selection_controls(selection_on)
			if ( shape_index >= 0 ) {

			}
		} 
	}

	function stop_tracking(evt) {
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

	function reposition(evt) {
		if ( drag_selection && selection_box && (evt.buttons == 1) ) {
			let new_x = evt.clientX
			let new_y = evt.clientY
			let dif_x = new_x - selection_mouse.x
			let dif_y = new_y - selection_mouse.y
			selection_mouse.x = new_x
			selection_mouse.y = new_y
			select_left += dif_x
			select_top += dif_y
			selection_positions()
			save_selection_bounds()
		}
		if ( handle_selected && grabbable_handle && (evt.buttons == 1) ) {
			let new_x = evt.clientX
			let new_y = evt.clientY
			let dif_x = new_x - selection_mouse.x
			let dif_y = new_y - selection_mouse.y
			selection_mouse.x = new_x
			selection_mouse.y = new_y
			grabbable_handle._added_size_changer(dif_x,dif_y)
			selection_positions()
			save_selection_bounds()
		}
		if ( evt.buttons === 0 ) {
			drag_selection = false
			handle_selected = false
		}
	}

	function stop_drags(evt) {
		if ( drag_selection ) {
			drag_selection = false
			handle_selected = false
		}
	}


	let handle_box_tl = false
	let handle_box_top = false
	let handle_box_bl = false
	let handle_box_left = false
	let handle_box_bottom = false
	let handle_box_tr = false
	let handle_box_right = false
	let handle_box_br = false

	function grab_handle(evt) {
		handle_selected = true
		selection_mouse.x = evt.clientX
		selection_mouse.y = evt.clientY
		grabbable_handle = evt.target
		if ( handle_box_tl == evt.target ) {
			handle_box_tl._added_size_changer = (dx,dy) => {
				select_left += dx
				select_top += dy
				select_width -= dx
				select_height -= dy
			}
		}
		if ( handle_box_top == evt.target ) {
			handle_box_top._added_size_changer = (dx,dy) => {
				select_top += dy
				select_height -= dy
			}
		}
		if ( handle_box_bl == evt.target ) {
			handle_box_bl._added_size_changer = (dx,dy) => {
				select_left += dx
				select_width -= dx
				select_height += dy
			}
		}
		if ( handle_box_left == evt.target ) {
			handle_box_left._added_size_changer = (dx,dy) => {
				select_left += dx
				select_width -= dx
			}
		}
		if ( handle_box_bottom == evt.target ) {
			handle_box_bottom._added_size_changer = (dx,dy) => {
				select_height += dy
			}
		}
		if ( handle_box_tr == evt.target ) {
			handle_box_tr._added_size_changer = (dx,dy) => {
				select_top += dy
				select_width += dx
				select_height -= dy
			}
		}
		if ( handle_box_right == evt.target ) {
			handle_box_right._added_size_changer = (dx,dy) => {
				select_width += dx
			}
		}
		if ( handle_box_br == evt.target ) {
			handle_box_br._added_size_changer = (dx,dy) => {
				select_width += dx
				select_height += dy
			}
		}

	}

/*
    //
    //
	let can_draw_selected = false
	let shape_index = -1

	function draw_stuff() {
		draw_control.command("clear_all")
		draw_control.add("rect",{ "thick" : 2, "line" : "black", "fill" : "rgba(100,200,220,0.9)", "points" : [10,10,20,20] })
		draw_control.add("circle",{ "thick" : 3, "line" : "red", "fill" : "rgba(200,200,120,0.6)", "points" : [50,50,60] })
		draw_control.add("ellipse",{ "thick" : 2, "line" : "blue", "fill" : "rgba(100,200,120,0.8)", "points" : [100,80,40,70,(Math.PI/4)] })
		draw_control.add("line",{ "thick" : 4, "line" : "black", "fill" : "rgba(100,50,50,0.9)", "points" : [30,30,100,200] })
		draw_control.add("polygon",{ "thick" : 3, "line" : "black", "fill" : "rgba(5,100,20,0.9)", "points" : [220,90,90], "sides" : 7 })
		draw_control.add("star",{ "thick" : 4, "line" : "navy", "fill" : "yellow", "points" : [90,220,90], "star_points" : 5, 
												"orient" : "edge", "radial_shift" : 0, "radius_multiplier" : 4 })

		draw_control.add("text",{ "thick" : 2, "line" : "black", "fill" : "rgba(220,100,20,0.7)", "points" : [200,250], 
									"text" : "Testing one and all", "font":  "bold 32px Arial",
									"textAlign" : "center", "textBaseline" : "middle"
								})

	}

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


	function move_draw_selected() {
		draw_control.command("select_top")
		if ( can_draw_selected ) {
			let count = 0
			let Intrvl = setInterval(() => {
				count++
				if ( count == 50 ) {
					clearInterval(Intrvl)
				}
				let points = can_draw_selected.pars.points
				points[0] += 2
				points[1] += 2
				let new_parse = Object.assign(can_draw_selected.pars,{ 'points': points })
				draw_control.update(new_parse)
			},5)
		}
	}

	function move_back() {
		draw_control.command("select_top")
		if ( can_draw_selected ) {
			let count = 0
			let Intrvl = setInterval(() => {
				count++
				if ( count == 50 ) {
					clearInterval(Intrvl)
				}
				let points = can_draw_selected.pars.points
				points[0] -= 2
				points[1] -= 2
				let new_parse = Object.assign(can_draw_selected.pars,{ 'points': points })
				draw_control.update(new_parse)
			},5)
		}
	}

	function find_shape() {
		draw_control.searching({ "mouse_loc" : [15,15] })
	}

	let funny_toggle = false
	let sel_object_type = ""
	function resize_found() {
		draw_control.searching({ "mouse_loc" : [15,15] })
		if ( (shape_index !== false) && (shape_index >= 0) ) {
			draw_control.command("select",{"select" : shape_index})
			if ( can_draw_selected ) {
				sel_object_type = can_draw_selected.cmd
				let count = 0
				funny_toggle = !funny_toggle
				let Intrvl = setInterval(() => {
					count++
					if ( count == 50 ) {
						clearInterval(Intrvl)
					}
					let points = can_draw_selected.pars.points
					if ( funny_toggle ) {
						points[2] += 2
						points[3] += 2
					} else {
						points[2] -= 2
						points[3] -= 2
					}
					let new_parse = Object.assign(can_draw_selected.pars,{ 'points': points })
					draw_control.update(new_parse)
				},5)
			}
		}
	}


	let scaley_toggle = false
	function scale_drawing() {
		scaley_toggle = !scaley_toggle
		if ( scaley_toggle ) {
			draw_control.command("scale_redraw",{"scale" : [1.3,1.3]})
		} else {
			draw_control.command("scale_redraw",{"scale" : [1.0,1.0]})
		}
	}

    let grid_toggle = false
	function toggle_grid() {
		if ( grid_toggle ) {
			draw_control.command("set_grid",{"interval" : grid_interval, "grid_on" : true })			
		} else {
			draw_control.command("set_grid",{"interval" : grid_interval, "grid_on" : false })			
		}
	}

	on:mousedown={start_tracking} on:mousemove={handleMousemove} on:mouseup={stop_tracking}
	//

	 ? "visibilty:visible;display:block" : "visibilty:hidden;display:none"
*/

</script>
<div bind:this={drag_region} on:mousedown={start_tracking} on:mouseup={stop_tracking} style="height:inherit;width:inherit" on:mousemove={reposition} on:mouseup={stop_drags}>
	<CanDraw bind:selected={can_draw_selected} bind:mouse_to_shape={shape_index} bind:canvas_mouse={canvas_mouse}  {height} {width} {doc_left} {doc_top} {doc_width} {doc_height}  />
	<div bind:this={selection_box} class="selection-box" style={selection_style} on:mousedown|capture|preventDefault|stopPropagation={grab_selection} >&nbsp</div>
	<div bind:this={handle_box_tl} class="handle-box top-left-c" style={handle_top_left_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_top} class="handle-box top-c"  style={handle_top_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_bl} class="handle-box bottom-left-c" style={handle_bottom_left_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_left} class="handle-box left-c" style={handle_left_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_bottom} class="handle-box bottom-c" style={handle_bottom_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_tr} class="handle-box top-right-c" style={handle_top_right_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_right} class="handle-box right-c" style={handle_right_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
	<div bind:this={handle_box_br} class="handle-box bottom-right-c" style={handle_bottom_right_style} on:mousedown|capture|preventDefault|stopPropagation={grab_handle} >&nbsp</div>
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
		border : solid grey 1px;
		background-color: transparent;
	}

	.handle-box {
		position: absolute;
		border : solid black 1px;
		width: 5px;
		height: 5px;
		background-color: black;
	}

</style>
