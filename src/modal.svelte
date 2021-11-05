<script>
    //
    import {dialog_control} from '../utils/db-utils'
    import {createEventDispatcher} from 'svelte';
    
    const dispatch = createEventDispatcher();

    export let visible = false
    export let positive_prompt = "OK"

    let display_type = "none"
    $: {
        display_type = visible ? "block" : "none"
        dialog_control.update((val) => {
            return null
        })
    }

    function block_click(evt) {
        evt.preventDefault = true
    }

    function handle_Cancel(evt) {
        dialog_control.update((val) => {
            return null
        })
        dispatch('message', {
			type: 'cancel'
		});
    }

    function handle_OK(evt) {
        dialog_control.update((val) => {
            return true
        })
        dispatch('message', {
			type: 'OK'
		});
    }



</script>
<div class="outer" style="visibility:{visible};display:{display_type}" on:mousedown={block_click}  >
    <div class="matt" >
        <div class="modal">
            <div class="header-box">
                <button class="ok-button" on:click={handle_OK} >{positive_prompt}</button> <button class="cancel-button" on:click={handle_Cancel}  >Cancel</button>
            </div>
            <slot></slot>
        </div>
    </div>
</div>

<style>
    .outer {
        display: table;
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
    }

    .matt {
        height: 100%;
        width: 100%;
        background-color: rgba(170, 131, 131, 0.438);
    }

    .modal {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgb(244, 255, 245);
        border: 1px solid black;
    }


    .header-box {
        width: 98%;
        background-color:snow;
        height: fit-content;
        text-align: right;
        border-bottom: 2px solid rgba(40, 80, 100, 0.7);
        padding:4px;
        vertical-align: middle;
    }

    .ok-button {
        background-color: rgb(167, 218, 117);
        color:darkgreen;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
    }

    .cancel-button {
        background-color: rgb(245, 197, 207);
        color:rgb(82, 15, 18);
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
    }



</style>