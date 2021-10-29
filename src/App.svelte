<script>
	import BurgerMenu from 'svelte-burger-menu';
	import {HsvPicker} from 'svelte-color-picker';

	let selection_mode = true

	let rect_selected = true
	let text_selected = false
	let path_selected = false
	let circle_selected = false
	let line_selected = false
	let polygon_selected = false
	let star_selected = false
	let picture_selected = false
	let component_selected = false
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
	$: g_selector = (mode_toggle !== 'select')

	function set_selection_mode(mode_name) {
		rect_selected = false
		text_selected = false
		path_selected = false
		circle_selected = false
		line_selected = false
		polygon_selected = false
		star_selected = false
		picture_selected = false
		component_selected = false
		eye_dropper_selected = false
		connector_selected = false
		group_selected = false
		ungroup_selected = false
		curve_selected = false
		//
		mode_toggle = mode_name
		switch ( mode_name ) {
			case 'select': {
				selection_mode = false
				break
			}
			case 'zoom': {
				selection_mode = false
				break
			}
			case 'pencil': {
				selection_mode = true
				line_selected = true
				break
			}
			case 'pen':
			case 'path': {
				selection_mode = true
				path_selected = true
				break
			}
			case 'rect': {
				selection_mode = true
				rect_selected = true
				break
			}
			case 'ellipse': {
				selection_mode = true
				circle_selected = true
				break
			}
			case 'polygon': {
				selection_mode = true
				polygon_selected = true
				break
			}
			case 'star': {
				selection_mode = true
				star_selected = true
				break
			}
			case 'text': {
				selection_mode = true
				text_selected = true
				break
			}
			case 'load': {
				selection_mode = true
				picture_selected = true
				break
			}
			case 'eye_dropper': {
				selection_mode = false
				eye_dropper_selected = true
				break
			}
			case 'connector': {
				selection_mode = true
				connector_selected = true
				break
			}
			default: {
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
	let object_rx = 0.0
	let object_ry = 0.0


	let object_points = 3
	let object_sides = 3
	let object_pointiness = 1
	let object_radial_shift = 1

	let object_rotate = 0.0
	let object_corner = 0.0

	let object_text_bold = false
	let object_text_italic = false
	let object_text_font = "Serif"

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

	//
	let text_names = ["x", "y", "bold", "italic", "font", "align-left", "align-center", "align-right"]
	let rect_names = ["x", "y", "w", "h", "corner"]
	let circle_names = ["cx", "cy", "rx", "ry"]
	let line_names = ["x1", "y1", "x2", "y2"]
	let path_names = ["x", "y"]
	let polygon_names = ["x", "y", "sides"]
	let star_names = ["x", "y", "points", "pointiness", "radial-shift"]
	let component_names = ["x", "y"]
	let group_names = ["x", "y", "group", "relative", "align-left", "align-center", "align-right", "align-top", "align-middle", "align-bottom"]
	let grouped_names = ["x", "y", "label", "ungroup" ]
	let curve_names = ["x", "y", "curve", "clone-node", "delete-node", "subpath", "add-subpath" ]

	function selection_mode_var(var_name) {
		if ( selection_mode && (var_name == "rotate") ) return true

		if ( circle_selected && circle_names.indexOf(var_name) >= 0 ) {
			return true
		}
		if ( line_selected && line_names.indexOf(var_name) >= 0 ) {
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

		return false
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

	let guass_blur_level = 0;
	function  blurry_changed(event) {
		let blurry = event.target
		let blr = parseInt(blurry.value)
		if ( blr > 100 ) blurry.value = "100"
		if ( blr < 0 ) blurry.value = "0"
		guass_blur_level = parseInt(blurry.value)
	}


	let is_viz = "hidden"
	let maginification = 100
	let maginifications = [
		{ value : 400, text :"400%" },
		{ value : 200, text :"200%" },
		{ value : 100, text :"100%" }
	]

	function colorCallback(rgba) {
		console.log(rgba.detail)
	}

	function show_picker(evt) {
		is_viz = (is_viz === "hidden") ? "visible" : "hidden"
		let clicker = evt.target
		if ( clicker ) {
			let clicker_rect = clicker.getBoundingClientRect()
			let top = clicker_rect.top - 300
			let left = clicker_rect.left
			colorizer_top = `${top}px`
			colorizer_left = `${left}px`
		}
	}


</script>

<div class="left-panel" >
<div class="v-spacer"></div>
<div class="v-left-menu">
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'select'); set_selection_mode('select') } } >
		<img class="v-left-menu-item"  src="./images/select.svg" alt="select" title="select" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'zoom'); set_selection_mode('zoom') } } >
		<img class="v-left-menu-item"  src="./images/zoom.svg" alt="zoom" title="zoom" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'pencil'); set_selection_mode('pencil') } } >
		<img class="v-left-menu-item"  src="./images/pencil.svg" alt="pencil" title="pencil" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'pen'); set_selection_mode('pen') } } >
		<img class="v-left-menu-item"  src="./images/pen.svg" alt="pen" title="pen" />
	</div>
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
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'star'); set_selection_mode('star') } } >
		<img class="v-left-menu-item"  src="./images/star.svg" alt="star" title="postarlygon" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'text'); set_selection_mode('text') } } >
		<img class="v-left-menu-item"  src="./images/text.svg" alt="text" title="text" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'load'); set_selection_mode('load') } } >
		<img class="v-left-menu-item"  src="./images/image.svg" alt="load" title="load" />
	</div>
	<div class="v-left-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'connector'); set_selection_mode('connector') } } >
		<img class="v-left-menu-item"  src="./images/conn.svg" alt="connector" title="connector" />
	</div>

