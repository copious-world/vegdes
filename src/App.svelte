<script>
	import BurgerMenu from 'svelte-burger-menu';
	import {HsvPicker} from 'svelte-color-picker';
	import FloatWindow from 'svelte-float-window';
	import { popup_size } from '../utils/display-utils.js'
	import Ruler from './ruler.svelte'
	import Modal from './modal.svelte'
	import { onMount,tick } from 'svelte';

	import ManageProject from './dialogs/project-manage.svelte'
	import OpenProject from './dialogs/project-open.svelte'
	import SaveProject from './dialogs/project-save.svelte'

	import ImportSVG from './dialogs/svg-import.svelte'
	import ExportSVG from './dialogs/svg-export.svelte'
	import SaveSVG from './dialogs/svg-save.svelte'
	import DocProps from './dialogs/doc-properties.svelte'
	import EditPrefs from './dialogs/editor-preferences.svelte'
	//
	import ConnectorEditor from './windows/connectors.svelte'
	import ComponentEditor from './windows/components.svelte'

	import {db_startup, db_store} from '../utils/db-utils'

	import CanEdit from './can_edit.svelte'
	import { commander, g_commander } from './edit_commands'
	import { g_select_parameters } from './param_updates'

	// https://github.com/agrinko/js-undo-manager
	// https://github.com/dnass/svelte-canvas

// https://github.com/kaisermann/svelte-loadable
// https://javascript.info/modules-dynamic-imports
// https://stackoverflow.com/questions/56431848/dynamically-loading-component-using-import-or-fetch
// https://dev.to/chrsjxn/building-a-blog-with-svelte-dynamic-imports-for-svelte-components-5hlp

