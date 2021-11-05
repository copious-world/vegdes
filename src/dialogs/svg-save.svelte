<script>
    import { get } from "svelte/store";
    import { file_store, download_session_record } from "../../utils/file-utils"
    import { db_store, dialog_control } from "../../utils/db-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    let href_link

    let sel_project = { "name" : "test 1", "description" : "this is a test", "author" : "Samual Johnson", "data" : "", "ouput" : "", "svg" : "asfafaf" }
    let project_name = sel_project.name  // get it from the shared store -- editor state store

    let file_name = ""
   
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //

    function clear_form() {
        g_save_to_disk = false
        file_name = ""
        project_name = ""
        author = ""
        description = ""
    }


    async function data_ready() {
        if ( file_name.length ) {
            await download_session_record(sel_project.svg,'text/svg',file_name,href_link)
            clear_form()
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
    <div class="labelish">Save SVG to the file on disk</div>
    <div>
        <span class="labelish" >Project name: </span> {project_name}
    </div>
    <div>
        <span class="labelish" >Enter File Name: </span><input type=text bind:value={file_name} filter="svg" />
    </div>
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

</style>
