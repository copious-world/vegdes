<script>

    let project_name = ""
    let author = ""
    let description = ""


</script>
<div class="project-creation">
    <div class="labelish">Creates a project record in the browser's IndexedDB</div> 
    <div>
        <span class="labelish" >Project name: </span>  <input type="text" bind:value={project_name} >
    </div>
    <div>
        <span class="labelish" >Author Name: </span>  <input type="text" bind:value={author} >
    </div>
    <div>
        <div class="labelish" >Description: </div> 
        <textarea bind:value={description} style="width:80%" />    
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
