<script>

    import { file_store } from "../../utils/file-utils"
    import { db_store } from "../../utils/db-utils"
    import {download_session_record} from '../../utils/file-utils'
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
    let g_save_to_disk = false
    let file_name = ""
    let complete = false

    let project_name = ""  // get it from the shared store -- editor state store
    let author = ""
    let description = ""

    // from the selection store
    let sel_project = { "name" : "test 1", "description" : "this is a test", "author" : "Samual Johnson" }
    $: project_name = sel_project.name  // get it from the shared store -- editor state store
    $: author = sel_project.author
    $: description = sel_project.description

    function clear_form() {
        g_save_to_disk = false
        file_name = ""
        project_name = ""
        author = ""
        description = ""
    }

	function data_ready() {
        if ( g_save_to_disk ) {
            file_store.update(file_state => {
                file_state.file_name = file_name
                file_state.ready = true
                file_state.action = (href_link) => {
                    if ( href_link ) {
                        download_session_record(JSON.stringify(sel_project.data),'application/json',file_name,href_link)
                    } else {
                        clear_form()
                    }
                    file_store.update(file_state => { file_state.ready = false })
                }
            })
        } else {
            db_store.update(db_state => {
                db_state.name = project_name
                db_state.ready = true
                db_state.action = (do_save) => {
                        if ( do_save ) {
                            // store to indexed db
                        } else {
                            clear_form()
                        }
                        file_store.update(db_state => { db_state.ready = false })
                    }
            })
        }
	}

    $: if ( complete ) {
        data_ready()
    }

</script>
<div class="project-creation">
    <div class="labelish">Save a project record in the browser's IndexedDB or to a File on a local disk</div>
    <input type="checkbox" bind:value={complete} >
    <label>
        <input type=radio bind:group={g_save_to_disk} value={false}>
        Save to DB
    </label>
    <label>
        <input type=radio bind:group={g_save_to_disk} value={true}>
        Save to Disk
    </label>
    <div>
        <div><span class="labelish" >Project name: </span>  <input type="text" bind:value={project_name} ></div>
        <div>
            <div><span class="labelish" >Author Name: </span> {author} </div>
        </div>    
        <div>
            <div class="labelish" >Description: </div> 
            <blockquote>{description}</blockquote>
        </div>
        {#if g_save_to_disk}
            <span class="labelish" >Enter file name: </span> <input type="text" bind:value={file_name} />
        {:else}
            <br><br>
        {/if}
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