</div>
</div>

<div class="top-panel">
	<div class="bottom-menu-button" >
		<img class="bottom-menu-item"  src="./images/undo.svg" alt="undo" title="undo" />
	</div>
	<div class="bottom-menu-button" >
		<img class="v-left-menu-item"  src="./images/redo.svg" alt="redo" title="redo" />
	</div>
	<span style="color:white">|</span>
	<div class="bottom-menu-button" >
		<img class="v-left-menu-item"  src="./images/clone.svg" alt="clone" title="clone" />
	</div>
	<div class="bottom-menu-button" >
		<img class="v-left-menu-item"  src="./images/delete.svg" alt="delete" title="delete" />
	</div>
	<span style="color:white">|</span>
	<div class="bottom-menu-button" >
		<img class="v-left-menu-item"  src="./images/move_top.svg" alt="move front" title="move to front" />
	</div>
	<div class="bottom-menu-button" >
		<img class="v-left-menu-item"  src="./images/move_bottom.svg" alt="move back" title="move to back" />
	</div>
	<div class="bottom-menu-button" >
		<img class="v-left-menu-item"  src="./images/globe_link.svg" alt="add link" title="globe_link" />
	</div>
	<span style="color:white">|</span>

	{#if selection_mode }
		<span class="top-text" >id:</span><input type=text  class="bottom-input"  bind:value={id_selected} />
		<span class="top-text" >class:</span><input type=text  class="bottom-input" bind:value={class_selected} />
	{/if}

	<span style="color:white">|</span>

	{#if selection_mode && selection_mode_var('rotate') }
		<div class="bottom-menu-button" >
			<img class="bottom-menu-item"  src="./images/angle.svg" alt="undo" title="undo" />
		</div>
		<input type=number  class="top-input"  bind:value={object_rotate} />
	{/if}

	{#if g_selector && selection_mode_var('x') }
		<span class="top-text" >x:</span><input type=number  class="top-input"  bind:value={object_x} />
	{/if}
	{#if g_selector && selection_mode_var('y') }
		<span class="top-text" >y:</span><input type=number  class="top-input"  bind:value={object_y} />
	{/if}

	{#if g_selector && selection_mode_var('w') }
		<span class="top-text" >h:</span><input type=number  class="top-input"  bind:value={object_width} />
	{/if}
	{#if g_selector && selection_mode_var('h') }
		<span class="top-text" >w:</span><input type=number  class="top-input"  bind:value={object_height} />
	{/if}

	<!-- lines -->
	{#if g_selector && selection_mode_var('x1') }
		<span class="top-text" >x1:</span><input type=number  class="top-input"  bind:value={object_x1} />
	{/if}
	{#if g_selector && selection_mode_var('y1') }
		<span class="top-text" >y1:</span><input type=number  class="top-input"  bind:value={object_y1} />
	{/if}
	{#if g_selector && selection_mode_var('x2') }
		<span class="top-text" >x2:</span><input type=number  class="top-input"  bind:value={object_x2} />
	{/if}
	{#if g_selector && selection_mode_var('y2') }
		<span class="top-text" >y2:</span><input type=number  class="top-input"  bind:value={object_y2} />
	{/if}
	
	<!-- circles -->
	{#if g_selector && selection_mode_var('cx') }
		<span class="top-text" >cx:</span><input type=number  class="top-input"  bind:value={object_cx} />
	{/if}
	{#if g_selector && selection_mode_var('cy') }
		<span class="top-text" >cy:</span><input type=number  class="top-input"  bind:value={object_cy} />
	{/if}
	{#if g_selector && selection_mode_var('rx') }
		<span class="top-text" >rx:</span><input type=number  class="top-input"  bind:value={object_rx} />
	{/if}
	{#if g_selector && selection_mode_var('ry') }
		<span class="top-text" >ry:</span><input type=number  class="top-input"  bind:value={object_ry} />
	{/if}

	{#if g_selector && selection_mode_var('group') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/group_elements.svg" alt="form group" title="form group" />
		</div>
	{/if}

	{#if g_selector && selection_mode_var('ungroup') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/ungroup.svg" alt="ungroup" title="ungroup" />
		</div>
	{/if}

	{#if g_selector && selection_mode_var('relative') }
		<span class="top-text" >font:</span>
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

	{#if g_selector && selection_mode_var('corner') }
		<div class="bottom-menu-button" >
			<img class="bottom-menu-item"  src="./images/c_radius.svg" alt="undo" title="undo" />
		</div>
		<input type=number  class="top-input"  bind:value={object_corner} />
	{/if}

	{#if g_selector && selection_mode_var('bold') }
		<div class="bottom-menu-button" >
			<img class="bottom-menu-item"  src="./images/bold.svg" alt="bold" title="bold" />
		</div>
	{/if}
	{#if g_selector && selection_mode_var('italic') }
		<div class="bottom-menu-button" >
			<img class="bottom-menu-item"  src="./images/italic.svg" alt="italic" title="italic" />
		</div>
	{/if}
	{#if g_selector && selection_mode_var('font') }
		<span class="top-text" >font:</span>
		<div class="bottom-menu-button" style="vertical-align:bottom">
			<select bind:value={object_text_font} style="height:25px;font-size:70%" >
				{#each object_text_fonts as a_font}
					<option value={a_font.text}>
						{a_font.text}
					</option>
				{/each}
			</select>
		</div>
	{/if}
	{#if g_selector && selection_mode_var('align-left') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/align_left.svg" alt="align left" title="align left" />
		</div>
	{/if}
	{#if g_selector && selection_mode_var('align-center') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/align_center.svg" alt="align center" title="align center" />
		</div>
	{/if}
	{#if g_selector && selection_mode_var('align-right') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/align_right.svg" alt="align right" title="align right" />
		</div>
	{/if}

	{#if g_selector && selection_mode_var('align-top') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/align_top.svg" alt="align top" title="align top" />
		</div>
	{/if}
	{#if g_selector && selection_mode_var('align-middle') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/align_middle.svg" alt="align middle" title="align middle" />
		</div>
	{/if}
	{#if g_selector && selection_mode_var('align-bottom') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/align_bottom.svg" alt="align bottom" title="align bottom" />
		</div>
	{/if}

	{#if g_selector && selection_mode_var('curve') }
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
	{#if g_selector && selection_mode_var('clone-node') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/node_clone.svg" alt="clone node" title="clone node" />
		</div>
	{/if}
	{#if g_selector && selection_mode_var('delete-node') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/node_delete.svg" alt="delete node" title="delete node" />
		</div>
	{/if}
	{#if g_selector && selection_mode_var('subpath') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/path.svg" alt="open/close subpath" title="open/close subpath" />
		</div>
	{/if}
	{#if g_selector && selection_mode_var('add-subpath') }
		<div class="bottom-menu-button" >
			<img class="v-left-menu-item"  src="./images/tool_add_subpath.svg" alt="add subpath" title="add subpath" />
		</div>
	{/if}

	{#if g_selector && selection_mode_var('points') }
		<span class="top-text" >points:</span><input type=number  class="top-input"  bind:value={object_points} />
	{/if}
	{#if g_selector && selection_mode_var('sides') }
		<span class="top-text" >sides:</span><input type=number  class="top-input"  bind:value={object_sides} />
	{/if}
	{#if g_selector && selection_mode_var('pointiness') }
		<span class="top-text" >pointiness:</span><input type=number  class="top-input"  bind:value={object_pointiness} />
	{/if}
	{#if g_selector && selection_mode_var('radial-shift') }
		<span class="top-text" >radial shift:</span><input type=number  class="top-input"  bind:value={object_radial_shift} />
	{/if}

</div>


<div class="bottom-panel">
	<div class="bottom-menu-button" >
		<img class="bottom-menu-item"  src="./images/zoom.svg" alt="select" title="zoom" />
	</div>
	<select bind:value={maginification} on:change="{() => maginification = 100}">
		{#each maginifications as mag}
			<option value={mag.value}>
				{mag.text}
			</option>
		{/each}
	</select>

	<div class="bottom-menu-button" >
		<img class="bottom-menu-item"  src="./images/fill.svg" alt="fill" title="fill" />
	</div>
	<button id="color-fill" class="picker-button" style="background-color:{fill_color};color:{fill_color_inverted}" on:click={show_picker}>fill</button>
	<div class="bottom-menu-button" >
		<img class="bottom-menu-item"  src="./images/stroke.svg" alt="stroke" title="stroke" />
	</div>
	<button id="color-line" class="picker-button" style="background-color:{stroke_color};color:{stroke_color_inverted}" on:click={show_picker}>stroke</button>
	<div class="bottom-menu-button" >
		<img class="bottom-menu-item"  src="./images/opacity.svg" alt="opacity" title="opacity" />
	</div>
	<span style="color:greenyellow" >fill {alpha_value_fill}%</span>
	<span style="color:greenyellow" >line {alpha_value_line}%</span>
	<div class="bottom-menu-button" on:click={ (evt) => { g_selector = (mode_toggle === 'eye_dropper'); set_selection_mode('eye_dropper') } } >
		<img class="bottom-menu-item"  src="./images/eye_dropper.svg" alt="eye dropper" title="eye dropper" />
	</div>
	<div class="bottom-menu-button" >
		<img class="bottom-menu-item"  src="./images/blur.svg" alt="gaussian blur" title="gaussian blur" />
	</div>
	<input class="bottom-input" type=number bind:value={guass_blur_level} min="0" max="100" on:change={blurry_changed}>
</div>

<div class="canvas-panel">
</div>

<BurgerMenu>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/new.svg" alt="new" title="new" />
		<div class="b-menu-item-text" >Create New Project</div>
	</div>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/open.svg" alt="open" title="open" />
		<div class="b-menu-item-text" >Open Project</div>
	</div>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/save.svg" alt="save" title="save" />
		<div class="b-menu-item-text" >Save Project</div>
	</div>
	<hr>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/importImg.svg" alt="import" title="import" />
		<div class="b-menu-item-text" >Import SVG</div>
	</div>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/export.svg" alt="export" title="export" />
		<div class="b-menu-item-text" >Export SVG</div>
	</div>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/save.svg" alt="save" title="save" />
		<div class="b-menu-item-text" >Save SVG</div>
	</div>
	<hr>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/library.svg" alt="Image Lib" title="Image Library" />
		<div class="b-menu-item-text" >Image Library</div>
	</div>
	<hr>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/docprop.svg" alt="document properties" title="document properties" />
		<div class="b-menu-item-text" >Document Properties</div>
	</div>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/editPref.svg" alt="editor preferences" title="editor preferences" />
		<div class="b-menu-item-text" >Editor Preferences</div>
	</div>
	<hr>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/source.svg" alt="view SVG" title="view SVG" />
		<div class="b-menu-item-text" >Edit SVG</div>
	</div>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/grid.svg" alt="Editor Grid" title="Editor Grid" />
		<div class="b-menu-item-text" >{show_hide_grid} Grid</div>
	</div>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/wireframe.svg" alt="Wire Frame" title="Wire Frame" />
		<div class="b-menu-item-text" >{show_hide_wireframe} Wire Frame</div>
	</div>
	<hr>
	<div class="b-menu-item" >
		<img class="top-menu-item"  src="./images/wireframe.svg" alt="Wire Frame" title="Wire Frame" />
		<div class="b-menu-item-text" >Manage Layers</div>
	</div>
	
</BurgerMenu>

<div class="color-box" style="visibility:{is_viz};top:{colorizer_top};left:{colorizer_left}" >
	<HsvPicker on:colorChange={colorCallback} startColor={"#FBFBFB"}/>
</div>

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

	.picker-button {
		visibility: inherit;
		cursor: pointer;
		color:darkorchid;
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

	.canvas-panel {
		position: absolute;
		--topness: 40px;
		--leftness : 52px;
		--b-topness : calc(100% - 36px);
		top: var(--topness);
		left: var(--leftness);
		border: solid 1px darkblue;
		background-color: whitesmoke;
		width: calc(100vw - (var(--leftness) + 4px));
		height: calc(var(--b-topness) - var(--topness) - 4px);
	}

</style>
