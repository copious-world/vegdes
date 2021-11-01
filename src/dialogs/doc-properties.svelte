<script>

    let sel_project = { "name" : "test 1", "description" : "this is a test", 
                        "author" : "Samual Johnson", 
                        "properties" : { "height" : 480, "width" : 640 } }
    let project_name = sel_project.name  // get it from the shared store -- editor state store

    let doc_width = 640;
    let doc_height = 480
    let doc_title = ""

    let g_embed_images = true

    let presets = [
        { "label" :  "640x640", "width" : 640, "height" : 480 },
        { "label" :  "800x600", "width" : 800, "height" : 600 },
        { "label" :  "1024x768", "width" : 1024, "height" : 768 },
        { "label" :  "1600x1200", "width" : 1600, "height" : 1200 }
    ]

    let preset = presets[0]

    function set_canvas_dims(evt) {
        doc_width = preset.width
        doc_height = preset.height
    }

    function doc_width_changed(evt) {
        if ( doc_width > 2000 ) doc_width = 2000
        if ( doc_width < 100 ) doc_width = 100
        sel_project.properties.width = doc_width
    }


    function doc_height_changed(evt) {
        if ( doc_height > 2000 ) doc_height = 2000
        if ( doc_height < 100 ) doc_height = 100
        sel_project.properties.height = doc_height
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
</script>
<div class="project-creation">
    <div>
        <span class="labelish" >Project name: </span> {project_name}
    </div>
    <div>
        <span class="labelish" >Document title: </span> <input type=text bind:value={doc_title}  />
    </div>

    <div class="groupish" >
        <div>
            <span class="labelish" >Width: </span> <input type=number bind:value={doc_width} min="1" max="1000" on:change={doc_width_changed} />
        </div>
        <div>
            <span class="labelish" >Height: </span> <input type=number bind:value={doc_height} min="1" max="1000" on:change={doc_height_changed} />
        </div>
        <div>
            <select bind:value={preset} on:change={set_canvas_dims}>
                {#each presets as pre}
                    <option value={pre}>
                        {pre.label}
                    </option>
                {/each}
            </select>
        </div>
    </div>

    <div class="groupish" >
        <label>
            <input type=radio bind:group={g_embed_images} value={true}>
            Embed data
        </label>
        <label>
            <input type=radio bind:group={g_embed_images} value={false}>
            Use file references
        </label>
    </div>

</div>
<style>

    .project-creation {
        background-color: wheat;
        border: solid 1px darkslateblue;
        padding:8px;
    }

    .labelish {
        font-weight: bold;
        color:rgb(19, 46, 46)
    }


    .groupish {
        border : solid 1px black;
    }


</style>