// https://dev.opera.com/articles/html5-canvas-painting/
// https://jsfiddle.net/richardcwc/cvem3wuv/
// https://www.tutorialrepublic.com/html-tutorial/html5-canvas.php
// https://github.com/ericdrowell/concrete
// https://www.sciencedirect.com/science/article/pii/B9781483214481500184

	let project_selected = false
	let g_db_store = null
	let g_exportable = false
	db_store.subscribe((db_obj) => {
		if ( !db_obj ) {
			project_selected = false
			g_db_store = null
			g_exportable = false
		} else {
			g_db_store = db_obj
			project_selected = db_obj.ready
			g_exportable = db_obj.current_file_entry ? db_obj.current_file_entry.name : false
			if ( g_exportable === undefined || g_exportable === null ) g_exportable = false
		}
	})


	let window_scale = { "w" : 0.4, "h" : 0.6 }
	const INTERVAL_ruler = 50
	//
	window_scale = popup_size()
	let all_window_scales = []
	all_window_scales.push(window_scale)
	all_window_scales.push(window_scale)
	all_window_scales.push(window_scale)
	all_window_scales.push(window_scale)
	all_window_scales.push(window_scale)
	//
	onMount(async () => {
		//
		await db_startup()  // return value ??
		//
		window.addEventListener("resize", (e) => {
			//
			let scale = popup_size()
			//
			window_scale.h = scale.h; 
			window_scale.w = scale.w;
			//
		})
	})



	let g_canvas_element
	let g_canvas_container
	let g_canvas_system
	let g_show_grid = false

	let g_doc_width = 640
	let g_doc_height = 480
	let g_doc_left = 100;
	let g_doc_top = 100;

	let g_calc_container_width = 2*g_doc_width
	let g_calc_container_height = 2*g_doc_height


	let g_calc_doc_width = g_doc_width
	let g_calc_doc_height = g_doc_height

	let g_regular_shape = false

	let edit_mode = 'panel'
	let prev_edit_mode = edit_mode
	let show_on_panel = false
	let show_on_design = false
	let show_on_causal = false


	let g_current_selection_object = false
	let g_component_defaults = {
			"shape" : "component",
			"tool"  : "component",
			"parameters" : {
				"thick" : 3, 
				"line_dash" : [2, 1, 1, 1, 1, 2],
				"line" : "rgba(0,0,0,1.0)", 
				"fill" : "rgba(170,170,170,0.75)"
			}
		}
	
	let g_transition_defaults = {
		'width' : 8,
		'height' : 28
	}


	let magnification = 100
	let calc_magnification = magnification/100.0
	let magnifications = [
		{ value : 400, text :"400%" },
		{ value : 200, text :"200%" },
		{ value : 100, text :"100%" },
		{ value : 50, text :"50%" },
		{ value : 25, text :"25%" },
		{ value : -1, text :"fit to canvas" },
		{ value : -2, text :"fit to selection" },
		{ value : -3, text :"fit to layer content" },
		{ value : -4, text :"fit to all" },
	]

	let ruler_magnification = magnification/100
	let h_zero_tick = 0
	let v_zero_tick = 0

	setTimeout(set_magnification,100)

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

	let g_current_parameters = false

	let edit_props = {
		'height' : 460,
		'width' : 680,
		'doc_height' : 460,
		'doc_width' : 680,
		'doc_left' : 0,
		'doc_top' : 0,
		'drawing_name' : (g_db_store.current_file_entry ? g_db_store.current_file_entry.name : "Untitled-1"),
		'grid_on' : false,
		'magnification' : 1.0,
		'ruler_interval' : 50,
		'tool' : "select",
		'tool_parameters' : g_current_parameters,
		'component_defaults' : g_component_defaults,
		'transition_defaults' : g_transition_defaults,
		'shape' : 'rect'
	}


	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	//
	function set_magnification(evt) {
		if ( magnification > 0 ) {
			if ( g_canvas_system ) {
				//
				calc_magnification = magnification/100;
				ruler_magnification = calc_magnification
				g_calc_doc_width = g_doc_width*calc_magnification
				g_calc_doc_height = g_doc_height*calc_magnification
				//
				let system_rect = g_canvas_system.getBoundingClientRect()

				let w = system_rect.width
				let h = system_rect.height
				if ( g_calc_doc_width <= w ) {
					g_calc_container_width = (w + 100)	// putting a default mat around everything allowing some small degree of scrolling
				} else if ( g_calc_doc_width > w ) {
					g_calc_container_width = g_calc_doc_width + 10	// putting a default mat around everything allowing some small degree of scrolling
				}
				if ( g_calc_doc_height <= h ) {
					g_calc_container_height = (h + 100)	// putting a default mat around everything allowing some small degree of scrolling
				} else if ( g_calc_doc_height > h ) {
					g_calc_container_height = g_calc_doc_height + 10 
				}

				setTimeout(() => {
					g_doc_left = Math.floor(g_calc_container_width/2) - Math.floor(g_calc_doc_width/2)
					g_doc_top = Math.floor(g_calc_container_height/2) - Math.floor(g_calc_doc_height/2)
					v_zero_tick = g_doc_top
					h_zero_tick = g_doc_left
					if ( g_show_grid && g_canvas_element ) {
						// draw_grid_on_canvas(g_canvas_element,calc_magnification)
					}
				},20)

			}

		} else {
			// TBD
		}
	}

	let selection_mode = true
	let free_mode = false
	let g_free_mode = false
	let tool_cursor = "default"
	let g_current_tool = "select"
	let g_current_shape = "rect"

	let g_selected_component = false
	let g_selected_connector = false


	$: if ( edit_mode !== prev_edit_mode ) {
		prev_edit_mode = edit_mode
		commander.command("mode",{ "mode" : edit_mode })
	}

	$: edit_props = {
		'width' : g_calc_doc_width,
		'height' : g_calc_doc_height,
		'doc_width' : g_calc_doc_width,
		'doc_height' : g_calc_doc_height,
		'doc_left' : g_doc_left,
		'doc_top' : g_doc_top,
		'drawing_name' : "Untitled-1",
		'grid_on' : g_show_grid,
		'magnification' : calc_magnification,
		'ruler_interval' : INTERVAL_ruler,
		'tool' : g_current_tool,
		'tool_parameters' : g_current_parameters,
		'component_defaults' : g_component_defaults,
		'transition_defaults' : g_transition_defaults,
		'shape' : g_current_shape 
	}


	let g_selection_changed = false
	async function reset_free_mode() {
		await tick()
		free_mode = true
	}
	$: {

		free_mode = false
		if ( (g_current_selection_object !== false ) 
				&& (['component','connector'].indexOf(g_current_selection_object.role) < 0)   ) {
			g_selected_component = false
			g_selected_connector = false
		} else if ( g_current_selection_object === false ) {
			g_selected_component = false
			g_selected_connector = false
		}

		if (( g_current_selection_object !== false ) && g_selection_changed ) {
			//
			g_current_shape = g_current_selection_object.shape
			set_selection_mode(g_current_tool)
			reset_free_mode()

			// id of selected object
			//id_selected = g_current_selection_object.id ? g_current_selection_object.id : id_selected

			if ( (g_current_selection_object.role !== undefined) && (g_current_selection_object.role) ) {
				if ( g_current_selection_object.role === 'component' ) {
					g_selected_component = g_current_selection_object
					g_selected_connector = false
				} else if ( g_current_selection_object.role === 'connector'  ) {
					g_selected_connector = g_current_selection_object
					g_selected_component = false
				} else {
					g_selected_component = false
					g_selected_connector = false
				}
			} else {
				g_selected_component = false
				g_selected_connector = false
			}
			//
		}
	}

	let rect_selected = true
	let text_selected = false
	let path_selected = false
	let circle_selected = false
	let ellipse_selected = false
	let line_selected = false
	let polygon_selected = false
	let star_selected = false
	let picture_selected = false
	let component_selected = false
	let transition_selected = false
	let eye_dropper_selected = false
	let connector_selected = false
	let group_selected = false
	let ungroup_selected = false
	let curve_selected = false

	let grouping_reference = "selected objects"
	let grouping_references = ["selected objects","largest object", "smallest object", "page"]

	let path_segment_style = "curve"
	let path_segment_styles = ["straight", "curve"]

	//
	let mode_toggle = 'select'
	let g_selector = false
	$: g_selector = (mode_toggle !== 'select') || ( g_current_selection_object !== false )
	$: g_free_mode = free_mode


	function set_selection_mode(mode_name) {
		rect_selected = false
		text_selected = false
		path_selected = false
		circle_selected = false
		ellipse_selected = false
		line_selected = false
		polygon_selected = false
		star_selected = false
		picture_selected = false
		component_selected = false
		transition_selected = false
		eye_dropper_selected = false
		connector_selected = false
		// group_selected = false
		ungroup_selected = false
		curve_selected = false
		//
		mode_toggle = mode_name
		g_current_tool = mode_name
		g_current_shape = tool_to_shape(g_current_tool)
		switch ( mode_name ) {
			case 'select': {
				selection_mode = false
				g_current_shape = ( g_current_selection_object ) ? g_current_selection_object.shape : false
				if ( g_current_selection_object.role === 'component' ) {
					g_current_shape = 'component'
				}
				if ( g_current_selection_object.role === 'connector' ) {
					g_current_shape = 'connector'
				}
				tool_cursor = "default"
				break
			}
			case 'zoom': {
				selection_mode = false
				tool_cursor = "zoom-in"
				break
			}
			case 'pencil': {
				selection_mode = true
				line_selected = true
				tool_cursor = `url(./zondicons/edit-pencil.svg), auto`
				break
			}
			case 'pen':
			case 'path': {
				selection_mode = true
				path_selected = true
				tool_cursor = `url(./zondicons/pen-tool.svg), auto`
				break
			}
			case 'rect': {
				selection_mode = true
				rect_selected = true
				tool_cursor = "default"
				tool_cursor = `url(./images/rect-tool.svg), auto`
				break
			}
			case 'ellipse': {
				selection_mode = true
				if ( g_regular_shape ) {
					circle_selected = true
				} else {
					ellipse_selected = false
				}
				circle_selected = true
				tool_cursor = `url(./images/ellipse-tool.svg), auto`
				break
			}
			case 'polygon': {
				selection_mode = true
				polygon_selected = true
				tool_cursor = `url(./images/polygon-tool.svg), auto`
				break
			}
			case 'star': {
				selection_mode = true
				star_selected = true
				tool_cursor = "default"
				tool_cursor = `url(./images/star-tool.svg), auto`
				break
			}
			case 'text': {
				selection_mode = true
				text_selected = true
				tool_cursor = "text"
				break
			}
			case 'component': {
				selection_mode = true
				component_selected = true
				tool_cursor = `url(./images/component-tool.svg), auto`
				break
			}
			case 'transition': {
				selection_mode = true
				transition_selected = true
				tool_cursor = `url(./images/transition-tool.svg), auto`
				break
			}
			case 'eye_dropper': {
				selection_mode = false
				eye_dropper_selected = true
				tool_cursor = `url(./images/eye_dropper-cursor.svg), auto`
				break
			}
			case 'connector': {
				selection_mode = true
				connector_selected = true
				tool_cursor = `url(./zondicons/share.svg), auto`
				break
			}
			default: {
				g_current_tool = "select"
				break
			}
		}
	}

	let id_selected = ""
	let class_selected = ""

	let colorizer_top = "90px"
	let colorizer_left = "90px"

	let object_x = 0.0
	let object_y = 0.0
	let object_width = 0.0
	let object_height = 0.0
	//
	let object_x1 = 0.0
	let object_y1 = 0.0
	let object_x2 = 0.0
	let object_y2 = 0.0
	//
	let object_cx = 0.0
	let object_cy = 0.0
	let object_r = 0.0
	let object_rx = 0.0
	let object_ry = 0.0


	let object_points = 3
	let object_sides = 3
	let object_pointiness = 1
	let object_radial_shift = 1
	let object_orient = "edge"
	let object_radius_multiplier = 1

	let object_rotate = 0.0
	let object_corner = 0.0

	let object_text_bold = false
	let object_text_italic = false
	let object_text_font = "Serif"
	let object_text_align = "left"
	let object_text_align_left = true
	let object_text_align_center = false
	let object_text_align_right = false
	let object_text_size = 32

	let object_spline = false
	let object_curve = "bezier"  // "quadratic"

	let object_cp1 = { "x" : 0, "y" : 0}
	let object_cp2 = { "x" : 0, "y" : 0}
	//
	//
	let object_stroke = "rgba(0,0,0,1.0)"
	let object_fill = "rgba(100,200,220,0.9)"
	let object_line_thick = 2
	let object_line_dash = []


	g_select_parameters.subscribe(async (command) => {
		let cmd = command.command
		let selected = command.pars
		switch ( cmd ) {
			case "selected" : {
				shape_values_to_fields(selected.shape,selected.pars)
				break;
			}
			case "update_selected": {
				shape_values_to_fields(selected.shape,selected.pars)
			}
			default : {

			}
		}
	})


	$: {
		object_text_align = object_text_align_left ? "left" : ( object_text_align_center ? "center" : "right")
	}

	let object_text = "this is a test"

	let object_text_fonts = [
		{ value : 1, text :"Serif" },
		{ value : 2, text :"Sans-serif" },
		{ value : 3, text :"Cursive" },
		{ value : 4, text :"Fantasy" },
		{ value : 5, text :"Monospace" },
		{ value : 6, text :"Courier" },
		{ value : 7, text :"Helvtica" },
		{ value : 8, text :"Times" }
	]

	let g_generalized_parameters = {}

	$: g_generalized_parameters = {
		'object_x': object_x,
		'object_y': object_y,
		'object_width': object_width,
		'object_height': object_height,
		//
		'object_x1': object_x1,
		'object_y1': object_y1,
		'object_x2': object_x2,
		'object_y2': object_y2,
		//
		'object_cx': object_cx,
		'object_cy': object_cy,
		'object_r': object_r,
		'object_rx': object_rx,
		'object_ry': object_ry,

		'object_line_thick' : object_line_thick,
		'object_line_dash' : object_line_dash,

		'object_points': object_points,
		'object_sides': object_sides,
		'object_pointiness': object_pointiness,
		'object_radial_shift': object_radial_shift,
		'object_radius_multiplier' : object_radius_multiplier,
		//
		'object_rotate': object_rotate,
		'object_corner': object_corner,

		'object_text_bold': object_text_bold,
		'object_text_italic': object_text_bold,
		'object_text_font': object_text_font,
		'object_align' : object_text_align,
		'object_text' : object_text
	}

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	//
	//
	let text_names = ["x", "y", "bold", "italic", "font", "align-left", "align-center", "align-right","font-size"]
	let rect_names = ["x", "y", "w", "h", "corner"]
	let circle_names = ["cx", "cy", "r"]
	let ellipse_names = ["cx", "cy", "rx", "ry"]
	let line_names = ["x1", "y1", "x2", "y2"]
	let connector_names = ["x1", "y1", "x2", "y2"]
	let path_names = ["x", "y"]
	let polygon_names = ["x", "y", "rx", "ry", "sides"]
	let star_names = ["x", "y", "r", "points", "pointiness", "radial-shift", "radius-multiplier"]
	let component_names = ["x", "y", "w", "h"]
	let transition_names = ["x", "y"]
	let group_names = ["x", "y", "group", "relative", "align-left", "align-center", "align-right", "align-top", "align-middle", "align-bottom"]
	let grouped_names = ["x", "y", "label", "ungroup" ]
	let curve_names = ["x1", "y1", "x2", "y2", "curve", "clone-node", "delete-node", "subpath", "add-subpath" ]
	//
	let bezier_names = ["x1", "y1", "x2", "y2", ]
	let quadratic_names = ["x1", "y1", "x2", "y2" ]

	let free_mode_vars = {
		"rect" : rect_names,
		"ellipse" : ellipse_names,
		"polygon" : polygon_names,
		"line" : line_names,
		"star" : star_names,
		"text" : text_names,
		"component" : component_names,
		"transition" : transition_names,
		"connector" : connector_names,
		"path" : path_names,
		"bezier" : curve_names,
		"quadratic" : quadratic_names
	}


	function set_rect_fields(pars) {
		let points = pars.points
		object_x = points[0]
		object_y = points[1]
		object_width = points[2]
		object_height = points[3]
		//"corner"
	}
	function set_ellipse_fields(pars,regular) {
		let points = pars.points
		object_cx = points[0]
		object_cy = points[1]
		if ( regular ) {
			object_r = points[2]
		} else {
			object_rx = points[2]
			object_ry = points[3]
		}
	}
	function set_line_fields(pars) {
		let points = pars.points
		object_x1 = points[0]
		object_y1 = points[1]
		object_x2 = points[2]
		object_y2 = points[3]
	}
	function set_polygon_fields(pars,regular) {
		let points = pars.points
		object_x = points[0]
		object_y = points[1]
		object_rx = points[2]
		object_ry = points[3]
		object_sides = pars.sides
	}
	function set_star_fields(pars) {
		let points = pars.points
		object_x = points[0]
		object_y = points[1]
		object_r = points[2]
		object_points = pars.star_points
		object_radial_shift = pars.radial_shift
		object_pointiness = pars.pointiness
		object_radius_multiplier = pars.radius_multiplier
		object_radial_shift = pars.radial_shift
	}
	function set_text_fields(pars) {
	}
	function set_component_fields(pars) {
	}
	function set_path_fields(pars) {
	}
	function set_bezier_fields(pars) {
	}
	function set_quadratic_fields(pars) {
	}


	function shape_values_to_fields(shape,pars) {
		if ( !pars ) return
		if ( pars.id ) {
			id_selected = pars.id
		} else {
			id_selected = ""
		}
		if ( shape !== 'group' ) {
			update_color_selections(pars)			
		}
		switch ( shape ) {
			case "rect" : { set_rect_fields(pars); break;}
			case "ellipse" : { set_ellipse_fields(pars); break;}
			case "circle" : { set_ellipse_fields(pars,true); break;}
			case "line" : { set_line_fields(pars); break;}
			case "polygon" : { set_polygon_fields(pars); break;}
			case "star" : { set_star_fields(pars); break;}
			case "text" : { set_text_fields(pars); break;}
			case "component" : { set_component_fields(pars); break;}
			case "path" : { set_path_fields(pars); break;}
			case "bezier" : { set_bezier_fields(pars); break;}
			case "quadratic" : { set_quadratic_fields(pars); break;}
		}
	}

	function selection_mode_var(var_name) {
		//
		if ( (selection_mode || free_mode || g_current_shape) && (var_name == "rotate") ) return true

		if ( var_name === 'component-properties' ) {
			if ( g_current_shape === 'component' ) return true
		}
		if ( var_name === 'connector-properties' ) {
			if ( g_current_shape === 'connector' ) return true
		}

		if ( free_mode ) {
			//console.log("selection_mode_var " + g_current_shape)
			if ( free_mode_vars[g_current_shape] ) {
				if ( free_mode_vars[g_current_shape].indexOf(var_name) >= 0 ) return true
			}
		}

		if ( circle_selected && circle_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( ellipse_selected && ellipse_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( line_selected && line_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( connector_selected && connector_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( rect_selected && rect_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( text_selected && text_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( path_selected && path_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( group_selected && group_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( ungroup_selected && grouped_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( curve_selected && curve_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( polygon_selected && polygon_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( star_selected && star_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( component_selected  && component_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( transition_selected  && transition_names.indexOf(var_name) >= 0 ) {
			return true
		}
		return false
	}


	function is_pure_shape() {
		if ( g_current_shape ) {
			if ( ( g_current_selection_object.role !== 'component' ) && ( g_current_selection_object.role !== 'connector' ) ) {
				return true
			}
		}
		return false
	}

	function tool_to_shape(tool) { 
		switch ( tool ) {
			case "ellipse" : {
				if ( g_regular_shape ) {
					return "circle"
				} else return "ellipse"
			}
			case "rect" : {
				if ( g_regular_shape ) {
					return "rect" //"square"
				} else return "rect"
			}
			case "pencil": {
				if ( g_regular_shape ) {
					return "line" //"square"
				} else {
					return "line" //"square"
//					return "path"
				}
			}
			case "pen": {
				if ( g_regular_shape ) {
					return "line" //"square"
				} else {
					object_spline = true
					if ( object_curve === "bezier" ) {
						return "bezier"
					} else {
						return "quadratic"
					}
				}
			}
			/*
			case "connector": {
				return "line"
			}
			*/
			case "path": {
				if ( g_regular_shape ) {
					return "line" //"square"
				} else {
					if ( object_curve === "bezier" ) {
						return "bezier"
					} else {
						return "quadratic"
					}
				}
			}
			default: {
				return tool
			}
		}
	}


	// // shape_to_points_array
	function shape_to_points_array(shape) {
		let points = []
		switch ( shape ) {
			case "circle" : {
				points.push(g_generalized_parameters[`object_${circle_names[0]}`])
				points.push(g_generalized_parameters[`object_${circle_names[1]}`])
				points.push(g_generalized_parameters[`object_${circle_names[2]}`])
				break
			}
			case "ellipse" : {
				points.push(g_generalized_parameters[`object_${ellipse_names[0]}`])
				points.push(g_generalized_parameters[`object_${ellipse_names[1]}`])
				points.push(g_generalized_parameters[`object_${ellipse_names[2]}`])
				points.push(g_generalized_parameters[`object_${ellipse_names[3]}`])
				break
			}
			case "line" : {
				points.push(g_generalized_parameters[`object_${line_names[0]}`])
				points.push(g_generalized_parameters[`object_${line_names[1]}`])
				points.push(g_generalized_parameters[`object_${line_names[2]}`])
				points.push(g_generalized_parameters[`object_${line_names[3]}`])
				break
			}
			case "polygon": {
				points.push(g_generalized_parameters[`object_${polygon_names[0]}`])
				points.push(g_generalized_parameters[`object_${polygon_names[1]}`])
				points.push(g_generalized_parameters[`object_${polygon_names[2]}`])
				points.push(g_generalized_parameters[`object_${polygon_names[3]}`])
				break
			}
			case "star" : {
				points.push(g_generalized_parameters[`object_${star_names[0]}`])
				points.push(g_generalized_parameters[`object_${star_names[1]}`])
				points.push(g_generalized_parameters[`object_${star_names[2]}`])
			}
			case "text" : {
				points.push(g_generalized_parameters[`object_${text_names[0]}`])
				points.push(g_generalized_parameters[`object_${text_names[1]}`])
			}
			case "bezier" : {
				points.push(g_generalized_parameters[`object_${bezier_names[0]}`])
				points.push(g_generalized_parameters[`object_${bezier_names[1]}`])
				points.push(g_generalized_parameters[`object_${bezier_names[2]}`])
				points.push(g_generalized_parameters[`object_${bezier_names[3]}`])
				break;
			}
			case "quadratic" : {
				points.push(g_generalized_parameters[`object_${quadratic_names[0]}`])
				points.push(g_generalized_parameters[`object_${quadratic_names[1]}`])
				points.push(g_generalized_parameters[`object_${quadratic_names[2]}`])
				points.push(g_generalized_parameters[`object_${quadratic_names[3]}`])
				break;
			}
		}
		return points
	}

	function add_shape_extras(shape,parameters) {
		switch ( shape ) {
			case "star" : {
				parameters.radial_shift = object_radial_shift
				parameters.orient = "edge"
				parameters.radial_shift = object_radial_shift
				parameters.radius_multiplier = object_radius_multiplier  // ??
				parameters.pointiness = object_pointiness
				parameters.star_points = object_points
				break;
			}
			case "polygon": {
				parameters.sides = object_sides
				break;
			}
			case "bezier" : {
				parameters.control_points = [object_cp1.x,object_cp1.y,object_cp2.x,object_cp2.y]
				break;
			}
			case "quadratic" : {
				parameters.control_points = [object_cp1.x,object_cp1.y]
				break;
			}
			case "text" : {
				parameters.text = object_text
				parameters.textAlign = g_generalized_parameters.object_text_align
				parameters.textBaseline = "middle"
				let font_bold = object_text_bold ? "bold" : ""
				let font_italic = object_text_italic ? "italic" : ""
				parameters.font = `${font_bold} ${font_italic} ${object_text_size}px ${object_text_font}`
				parameters.style = "plain"  // italic
				break;
			}
			default: {
				break;
			}
		}
	}
/*
	let object_text_bold = false
	let object_text_italic = false
	let object_text_font = "Serif"
	let object_text_align = "left"
*/

	$: {
		let shape = tool_to_shape(g_current_tool)
		if ( shape !== 'select' ) {
			let points_array = shape_to_points_array(shape)
			let rotation = undefined
			if ( Math.abs(object_rotate) > 0.0005 ) {
				rotation = object_rotate
			}
			g_current_parameters = {
				"shape" : shape,
				"tool"  : g_current_tool,
				"parameters" : {
					"thick" : object_line_thick, 
					"line_dash" : object_line_dash,
					"line" : object_stroke, 
					"fill" : object_fill, 
					"points" : points_array,
					"rotate" : rotation
				}
			}
			add_shape_extras(shape,g_current_parameters.parameters)
		}
	}


	$: {
		let and_also_panel = false
		let and_also_design = false
		let and_also_causal =  false
		//
		if ( g_current_selection_object && g_current_selection_object.included_views ) {
			and_also_panel = g_current_selection_object.included_views['panel']
			and_also_design = g_current_selection_object.included_views['design']
			and_also_causal = g_current_selection_object.included_views['causal']
		} else {
			show_on_panel = false
			show_on_design = false
			show_on_causal = false
		}

		if ( edit_mode === 'panel' ) {
			show_on_panel = true
			show_on_design = and_also_design
			show_on_causal = and_also_causal
		}
		if ( edit_mode === 'design' ) {
			show_on_design = true
			show_on_panel = and_also_panel			
			show_on_causal = and_also_causal
		}
		if ( edit_mode === 'causal' ) {
			show_on_causal = true
			show_on_panel = and_also_panel			
			show_on_design = and_also_design
		}
	}


	async function toggle_panel_view(evt) {
		let checked = evt.target.checked
		if ( g_current_selection_object ) {
			if ( g_current_selection_object.included_views === undefined ) {
				g_current_selection_object.included_views = {}
			}
			g_current_selection_object.included_views['panel'] = checked
			await tick()
			if ( edit_mode !== 'panel' ) {
				commander.command("update_view_exposure",{ "descriptor" : g_current_selection_object, "mode" : "panel", "include" : checked })
			}
		}
	}
	async function toggle_design_view(evt) {
		let checked = evt.target.checked
		if ( g_current_selection_object ) {
			if ( g_current_selection_object.included_views === undefined ) {
				g_current_selection_object.included_views = {}
			}
			g_current_selection_object.included_views['design'] = checked
			await tick()
			if ( edit_mode !== 'design' ) {
				commander.command("update_view_exposure",{ "descriptor" : g_current_selection_object, "mode" : "design", "include" : checked })
			}
		}
	}
	async function toggle_causal_view(evt) {
		let checked = evt.target.checked
		if ( g_current_selection_object ) {
			if ( g_current_selection_object.included_views === undefined ) {
				g_current_selection_object.included_views = {}
			}
			g_current_selection_object.included_views['causal'] = checked
			await tick()
			if ( edit_mode !== 'causal' ) {
				commander.command("update_view_exposure",{ "descriptor" : g_current_selection_object, "mode" : "causal", "include" : checked })
			}
		}
	}

/*
let object_text_bold = false
let object_text_italic = false
let object_text_font = "Serif"
let object_text_align = "left"  // object_align
let object_text_align_left = true
let object_text_align_center = false
let object_text_align_right = false
let object_text_size = 32
*/

	let tmp_val = ""
	let tmp_sel_obj = false
	let id_timeout = null
	async function update_id(evt) {
		tmp_val = id_selected
		tmp_sel_obj = g_current_selection_object
		if ( id_timeout !== null ) {
			clearTimeout(id_timeout)
		}
		id_timeout = setTimeout(() => {
			let old_id = tmp_sel_obj.pars.id
			tmp_sel_obj.pars.id = tmp_val
			tmp_sel_obj.id = tmp_val
			if ( tmp_sel_obj.role === "connector" ) {
				commander.command("update_connector_id",{ "old_id" : old_id, "new_id" : tmp_val })
			}
		},2000)
	}


	function update_points(p_name) {
		if ( g_current_selection_object !== false ) {
			let points = g_current_selection_object.pars.points
			switch ( p_name ) {
				case "x" : { points[0] = object_x; break }
				case "y" : { points[1] = object_y; break }
				case "w" : { points[2] = object_width; break }
				case "h" : { points[3] = object_height; break }
				case "x1" : { points[0] = object_x1; break }
				case "y1" : { points[1] = object_y1; break }
				case "x2" : { points[2] = object_x2; break }
				case "y2" : { points[3] = object_y2; break }
				case "cx" : { points[0] = object_cx; break }
				case "cy" : { points[1] = object_cy; break }
				case "r" : { points[2] = object_r; break }
				case "rx" : { points[2] = object_rx; break }
				case "ry" : { points[3] = object_rx; break }
			}
			
			commander.command("update_parameter",{ "points" : points })
		}
	}


	function update_thick(ev) {
		parameter_change("thick","object_line_thick")
		commander.command("update_parameter",{ "thick": object_line_thick } )
	}

	function update_sides(ev) {
		add_shape_extras('polygon',g_current_parameters.parameters)
		commander.command("update_parameter",{ "sides": object_sides } )
	}

	function update_star_points(ev) {
		add_shape_extras('star',g_current_parameters.parameters)
		commander.command("update_parameter",{ 
			"star_points": object_points, 
			"pointiness" : object_pointiness,
			"radial_shift" : object_radial_shift,
			"radius_multiplier" : object_radius_multiplier
		} )
	}

	let font_bold_selected = "black"
	let font_italic_selected = "black"
	//

	async function toggle_bold(ev) {
		object_text_bold = !object_text_bold
		await tick()
		change_font(ev)
	}
	async function toggle_italic(ev) {
		object_text_italic = !object_text_italic
		await tick()
		change_font(ev)
	}

	$: {
		font_bold_selected = `border: solid 2px ${object_text_bold ? "gold" : "black"}` 
		font_italic_selected = `border: solid 2px ${object_text_italic ? "gold" : "black"}`
	}

	async function do_align_left(ev) {
		object_text_align_left = !object_text_align_left
		object_text_align_center =  !object_text_align_left
		object_text_align_right =  !object_text_align_left
	}
	async function do_align_center(ev) {
		object_text_align_center = !object_text_align_center
		object_text_align_left =  !object_text_align_center
		object_text_align_right =  !object_text_align_center
	}
	async function do_align_right(ev) {
		object_text_align_right = !object_text_align_right
		object_text_align_left =  !object_text_align_right
		object_text_align_center =  !object_text_align_right
	}
	//

	let align_left_selected = ""
	let align_center_selected = ""
	let align_right_selected = ""
	//
	$: {
		align_left_selected = `border: solid 2px ${object_text_align_left ? "gold" : "black"}` 
		align_center_selected = `border: solid 2px ${object_text_align_center ? "gold" : "black"}`
		align_right_selected = `border: solid 2px ${object_text_align_right ? "gold" : "black"}`
	}


	//
	async function change_font(ev) {
		parameter_change("object_text_font","font")
		//
		if ( g_current_selection_object !== false ) {
			if ( g_current_selection_object.shape === 'text' ) {
				let font_bold = object_text_bold ? "bold" : ""
				let font_italic = object_text_italic ? "italic" : ""
				commander.command("update_parameter",{ "font": `${font_bold} ${font_italic} ${object_text_size}px ${object_text_font}` } )
			}
		}
	}

	async function parameter_change(parameter_name,cur_pname) {
		g_current_parameters.parameters[cur_pname] = g_generalized_parameters[parameter_name]
		await tick()
	}

	//
	let show_hide_grid = "Show"
	let show_hide_wireframe = "Show"


	let fill_color = "#00FFFF"
	let fill_color_inverted = "#FF0000"

	let stroke_color = "#00FFFF"
	let stroke_color_inverted = "#FF0000"

	let alpha_value_fill = 100;
	let alpha_value_line = 100;

	let picker_starter_stroke = object_stroke
	let picker_starter_fill = object_fill

	$: {
		picker_starter_stroke = object_stroke
		picker_starter_fill = object_fill
	}

	let guass_blur_level = 0;
	function  blurry_changed(event) {
		let blurry = event.target
		let blr = parseInt(blurry.value)
		if ( blr > 100 ) blurry.value = "100"
		if ( blr < 0 ) blurry.value = "0"
		guass_blur_level = parseInt(blurry.value)
	}

	function update_color_selections(pars) {
		if ( !pars ) return
		let line_c = pars.line
		let fill_c = pars.fill
		//
		stroke_color = line_c 
		fill_color = fill_c
		object_stroke = line_c
		object_fill = fill_c
		//
		picker_starter_fill = object_fill
		picker_starter_stroke = object_stroke
	}


	let is_viz_fill = "hidden"
	let is_viz_stroke = "hidden"


	function colorCallback_fill(rgba) {
		let color_spec = rgba.detail
		let a = color_spec.a
		let b = color_spec.b
		let g = color_spec.g
		let r = color_spec.r
		fill_color = `rgb(${r},${g},${b})`
		fill_color_inverted = `rgb(${255-r},${255-g},${255-b})`
		object_fill = `rgba(${r},${g},${b},${a})`
		if ( g_current_selection_object !== false ) {
			commander.command("colorize",{ "fill" : object_fill } )
		}
		//
	}



	function colorCallback_stroke(rgba) {
		let color_spec = rgba.detail
		let a = color_spec.a
		let b = color_spec.b
		let g = color_spec.g
		let r = color_spec.r
		stroke_color = `rgb(${r},${g},${b})`
		stroke_color_inverted = `rgb(${255-r},${255-g},${255-b})`
		object_stroke = `rgba(${r},${g},${b},${a})`
		if ( g_current_selection_object !== false ) {
			commander.command("colorize",{ "line" : object_stroke } )
		}
	}


	function show_picker(evt,fill_or_stroke) {
		if ( fill_or_stroke ) {
			is_viz_stroke = "hidden"
			is_viz_fill = (is_viz_fill === "hidden") ? "visible" : "hidden"
		} else {
			is_viz_fill = "hidden"
			is_viz_stroke = (is_viz_stroke === "hidden") ? "visible" : "hidden"
		}
		let clicker = evt.target
		picker_starter_fill = object_fill
		picker_starter_stroke = object_stroke
		if ( clicker ) {
			let clicker_rect = clicker.getBoundingClientRect()
			let top = clicker_rect.top - 300
			let left = clicker_rect.left
			colorizer_top = `${top}px`
			colorizer_left = `${left}px`
		}
	}

	function show_picker_fill(evt) {
		show_picker(evt,true)
	}
	function show_picker_stroke(evt) {
		show_picker(evt,false)
	}


	let ruler_left = 0
	let ruler_top = 0


	function scroll_rulers(evt) {
		let target = evt.target
		let top_s_y = target.scrollTop
		let left_s_x = target.scrollLeft
		//
		ruler_top = top_s_y
		ruler_left = left_s_x
	}

	// ---- ---- ---- ---- ---- ---- ---- ----
	// ---- ---- ---- ---- ---- ---- ---- ----

	let g_visibile_items = {
		"project_manage" : false,
		"project_open" : false,
		"project_save" : false,
		"svg_import" : false,
		"svg_export" : false,
		"svg_save" : false,
		"doc_properties" : false,
		"editor_prefs" : false,
	}

	let g_which_open_modal = "none"


	function handle_modal_close(evt) {
		let result = evt.detail.type
		g_visibile_items[g_which_open_modal] = false
		g_which_open_modal = "none"
	}

	function toggle_dialog(dialog_title) {

		let [species,cmd] = dialog_title.split('-')

		switch ( species ) {
			case "project" : {
				switch ( cmd ) {
					case "new" : {
						g_visibile_items.project_manage = true
						g_which_open_modal = "project_manage"
						break;
					}
					case "open" : {
						g_visibile_items.project_open = true
						g_which_open_modal = "project_open"
						break;
					}
					case "save" : {
						g_visibile_items.project_save = true
						g_which_open_modal = "project_save"
						break;
					}
					default : {
						break;
					}
				}
				break;
			}
			case "svg" : {
				switch ( cmd ) {
					case "import" : {
						g_visibile_items.svg_import = true
						g_which_open_modal = "svg_import"
						break;
					}
					case "export" : {
						g_visibile_items.svg_export = true
						g_which_open_modal = "svg_export"
						break;
					}
					case "save" : {
						g_visibile_items.svg_save = true
						g_which_open_modal = "svg_save"
						break;
					}
					default : {
						break;
					}
				}
				break;
			}
			case "doc" : {  // "doc-properties"
				g_visibile_items.doc_properties = true
				g_which_open_modal = "doc_properties"
				break;
			}
			case "editor" : { // "editor-prefs"
				g_visibile_items.editor_prefs = true
				g_which_open_modal = "editor_prefs"
				break;
			}
			default: {
				break;
			}
		}

	}


	function toggle_float(float_name) {

		switch ( float_name ) {
			case "library-view" : {
				start_floating_window(0);
				break;
			}
			case "svg-edit" : {
				start_floating_window(1);
				break;
			}
			case "layers-manager" : {
				start_floating_window(2);
				break;
			}
			case "component-editor" : {
				start_floating_window(3);
				break
			}
			case "connection-editor" : {
				start_floating_window(4);
				break
			}
			default: {
				break;
			}
		}

	}

	function do_clone_selected(ev) {
		commander.command("clone",{ "offset_x" : 10, "offset_y" : 10})
	}

	function do_remove_selected(ev) {
		commander.command("delete",{})
	}

	function do_move_top_selected(ev) {
		commander.command("to_top",{})
	}

	function do_move_bottom_selected(ev) {
		commander.command("to_bottom",{})
	}


	//
	function do_undo(ev) {
		commander.command("undo_to",{ "offset" : 1 })
	}

	//
	function do_redo(ev) {
		commander.command("redo_to",{ "offset" : 1 })		
	}





	function toggle_grid(evt) {
		g_show_grid = !g_show_grid
		/*
		if ( g_show_grid && g_canvas_element ) {
			draw_grid_on_canvas(g_canvas_element,calc_magnification)	
		} else if ( g_canvas_element ) {
			clear_grid_from_canvas(g_canvas_element,calc_magnification)	
		}
		*/
	}

	function toggle_wireframe(evt) {
		
	}



</script>

<div class="left-panel" >
<div class="v-spacer"></div>
<div class="v-left-menu">
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'select'); set_selection_mode('select') } } >
		<img class="v-left-menu-item"  src="./images/select.svg" alt="select" title="select" />
	</div>
	{#if (edit_mode === 'panel') } 
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'pencil'); set_selection_mode('pencil') } } >
		<img class="v-left-menu-item"  src="./images/pencil.svg" alt="pencil" title="pencil" />
	</div>
	{/if}
	{#if (edit_mode === 'panel') } 
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'pen'); set_selection_mode('pen') } } >
		<img class="v-left-menu-item"  src="./images/pen.svg" alt="pen" title="pen" />
	</div>
	{/if}
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'path'); set_selection_mode('path') } }  >
		<img class="v-left-menu-item"  src="./images/path.svg" alt="path" title="path" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'rect'); set_selection_mode('rect') } } >
		<img class="v-left-menu-item"  src="./images/rect.svg" alt="rect" title="rect" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'ellipse'); set_selection_mode('ellipse') } } >
		<img class="v-left-menu-item"  src="./images/ellipse.svg" alt="ellipse" title="ellipse" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'polygon'); set_selection_mode('polygon') } } >
		<img class="v-left-menu-item"  src="./images/polygon.svg" alt="polygon" title="polygon" />
	</div>
	{#if (edit_mode === 'panel') } 
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'star'); set_selection_mode('star') } } >
		<img class="v-left-menu-item"  src="./images/star.svg" alt="star" title="postarlygon" />
	</div>
	{/if}
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'text'); set_selection_mode('text') } } >
		<img class="v-left-menu-item"  src="./images/text.svg" alt="text" title="text" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'component'); set_selection_mode('component') } } >
		<img class="v-left-menu-item"  src="./images/gears.svg" alt="component" title="component" />
	</div>
	{#if (edit_mode === 'causal') } 
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'transition'); set_selection_mode('transition') } } >
		<img class="v-left-menu-item"  src="./images/transition.svg" alt="transition" title="transition" />
	</div>
	{/if}
	{#if (edit_mode !== 'panel') } 
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'connector'); set_selection_mode('connector') } } >
		<img class="v-left-menu-item"  src="./images/conn.svg" alt="connector" title="connector" />
	</div>
	{/if}
	<div class="v-left-menu-button mode-button">
		Mode<br>
		<label class="mode-label" for="panel">panel</label>
		<input type='radio' name="mode" bind:group={edit_mode} value="panel">
		<label class="mode-label" for="design">design</label>
		<input type='radio' name="mode" bind:group={edit_mode} value="design">
		<label class="mode-label" for="causal">causal</label>
		<input type='radio' name="mode"bind:group={edit_mode}  value="causal">
	</div>
	<div class="v-left-menu-button mode-button">
	{edit_mode}
	</div>

