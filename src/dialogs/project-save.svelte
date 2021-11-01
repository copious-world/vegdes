<script>

    let g_save_to_disk = false
    let file_name = ""

    // from the selection store
    let sel_project = { "name" : "test 1", "description" : "this is a test", "author" : "Samual Johnson" }
    let project_name = sel_project.name  // get it from the shared store -- editor state store
    let author = sel_project.author
    let description = sel_project.description

</script>
<div class="project-creation">
    <div class="labelish">Save a project record in the browser's IndexedDB or to a File on a local disk</div>
    <label>
        <input type=radio bind:group={g_save_to_disk} value={false}>
        Save to DB
    </label>
    <label>
        <input type=radio bind:group={g_save_to_disk} value={true}>
        Save to Disk
    </label>
    <div>
        <div><span class="labelish" >Project name: </span>  <input type="text" bind:value={project_name} ></div>
        <div>
            <div><span class="labelish" >Author Name: </span> {author} </div>
        </div>    
        <div>
            <div class="labelish" >Description: </div> 
            <blockquote>{description}</blockquote>
        </div>
        {#if g_save_to_disk}
        <span class="labelish" >Enter file name: </span> <input type="text" bind:value={file_name} />
        {:else}
        <br><br>
        {/if}
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
