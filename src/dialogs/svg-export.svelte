<script>
    import { get } from "svelte/store";
    import { file_store, download_session_record } from "../../utils/file-utils"
    import { db_store, dialog_control } from "../../utils/db-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    let href_link

    let sel_project = {
        "name" : "test 1", "description" : "this is a test", "author" : "Samual Johnson", "data" : "", "ouput" : "", "svg" : "" }
    let project_name = sel_project.name  // get it from the shared store -- editor state store

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
        if ( file_name.length ) {
            sel_project.output = transform_Data(sel_project.data,file_type)
            let mime = "pdf" // mimes[file_type]
            await download_session_record(sel_project.output,mime,file_name,href_link)
            clear_form()
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
