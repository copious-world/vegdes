<script>
    import { download_session_record } from "../../utils/file-utils"
    import { db_store, dialog_control } from "../../utils/db-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    export let export_file = false
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

    let quality = 95;
    let file_name = ""
    let file_type = "PDF"
    let file_types = [
        "PNG",
        "JPG",
        "PDF"
    ]
    //
    let mimes = {
        "PNG" : "image/png",
        "JPG" : "image/jpeg",
        "PDF" :  "image/pdf"
    }

    function quality_changed(evt) {
        if ( quality > 100 ) quality = 100
        if ( quality < 1 ) quality = 1
    }

    function transform_Data(data) {
        return("this is a test")
    }

    async function data_ready() {
        let save_file = export_file
        if ( file_name.length ) {
            save_file = file_name
        }
        if ( save_file && save_file.length ) {
            let file_info = await project_db.get_file_details(export_file)
            let mime = "application/pdf"
            let output = transform_Data(file_info.svg,file_type)
            await download_session_record(output,mime,save_file,href_link)
        }
	}

    let dialog_control_unsub = false
    // ----/ ----/ ----/ ----/ ----
    $: if ( ui_target ) {
        dialog_control_unsub = dialog_control.subscribe(value => {
            if ( value ) {
                data_ready()
            }
        });
    } else {
        if ( dialog_control_unsub ) dialog_control_unsub()
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
</script>
<div class="project-creation">
    {#if export_file }
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
            <span class="labelish" >TO File: </span><input type=text bind:value={file_name} />
        </div>
    {:else}
        <div lass="field-wrappers" >
            Select a project with exportable files. Use <b>Manage Projects</b>
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
