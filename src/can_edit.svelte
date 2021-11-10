<script>
    import CanDraw from "svelte-can-draw"
    import { draggable } from 'svelte-drag';

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

    let x_mag = 1.0
    let y_mag = 1.0


    //
    let can_draw_selected = false
    let shape_index = false

    let set_drawing = CanDraw.draw_model.set_drawing

    let draw_control
    let last_name = ""
    $: if ( draw_control && (last_name !== drawing_name) ) {
        last_name = drawing_name
        draw_control = set_drawing(drawing_name)
        draw_control.command("clear_all")
    }

    $: if ( draw_control ) {
        draw_control.command("set_grid",{"interval" : 50, "grid_on" : grid_on })
    }

    $: if ( draw_control ) {
        x_mag = magnification
        y_mag = magnification
        draw_control.command("scale_redraw",{"scale" : [x_mag,y_mag]})
    }

    $: if ( draw_control ) {
        draw_control.command("set_grid",{"interval" : grid_interval, "grid_on" : grid_on })			
	}

    //
/*
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


	function change_draw_selected() {
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

	function go_back() {
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

*/
</script>
<div>
	<CanDraw bind:selected={can_draw_selected} bind:mouse_to_shape={shape_index}  {height} {width} {doc_left} {doc_top} {doc_width} {doc_height}  />
</div>
<style>

</style>
