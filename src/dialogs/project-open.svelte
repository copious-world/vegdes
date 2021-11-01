<script>


    // from the selection store
    let projects = [
        { "name" : "test 1", "description" : "this is a test", "author" : "Samual Johnson" },
        { "name" : "test 2", "description" : "have a nice day", "author" : "Samual Johnson" },
        { "name" : "test 3", "description" : "you are here", "author" : "Luamus Gypsie" },
        { "name" : "test 4", "description" : "they are there", "author" : "January Johnsos" }
    ]

    let sel_project = projects[0]
    let project_name = sel_project.name  // get it from the shared store -- editor state store
    let author_filter = sel_project.author


    function project_details() {
        project_name = sel_project.name
        author_filter = sel_project.author
    }

</script>
<div class="project-creation">
    <div class="labelish">Creates a project record in the browser's IndexedDB</div> 
    <div>
        <span class="labelish" >Project name: </span>  <input type="text" bind:value={project_name} >
    </div>
    <div>
        <select bind:value={sel_project} on:change="{project_details}">
            {#each projects as prj}
                <option value={prj}>
                    {prj.name}
                </option>
            {/each}
        </select>
    </div>
    <div>
        <div class="labelish" >Filters: </div>
        <div><span class="labelish" >Author Name: </span>  <input type="text" bind:value={author_filter} ></div>
    </div>
    <div>
        <div class="labelish" >Description: </div> 
        <blockquote>{sel_project.description}</blockquote>
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
