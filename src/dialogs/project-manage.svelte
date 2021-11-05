<script>
    import { get } from "svelte/store";
    import { db_store, dialog_control } from "../../utils/db-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    let fld_project_name = ""
    let author = ""
    let project_description = ""
    //
    let description = ""
    let project_db = false
    let first_file = ""


    function clear_form() {
        fld_project_name = ""
        author = ""
        project_description = ""
        description = ""
        description = ""
    }

    //
    $: if ( ui_target ) {
        let storage_top = get(db_store)
        project_db = storage_top.db_storage_ref[0]
    }

    let sel_project = false
    let project_names = []

    $: if ( project_db ) {
        project_names = project_db.name_list
        if ( project_names.length  && !(sel_project) ) {
            clear_form()
            sel_project = project_names[0]
        }
        if ( project_names.length === 0 ) {
            clear_form()
            sel_project = false
        }
        if ( sel_project ) project_details()
    }

    let sel_file = false
    let project_files = []

    async function project_details(switching) {
        if ( sel_project ) {
            await project_db.get_project(sel_project)
            fld_project_name = project_db.current_project_name
            author = project_db.current_author
            project_description = project_db.current_description
            project_files = project_db.current_file_list
            if ( (project_files.length > 0) && (switching === undefined ) ) {
                sel_file = project_files[0]
                file_details()
            }
        }
    }

    function file_details() {
        // sel_file
        if ( sel_file && sel_file.name ) {
            let file_data = project_db.get_file_details(sel_file.name)
            first_file = file_data.name
            description = file_data.description
        }
    }

    async function add_project() {
        //
        project_names.unshift(fld_project_name)
        //
        project_db.current_project_name = fld_project_name
        project_db.current_author = author
        project_db.current_description = project_description
        //
        await project_db.add_project()
        project_names = project_db.name_list
        clear_form()
        if ( project_names.length ) {
            sel_project = project_names[0]
            await project_details()
        }

    }

    async function remove_project() {
        project_db.current_project_name = sel_project
        let index = project_names.indexOf(sel_project)
        sel_project = false
        project_names = [...project_names.slice(0, index), ...project_names.slice(index + 1)];
        await project_db.remove_project()
        setTimeout(async () => {
            project_names = project_db.name_list
            if ( project_names.length ) {
                sel_project = project_names[0]
                await project_details()
            }
         },20)
    }

    async function add_file_to_project() {
        project_db.current_project_name = sel_project
        await project_db.add_file(first_file,description)
        await project_details()
    }

    async function remove_file_from_project() {
        project_db.current_project_name = sel_project
        await  project_db.remove_file(first_file)
        await project_details()
    }


	function data_ready() {
        db_store.update(db_state => {  // change this object
            //
            db_state.project_name = sel_project
            db_state.author = author
            db_state.description = description
            let file_data = project_db.get_file_details(first_file)
            db_state.current_file_entry = file_data
            //
            db_state.ready = true
            return Object.assign({},db_state)
        })
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



</script>
<div class="project-creation">
    <div class="labelish">Manage projects recorded in the browser's IndexedDB</div> 
    <div class="field-wrappers" >
        <div class="field-wrappers-left" >
            {#if (project_names.length > 0) }
                <select bind:value={sel_project} on:change={() => { project_details(true) }} >
                    {#each project_names as p_name}
                        <option value={p_name}>
                            {p_name}
                        </option>
                    {/each}
                </select>
            {:else}
                <span class="labelish" >No projects: enter a new one</span>
            {/if}
        </div>
        <div class="field-wrappers-right" >
            {#if (project_files.length > 0) }
                <select bind:value={sel_file} on:change="{file_details}">
                    {#each project_files as prj_file}
                        <option value={prj_file}>
                            {prj_file.name}
                        </option>
                    {/each}
                </select>
            {:else}
                {#if (project_names.length > 0) }
                    <span class="labelish" >No files in project</span>
                {:else}
                    <span class="labelish" >Create a project to add a file</span>
                {/if}
            {/if}
        </div>
    </div>
    <div class="field-wrappers" >
        <div class="field-wrappers" >
            <div>
                <span class="labelish" >Project name: </span>  <input type="text" bind:value={fld_project_name} >
            </div>
            <div>
                <span class="labelish" >Author Name: </span>  <input type="text" bind:value={author} >
            </div>
            <div>
                <div class="labelish" style="margin-bottom:3px" >Project Description: </div> 
                <textarea bind:value={project_description} style="width:95%;margin-left:3%" />    
            </div>    
            <div style="text-align:right">
                <button class="edit-buttons" on:click={add_project} >+</button>&nbsp;<button class="edit-buttons" on:click={remove_project} >-</button>
            </div>
        </div>
        <div class="field-wrappers" >
            <div>
                <span class="labelish" >First File Name: </span>  <input type="text" bind:value={first_file} >
                <button class="edit-buttons" on:click={add_file_to_project} >+</button>&nbsp;
                <button class="edit-buttons"  on:click={remove_file_from_project} >-</button>
            </div>
            <div>
                <div class="labelish" style="margin-bottom:3px" >Description: </div> 
                <textarea bind:value={description} style="width:95%;margin-left:3%" />    
            </div>    
        </div>
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

    .edit-buttons {
        font-weight: bolder;
        cursor: pointer;
    }

    .field-wrappers {
        border: black 1px solid;
        padding: 4px;
        margin: 4px;
        background-color: rgb(255, 247, 232);
    }

    .field-wrappers-left {
        border: black 1px solid;
        padding: 4px;
        margin-right: 6px;
        display: inline-block;
        width: 45%;
    }

    .field-wrappers-right {
        border: black 1px solid;
        padding: 4px;
        display: inline-block;
        width: 45%;
        float: right;
    }

</style>
