<script>
    import { get } from "svelte/store";
    import { get_file }  from "../../utils/file-utils"
    import { db_store, dialog_control } from "../../utils/db-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    let storage_top = get(db_store)
    $: project_db = storage_top.db_storage_ref[0]

    
    let sel_project = { "name" : "test 1", "description" : "this is a test", "author" : "Samual Johnson", "data" : "", "ouput" : "", "svg" : "" }
    let project_name = sel_project.name  // get it from the shared store -- editor state store

    let to_layer = 1;
    let file_name = ""
    let description = ""
    let file_svg = ""
    let check_mime = ""

    function to_layer_changed(evt) {
        if ( to_layer > 10 ) to_layer = 10
        if ( to_layer < 1 ) to_layer = 1
    }

    let file_clicker
    async function load_svg() {
        if ( file_clicker ) {
            let {data,name,mime} = await get_file(file_clicker)
            file_svg = data
            file_name = name
            check_mime = mime
        }
    }

    function data_ready() {
        project_db.add_file(file_name,description,file_svg)
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


    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
</script>
<div class="project-creation">
    <div class="labelish">Add SVG to the current project</div> 
    <div>
        <span class="labelish" >Project name: </span> {project_name}
    </div>
    <div>
        <span class="labelish" >Layer: </span> <input type=number bind:value={to_layer} min="1" max="10" on:change={to_layer_changed} />
    </div>
    <div class="labelish">Load a svg file from disk:</div> 
    <button class="uploader-button" on:click={load_svg} >▲ project</button>&nbsp;&nbsp;<span>{file_name}</span>
    <div style="visibility: hidden;" >
        <input bind:this={file_clicker} type=file bind:value={file_name} />
	</div>
    {#if file_name.length }
    <div class="field-wrappers">
        <div>
            <div class="labelish" style="margin-bottom:3px" >Description: </div> 
            <textarea bind:value={description} style="width:95%;margin-left:3%" />    
        </div>    
    </div>
    {/if}
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

    .uploader-button {
        cursor: pointer;
        border-radius: 8px;
    }


    .field-wrappers {
        border: black 1px solid;
        padding: 4px;
        margin: 4px;
        background-color: rgb(255, 247, 232);
    }


</style>
