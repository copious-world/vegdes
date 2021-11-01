<script>


    let sel_project = { "name" : "test 1", "description" : "this is a test", "author" : "Samual Johnson" }
    let project_name = sel_project.name  // get it from the shared store -- editor state store

    let file_name = "none"

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
</script>
<div class="project-creation">
    <div class="labelish">Save SVG to the file on disk</div> 
    <div>
        <span class="labelish" >Project name: </span> {project_name}
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
