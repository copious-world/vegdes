<script>
    //
    import { get } from "svelte/store";
    import { db_store, dialog_control } from "../../utils/db-utils"
    import { get_file }  from "../../utils/file-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
    let storage_top = get(db_store)
    $: project_db = storage_top.db_storage_ref[0]

    // ----
    let sel_file = false
    let project_files = []

    let sel_project = false // object from disk
    //
    let storage_name = ""
    //
    let project_name = ""
    let project_file = ""
    let author = ""
    let project_description = ""

    $: if ( project_files.length > 0 ) {
        sel_file = project_files[0]
    }

    function data_ready() {
        if ( project_db ) {
            db_state.project_name = project_name
            db_state.author = author
            db_state.description = description
            //let file_data = project_db.get_file_details(first_file)
            //db_state.current_file_entry = file_data
            //
            db_state.ready = true
        }
    }

    let dialog_control_unsub = false
    // ----/ ----/ ----/ ----/ ----
    $: if ( ui_target ) {
        dialog_control_unsub = dialog_control.subscribe(value => {
            if ( value ) {
                data_ready()
                dialog_control.update(d_val => { return null })
            }
        });
    } else {
        if ( dialog_control_unsub ) dialog_control_unsub()
    }


    let file_clicker
    async function load_project() {
        if ( file_clicker ) {
            try {
                let {data, name, mime} = await get_file(file_clicker)
                if ( mime === "application/json" ) {
                    project_file = name
                    sel_project = JSON.parse(data)
                    project_name = sel_project.name
                    storage_name = project_name
                    author = sel_project.author
                    project_description = sel_project.description

                    let file_list = Object.keys(sel_project.data)
                    file_list.splice(file_list.indexOf("project-meta"),1)
                    project_files = file_list

                                //let file_data = project_db.get_file_details(first_file)
            //db_state.current_file_entry = file_data

                }
            } catch (e) {

            }
        }
    }


</script>
<div class="project-creation">
    <div class="field-wrappers" >
        <div class="labelish">Load a project from disk:</div> 
        <button class="uploader-button" on:click={load_project} >▲ project</button>
    </div>
	<div style="visibility: hidden;">
        <input bind:this={file_clicker} type=file bind:value={project_name} />
	</div>
    <div class="field-wrappers">
        <span class="labelish" >Project name: </span> {project_name} <span class="labelish" >from</span> {project_file}
        <div class="field-wrappers">
            Store as: <input type=text bind:value={storage_name} />
        </div>
    </div>
    <div class="field-wrappers" >
        {#if (project_files.length > 0) }
            <select bind:value={sel_file} >
                {#each project_files as prj_file}
                    <option value={prj_file}>
                        {prj_file}
                    </option>
                {/each}
            </select>
        {:else}
            <span class="labelish" >No files in project</span>
        {/if}
    </div>
    <div class="field-wrappers" >
        <div>
            <div><span class="labelish" >Author Name: </span>  {author} </div>
        </div>
        <div>
            <div class="labelish" >Description: </div> 
            <blockquote>{project_description}</blockquote>
        </div>
    </div>
</div>
<style>

    .project-creation {
        background-color: wheat;
        border: solid 1px darkslateblue;
        padding:8px;
    }

    .uploader-button {
        cursor: pointer;
        border-radius: 8px;
    }

    .labelish {
        font-weight: bold;
        color:rgb(19, 46, 46)
    }

    .field-wrappers {
        border: black 1px solid;
        padding: 4px;
        margin: 4px;
        background-color: rgb(255, 247, 232);
    }

</style>