</div>
</div>


<div class="top-panel">
	<div class="bottom-menu-button"  on:click={do_undo} >
		<img class="bottom-menu-item"  src="./images/undo.svg" alt="undo" title="undo" />
	</div>
	<div class="bottom-menu-button"  on:click={do_redo} >
		<img class="v-left-menu-item"  src="./images/redo.svg" alt="redo" title="redo" />
	</div>
	<span style="color:white">|</span>
	<div class="bottom-menu-button" on:click={do_clone_selected} >
		<img class="v-left-menu-item"  src="./images/clone.svg" alt="clone" title="clone" />
	</div>
	<div class="bottom-menu-button" on:click={do_remove_selected} >
		<img class="v-left-menu-item"  src="./images/delete.svg" alt="delete" title="delete" />
	</div>
	<span style="color:white">|</span>
	<div class="bottom-menu-button" on:click={do_move_top_selected} >
		<img class="v-left-menu-item"  src="./images/move_top.svg" alt="move front" title="move to front" />
	</div>
	<div class="bottom-menu-button" on:click={do_move_bottom_selected} >
		<img class="v-left-menu-item"  src="./images/move_bottom.svg" alt="move back" title="move to back" />
	</div>
	<div class="bottom-menu-button" >
		<img class="v-left-menu-item"  src="./images/globe_link.svg" alt="add link" title="globe_link" />
	</div>
	<span style="color:white">|</span>

	{#if (selection_mode || g_free_mode) }
		<span class="top-text" >id:</span><input type=text  class="bottom-input"  bind:value={id_selected} on:keyup={update_id} />
		<span class="top-text" >class:</span><input type=text  class="bottom-input" bind:value={class_selected} />
	{/if}

	<span style="color:white">|</span>

	{#if (selection_mode || g_free_mode) && selection_mode_var('rotate') }
		<div class="bottom-menu-button" >
			<img class="bottom-menu-item"  src="./images/angle.svg" alt="rotation" title="rotation" />
		</div>
		<input type=number  class="top-input"  bind:value={object_rotate} />
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('x') }
		<span class="top-text" >x:</span><input type=number  class="top-input"  bind:value={object_x} on:change={(ev) => { update_points("x") }} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('y') }
		<span class="top-text" >y:</span><input type=number  class="top-input"  bind:value={object_y} on:change={(ev) => { update_points("y") }} />
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('h') }
		<span class="top-text" >h:</span><input type=number  class="top-input"  bind:value={object_height} on:change={(ev) => { update_points("h") }} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('w') }
		<span class="top-text" >w:</span><input type=number  class="top-input"  bind:value={object_width} on:change={(ev) => { update_points("w") }} />
	{/if}

	<!-- lines -->
	{#if (g_selector || g_free_mode) && selection_mode_var('x1') }
		<span class="top-text" >x1:</span><input type=number  class="top-input"  bind:value={object_x1} on:change={(ev) => { update_points("x1") }} />
	{/if}
	{#if (g_selector || free_mode) && selection_mode_var('y1') }
		<span class="top-text" >y1:</span><input type=number  class="top-input"  bind:value={object_y1} on:change={(ev) => { update_points("y1") }} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('x2') }
		<span class="top-text" >x2:</span><input type=number  class="top-input"  bind:value={object_x2} on:change={(ev) => { update_points("x2") }} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('y2') }
		<span class="top-text" >y2:</span><input type=number  class="top-input"  bind:value={object_y2} on:change={(ev) => { update_points("y2") }} />
	{/if}
	
	<!-- circles -->
	{#if (g_selector || g_free_mode) && selection_mode_var('cx') }
		<span class="top-text" >cx:</span><input type=number  class="top-input"  bind:value={object_cx} on:change={(ev) => { update_points("cx") }} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('cy') }
		<span class="top-text" >cy:</span><input type=number  class="top-input"  bind:value={object_cy} on:change={(ev) => { update_points("cy") }} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('r') }
		<span class="top-text" >R:</span><input type=number  class="top-input"  bind:value={object_r} on:change={(ev) => { update_points("r") }} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('rx') }
		<span class="top-text" >rx:</span><input type=number  class="top-input"  bind:value={object_rx} on:change={(ev) => { update_points("rx") }} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('ry') }
		<span class="top-text" >ry:</span><input type=number  class="top-input"  bind:value={object_ry} on:change={(ev) => { update_points("ry") }} />
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('group') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/group_elements.svg" alt="form group" title="form group" />
		</div>
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('ungroup') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/ungroup.svg" alt="ungroup" title="ungroup" />
		</div>
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('relative') }
		<span class="top-text" >anchor:</span>
		<div class="bottom-menu-button" style="vertical-align:bottom">
			<select bind:value={grouping_reference} style="height:25px;font-size:70%" >
				{#each grouping_references as a_ref}
					<option value={a_ref}>
						{a_ref}
					</option>
				{/each}
			</select>
		</div>
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('corner') }
		<div class="bottom-menu-button" >
			<img class="bottom-menu-item"  src="./images/c_radius.svg" alt="corner" title="corner" />
		</div>
		<input type=number  class="top-input"  bind:value={object_corner} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('bold') }
		<div class="bottom-menu-button big_pict" style={font_bold_selected} on:click={toggle_bold} >
			<img class="bottom-menu-item big_pict"  src="./images/bold.svg" alt="bold" title="bold" />
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('italic') }
		<div class="bottom-menu-button big_pict" style={font_italic_selected} on:click={toggle_italic} >
			<img class="bottom-menu-item big_pict"  src="./images/italic.svg" alt="italic" title="italic" />
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('font') }
		<span class="top-text" >font:</span>
		<div class="bottom-menu-button" style="vertical-align:bottom">
			<select bind:value={object_text_font} style="height:25px;font-size:70%" on:change={change_font} >
				{#each object_text_fonts as a_font}
					<option value={a_font.text}>
						{a_font.text}
					</option>
				{/each}
			</select>
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('align-left') }
		<div class="bottom-menu-button big_pict" style={align_left_selected}  >
			<img class="v-left-menu-item big_pict"  src="./images/align_left.svg" alt="align left" title="align left" on:click={do_align_left} />
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('align-center') }
		<div class="bottom-menu-button big_pict" style={align_center_selected} >
			<img class="v-left-menu-item big_pict"  src="./images/align_center.svg" alt="align center" title="align center" on:click={do_align_center} />
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('align-right') }
		<div class="bottom-menu-button big_pict" style={align_right_selected} >
			<img class="v-left-menu-item big_pict"  src="./images/align_right.svg" alt="align right" title="align right" on:click={do_align_right} />
		</div>
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('font-size') }
	<input type=number class="bottom-input" min='9' max='64' bind:value={object_text_size} on:change={change_font} />
	<div class="bottom-menu-button big_pict" >
		<input type=range  class="top-input" min='9' max='64' bind:value={object_text_size} on:change={change_font} />
	</div>
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('align-top') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/align_top.svg" alt="align top" title="align top" />
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('align-middle') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/align_middle.svg" alt="align middle" title="align middle" />
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('align-bottom') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/align_bottom.svg" alt="align bottom" title="align bottom" />
		</div>
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('curve') }
		<span class="top-text" >font:</span>
		<div class="bottom-menu-button" style="vertical-align:bottom">
			<select bind:value={path_segment_style} style="height:25px;font-size:70%" >
				{#each path_segment_styles as a_seg_style}
					<option value={a_seg_style}>
						{a_seg_style}
					</option>
				{/each}
			</select>
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('clone-node') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/node_clone.svg" alt="clone node" title="clone node" />
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('delete-node') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/node_delete.svg" alt="delete node" title="delete node" />
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('subpath') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/path.svg" alt="open/close subpath" title="open/close subpath" />
		</div>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('add-subpath') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/tool_add_subpath.svg" alt="add subpath" title="add subpath" />
		</div>
	{/if}

	{#if (g_selector || g_free_mode) && selection_mode_var('points') }
		<span class="top-text" >points:</span><input type=number  class="top-input"  bind:value={object_points} on:change={update_star_points}/>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('sides') }
		<span class="top-text" >sides:</span><input type=number  class="top-input"  bind:value={object_sides} on:change={update_sides} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('pointiness') }
		<span class="top-text" >pointiness:</span><input type=number  class="top-input"  bind:value={object_pointiness} on:change={update_star_points} />
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('radial-shift') }
		<span class="top-text" >radial shift:</span><input type=number  class="top-input"  bind:value={object_radial_shift} on:change={update_star_points}/>
	{/if}

