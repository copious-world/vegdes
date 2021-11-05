<script>
    import { download_session_record } from "../../utils/file-utils"
    import { db_store, dialog_control } from "../../utils/db-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    export let save_file = false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    let href_link

    let project_db = false
    //
    let storage_top = false
    let project_selected = false

    let project_name = ""
    let project_description = ""
    let author = ""

	db_store.subscribe((db_obj) => {
		storage_top = db_obj
		project_selected = db_obj.ready
	})

    $: if ( storage_top ) {
        project_selected = storage_top.ready
        project_db = storage_top.db_storage_ref[0]
    }

        // from the selection store
    let sel_project = false//storage_top
    $: if ( project_db ) {
        project_name = storage_top ? storage_top.project_name  : "" // get it from the shared store -- editor state store
        setTimeout(async () => {
            sel_project = await project_db.get_project(project_name)
        },10)
    }
    $: author = storage_top ? storage_top.author : ""
    $: project_description = storage_top ? storage_top.project_description : ""

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //

    async function data_ready() {
        if ( save_file && save_file.length ) {
            let file_info = await project_db.get_file_details(save_file)
            await download_session_record(file_info.svg,'image/svg+xml',save_file,href_link)
        }
	}


    let dialog_control_unsub = false
    // ----/ ----/ ----/ ----/ ----
    $: if ( ui_target ) {
        dialog_control_unsub = dialog_control.subscribe(async value => {
            if ( value ) {
                await data_ready()
                dialog_control.update(d_val => { return null })
            }
        });
    } else {
        if ( dialog_control_unsub ) dialog_control_unsub()
    }

</script>
<div class="project-creation">
    <div class="labelish">Save SVG to the file on disk</div>
    {#if save_file }
        <div>
            <span class="labelish" >Project name: </span> {project_name}
        </div>
        <div>
            <span class="labelish" >Enter File Name: </span> {save_file}
        </div>
    {:else}
        <div lass="field-wrappers" >
            Select a project that has svg files. Use <b>Manage Projects</b>
        </div>
    {/if}
    <a bind:this={href_link} href="blob" class="hidden-link" >nothing</a>
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

    .hidden-link {
        visibility: hidden;
    }

    .field-wrappers {
        border: black 1px solid;
        padding: 4px;
        margin: 4px;
        background-color: rgb(255, 247, 232);
    }

</style>
