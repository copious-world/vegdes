<script>


    let sel_project = { "name" : "test 1", "description" : "this is a test", "author" : "Samual Johnson" }
    let project_name = sel_project.name  // get it from the shared store -- editor state store

    let to_layer = 1;
    let file_name = "none"

    function to_layer_changed(evt) {
        if ( to_layer > 10 ) to_layer = 10
        if ( to_layer < 1 ) to_layer = 1
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
</script>
<div class="project-creation">
    <div class="labelish">Add SVG to the current project</div> 
    <div>
        <span class="labelish" >Project name: </span> {project_name}
    </div>
    <div>
        <span class="labelish" >Layer: </span> <input type=number bind:value={to_layer} min="1" max="10" on:change={to_layer_changed} />
    </div>
    <div>
        <span class="labelish" >From File: </span><input type=file bind:value={file_name} filter="svg" />
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


</style>