</div>


<div class="bottom-panel">
	<div class="bottom-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'zoom'); set_selection_mode('zoom') } }>
		<img class="bottom-menu-item"  src="./images/zoom.svg" alt="select" title="zoom" />
	</div>
	<select bind:value={magnification} style="font-size: 80%;" on:change={set_magnification}>
		{#each magnifications as mag}
			<option value={mag.value}>
				{mag.text}
			</option>
		{/each}
	</select>

	<div class="bottom-menu-button" >
		<img class="bottom-menu-item"  src="./images/fill.svg" alt="fill" title="fill" />
	</div>
	<button id="color-fill" class="picker-button" style="background-color:{fill_color};color:{fill_color_inverted}" on:click={show_picker_fill}>fill</button>
	<div class="bottom-menu-button" >
		<img class="bottom-menu-item"  src="./images/stroke.svg" alt="stroke" title="stroke" />
	</div>
	<button id="color-line" class="picker-button" style="background-color:{stroke_color};color:{stroke_color_inverted}" on:click={show_picker_stroke}>stroke</button>

	<div style="vertical-align:bottom;display:inline-block;height:inherit">
		<div style="display:inline-block;height:1px;width:20px;border-top: solid {object_line_thick}px black;border-bottom:none">&nbsp;</div>
	</div>
	<input type=number class="bottom-input" min="1" max="16" bind:value={object_line_thick} on:change={update_thick}>	

	<div class="bottom-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'eye_dropper'); set_selection_mode('eye_dropper') } } >
		<img class="bottom-menu-item"  src="./images/eye_dropper.svg" alt="eye dropper" title="eye dropper" />
	</div>
	<div class="bottom-menu-button" >
		<img class="bottom-menu-item"  src="./images/blur.svg" alt="gaussian blur" title="gaussian blur" />
	</div>
	<input class="bottom-input" type=number bind:value={guass_blur_level} min="0" max="100" on:change={blurry_changed}>
	
	{#if (g_selector || g_free_mode) && selection_mode_var('component-properties') }
		<button class="bottom-button" on:click={ () => { toggle_float("component-editor") } }  >component properties</button>
	{/if}
	{#if (g_selector || g_free_mode) && selection_mode_var('connector-properties') }
		<button class="bottom-button" on:click={ () => { toggle_float("connection-editor") } } >connector properties</button>
	{/if}

	{#if (g_selector || g_free_mode) && is_pure_shape() }
		<span class="top-text" >shows on:</span>
		<input type="checkbox" name="view-scope" bind:checked={show_on_panel} on:click={toggle_panel_view} > <span class="top-text" >panel</span>
		<input type="checkbox" name="view-scope" bind:checked={show_on_design} on:click={toggle_design_view} > <span class="top-text" >design</span>
		<input type="checkbox" name="view-scope" bind:checked={show_on_causal} on:click={toggle_causal_view} > <span class="top-text" >causal</span>
	{/if}

</div>


<div bind:this={g_canvas_system} class="canvas-system" on:scroll={scroll_rulers}>
	<div bind:this={g_canvas_container} class="canvas-panel" style="width:{g_calc_container_width}px;height:{g_calc_container_height}px;cursor:{tool_cursor}" >
		<canvas class="main-canvas" bind:this={g_canvas_element} width={g_calc_doc_width} height={g_calc_doc_height} style="width:{g_calc_doc_width}px;height:{g_calc_doc_height}px;left:{g_doc_left}px;top:{g_doc_top}px"  >
	
		</canvas>
		<CanEdit {...edit_props} bind:selected_objects={g_current_selection_object} bind:selection_changed={g_selection_changed} bind:group_selected={group_selected}/>

	
		<Ruler disposition="horizontal" {ruler_top} {ruler_magnification} zero_tick={h_zero_tick} ruler_interval={INTERVAL_ruler}/>
		<Ruler disposition="vertical" {ruler_left}  {ruler_magnification} zero_tick={v_zero_tick} ruler_interval={INTERVAL_ruler}/>
	</div>
</div>


<BurgerMenu>
	<div class="b-menu-item" on:click={ () => { toggle_dialog("project-new") } }>
		<img class="top-menu-item"  src="./images/new.svg" alt="new" title="new" />
		<div class="b-menu-item-text" >Manage Projects</div>
	</div>
	<div class="b-menu-item" on:click={ () => { toggle_dialog("project-save") } } >
		<img class="top-menu-item"  src="./images/save.svg" alt="save" title="save" />
		<div class="b-menu-item-text" >Save Project</div>
	</div>
	<div class="b-menu-item" on:click={ () => { toggle_dialog("project-open") } } >
		<img class="top-menu-item"  src="./images/open.svg" alt="open" title="open" />
		<div class="b-menu-item-text" >Load Project</div>
	</div>
	<hr>
	<div class="b-menu-item" on:click={ () => { toggle_dialog("svg-import") } }>
		<img class="top-menu-item"  src="./images/importImg.svg" alt="import" title="import" />
		<div class="b-menu-item-text" >Import SVG</div>
	</div>
	<div class="b-menu-item" on:click={ () => { toggle_dialog("svg-export") } } >
		<img class="top-menu-item"  src="./images/export.svg" alt="export" title="export" />
		<div class="b-menu-item-text" >Export SVG</div>
	</div>
	<div class="b-menu-item" on:click={ () => { toggle_dialog("svg-save") } } >
		<img class="top-menu-item"  src="./images/save.svg" alt="save" title="save" />
		<div class="b-menu-item-text" >Save SVG</div>
	</div>
	<hr>
	<div class="b-menu-item" on:click={ () => { toggle_float("library-view") } } >
		<image class="top-menu-item"  src="./images/library.svg" alt="Image Lib" title="Image Library" />
		<div class="b-menu-item-text" >Image Library</div>
	</div>
	<hr>
	<div class="b-menu-item"  on:click={ () => { toggle_dialog("doc-properties") } } >
		<img class="top-menu-item"  src="./images/docprop.svg" alt="document properties" title="document properties" />
		<div class="b-menu-item-text" >Document Properties</div>
	</div>
	<div class="b-menu-item"  on:click={ () => { toggle_dialog("editor-prefs") } } >
		<img class="top-menu-item"  src="./images/editPref.svg" alt="editor preferences" title="editor preferences" />
		<div class="b-menu-item-text" >Editor Preferences</div>
	</div>
	<hr>
	<div class="b-menu-item"  on:click={ () => { toggle_float("svg-edit") } } >
		<img class="top-menu-item"  src="./images/source.svg" alt="edit SVG" title="edit SVG" />
		<div class="b-menu-item-text" >Edit SVG</div>
	</div>
	<div class="b-menu-item"  on:click={toggle_grid} >
		<img class="top-menu-item"  src="./images/grid.svg" alt="Editor Grid" title="Editor Grid" />
		<div class="b-menu-item-text" >{show_hide_grid} Grid</div>
	</div>
	<div class="b-menu-item"  on:click={toggle_wireframe} >
		<img class="top-menu-item"  src="./images/wireframe.svg" alt="Wire Frame" title="Wire Frame" />
		<div class="b-menu-item-text" >{show_hide_wireframe} Wire Frame</div>
	</div>
	<hr>
	<div class="b-menu-item"  on:click={ () => { toggle_float("layers-manager") } }  >
		<img class="top-menu-item"  src="./images/wireframe.svg" alt="Layers" title="Layers" />
		<div class="b-menu-item-text" >Manage Layers</div>
	</div>
	<hr>
	{#if project_selected }
		<div class="b-menu-item-text" >
			Editing project: {g_db_store.project_name}
		</div>
		{#if g_db_store.current_file_entry && g_db_store.current_file_entry.name }
			<div class="b-menu-item-text" >
				Editing file: {g_db_store.current_file_entry.name}
			</div>
		{/if}
	{/if}
</BurgerMenu>

<div class="color-box" style="visibility:{is_viz_fill};top:{colorizer_top};left:{colorizer_left}" >
	<HsvPicker on:colorChange={colorCallback_fill} startColor={picker_starter_fill}/>
</div>

<div class="color-box" style="visibility:{is_viz_stroke};top:{colorizer_top};left:{colorizer_left}" >
	<HsvPicker on:colorChange={colorCallback_stroke} startColor={picker_starter_stroke}/>
</div>


<Modal visible={g_visibile_items.project_manage} on:message={handle_modal_close} positive_prompt={"Select"} >
	<ManageProject ui_target={g_visibile_items.project_manage}  />
</Modal>

<Modal visible={g_visibile_items.project_open} on:message={handle_modal_close}  positive_prompt={"Restore"} >
	<OpenProject ui_target={g_visibile_items.project_open} />
</Modal>

<Modal visible={g_visibile_items.project_save} on:message={handle_modal_close}  positive_prompt={"Save"} >
	<SaveProject ui_target={g_visibile_items.project_save} />
</Modal>


<Modal visible={g_visibile_items.svg_import} on:message={handle_modal_close} >
	<ImportSVG ui_target={g_visibile_items.svg_import} />
</Modal>

<Modal visible={g_visibile_items.svg_export} on:message={handle_modal_close} >
	<ExportSVG ui_target={g_visibile_items.svg_export} export_file={g_exportable}/>
</Modal>

<Modal visible={g_visibile_items.svg_save} on:message={handle_modal_close} >
	<SaveSVG ui_target={g_visibile_items.svg_save} save_file={g_exportable} />
</Modal>

<Modal visible={g_visibile_items.doc_properties} on:message={handle_modal_close} >
	<DocProps ui_target={g_visibile_items.doc_properties} />
</Modal>

<Modal visible={g_visibile_items.editor_prefs} on:message={handle_modal_close} >
	<EditPrefs ui_target={g_visibile_items.editor_prefs}  />
</Modal>



<FloatWindow title="Image Library"  index={0} scale_size_array={all_window_scales[0]} >
	Image Library
</FloatWindow>


<FloatWindow title="SVG Editor"  index={1} scale_size_array={all_window_scales[1]} >
	SVG Editor
</FloatWindow>


<FloatWindow title="Manage Layers"  index={2} scale_size_array={all_window_scales[2]} >
	Manage Layers
</FloatWindow>

<FloatWindow title="Component Properties"  index={3} scale_size_array={all_window_scales[3]} >
	<ComponentEditor bind:selected_component={g_selected_component} />
</FloatWindow>

<FloatWindow title="Connector Properties"  index={4} scale_size_array={all_window_scales[4]} >
	<ConnectorEditor bind:selected_connector={g_selected_connector} />
</FloatWindow>



<style>

	.v-spacer {
		height: 52px;
		width : inherit
	}

	.b-menu-item {
		vertical-align: top;
		cursor: pointer;
	}

	.b-menu-item-text {
		display:inline-block;
		vertical-align: top;
		margin-left: 2px;
		text-align:center;
	}

	.top-menu-item {
		width : inherit;
		cursor : pointer;
		height : 30px;
		width : 30px;
	}

	.top-text {
		color:white;
		font-size: 80%;
		margin-right: 2px;
	}

	.top-input {
		height: 20px;
		width: 50px;
		font-size: 90%;
	}


	.v-left-menu {
		width : inherit
	}
	.v-left-menu-item {
		width : inherit;
		cursor : pointer;
		height : 30px;
		width : 30px;
	}
	.v-left-menu-button {
		margin-top: 3px;
		background-color:rgb(136, 134, 134);
		text-align:center;
		vertical-align: middle;
		border-radius: 15%;
	}

	.mode-button {
		font-size: 68%;
		font-weight:bold;
		font-style: italic;
		color:greenyellow;
		box-shadow: 2px 2px honeydew;
	}

	.mode-button > input {
		cursor:pointer;
	}

	.mode-label {
		font-size: 68%;
		font-weight:bold;
		font-style:normal;
		color:indigo;
		background-color: ivory;
		border-top: solid 1px darkslateblue;
		margin-bottom:4px;
	}

	.bottom-menu-button {
		background-color: none;
		cursor : pointer;
		margin-top: 0px;
		text-align:center;
		vertical-align: middle;
		border-radius: 15%;
		width:fit-content;
		display: inline-block;
	}

	.bottom-menu-item {
		height : 30px;
		width : 30px;
	}
	.bottom-input {
		height: 20px;
		width:60px;
	}

	.big_pict {
		height : 24px;
		max-height: 24px;
		margin-bottom : 4px
	}

	.picker-button {
		visibility: inherit;
		cursor: pointer;
		color:darkorchid;
	}

	.bottom-button {
		visibility: inherit;
		cursor: pointer;
		background-color: lightgrey;
		font: bold;
		color: darkgreen;
		font-size: 75%;
		border: solid 1px rgb(61, 97, 97);
		box-shadow: 2px 2px rgba(116, 133, 150, 0.596), -0.45em 0 .1em rgb(54, 88, 88);
	}

	.color-box {
		position: absolute;
		bottom: 90px;
		left: 60px;
		z-index: 2000;
		border : solid 2px black;
	}

	.left-panel {
		position: absolute;
		top: 0px;
		left: 6px;
		padding: 2px;
		border: solid 1px darkblue;
		width: 38px;
		height: calc(100% - 44px);
		background-color: whitesmoke;
		float: left;
		text-align: center;
	}

	.top-panel {
		position: absolute;
		--leftness : 52px;
		top: 0px;
		left: var(--leftness);
		border: solid 1px darkblue;
		background-color:darkslategray;
		width: calc(100vw - (var(--leftness) + 4px));
		height: 36px;
	}

	.bottom-panel {
		position: absolute;
		--b-leftness : 6px;
		--b-topness : calc(100% - 36px);
		top: var(--b-topness);
		left: var(--b-leftness);
		border: solid 1px darkblue;
		background-color:darkslategray;
		width: calc(100vw - (var(--b-leftness) + 4px));
		height: 36px;
		vertical-align: top;
	}

	.canvas-system {
		position: absolute;
		--topness: 40px;
		--leftness : 52px;
		--b-topness : calc(100% - 36px);
		top: var(--topness);
		left: var(--leftness);
		border: solid 1px darkblue;
		width: calc(100vw - (var(--leftness) + 4px));
		height: calc(var(--b-topness) - var(--topness) - 4px);
		overflow:auto;
	}

	.canvas-panel {
		position: absolute;
		top: 0;
		left: 0;
		border: solid 1px darkblue;
		background-color:rgb(179, 179, 179);
		overflow: hidden;
	}

	.main-canvas {
		position:absolute;
		background-color:white;
		border: 1px solid black;
	}

</style>
