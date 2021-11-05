<script>
    import { download_session_record } from "../../utils/file-utils"
    import { db_store, dialog_control } from "../../utils/db-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    let href_link
    let project_db = false
    //
    let storage_top = false
    let project_selected = false

	db_store.subscribe((db_obj) => {
		storage_top = db_obj
		project_selected = db_obj.ready
	})

    $: if ( storage_top ) {
        project_selected = storage_top.ready
        project_db = storage_top.db_storage_ref[0]
    }
    //
    let save_to_disk = true
    let file_name = ""

    let project_name = ""  // get it from the shared store -- editor state store
    let author = ""
    let description = ""

    // from the selection store
    let sel_project = false//storage_top
    $: if ( project_db ) {
        project_name = storage_top ? storage_top.project_name  : "" // get it from the shared store -- editor state store
        setTimeout(async () => {
            sel_project = await project_db.get_project(project_name)
        },10)
    }
    $: author = storage_top ? storage_top.author : ""
    $: description = storage_top ? storage_top.description : ""

    function clear_form() {
        save_to_disk = true
        file_name = ""
        project_name = ""
        author = ""
        description = ""
    }

	async function data_ready() {
        if ( save_to_disk ) {
            if ( file_name.length ) {
                let output = JSON.stringify(sel_project)
                await download_session_record(output,'application/json',file_name,href_link)
                clear_form()
            }
        } else {
            await project_db.update_project()
            db_store.update(db_state => {       // update the published information about this project...
                db_state.name = project_name
                db_state.ready = false
                clear_form()
            })
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


</script>
<div class="project-creation">
    <div class="labelish">Save the selected project JSON to a disk file:</div>
    {#if project_selected }
    <div lass="field-wrappers" >
        <div class="field-wrappers" >
            <div><span class="labelish" >Project name: </span> {project_name}</div>
            <div>
                <div><span class="labelish" >Author Name: </span> {author} </div>
            </div>    
            <div>
                <div class="labelish" >Description: </div> 
                <blockquote>{description}</blockquote>
            </div>
        </div>

        <div class="field-wrappers" >
            <div>
                <span class="labelish" >To File: </span><input type=text bind:value={file_name} />
            </div>
        </div>

    </div>
    {:else}
    <div lass="field-wrappers" >
        Select a project for editing. Use <b>Manage Projects</b>
    </div>
    {/if}
</div>
<a bind:this={href_link} href="blob" class="hidden-link" >nothing</a>
<style>


    .field-wrappers {
        border: black 1px solid;
        padding: 4px;
        margin: 4px;
        background-color: rgb(255, 247, 232);
    }

    .project-creation {
        background-color: wheat;
        border: solid 1px darkslateblue;
        padding:8px;
    }

    .labelish {
        font-weight: bold;
        color:rgb(19, 46, 46)
    }

    .hidden-link {
        visibility: hidden;
    }

</style>
