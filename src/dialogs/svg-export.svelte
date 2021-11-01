<script>


    let sel_project = { "name" : "test 1", "description" : "this is a test", "author" : "Samual Johnson" }
    let project_name = sel_project.name  // get it from the shared store -- editor state store

    let quality = 95;
    let file_name = "none"
    let file_type = "PDF"
    let file_types = [
        "PNG",
        "JPG",
        "PDF"
    ]

    function quality_changed(evt) {
        if ( quality > 100 ) quality = 100
        if ( quality < 1 ) quality = 1
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
        <select bind:value={file_type} >
            {#each file_types as ft}
                <option value={ft}>
                    {ft}
                </option>
            {/each}
        </select>
    </div>
    <div>
        <span class="labelish" >Quality: </span> <input type=number bind:value={quality} min="1" max="100" on:change={quality_changed} />
    </div>
    <div>
        <span class="labelish" >From File: </span><input type=file bind:value={file_name} filter="{file_type}" />
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
