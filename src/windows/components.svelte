<script>

    export let selected_component = false
    let local_component = false

    $: local_component = selected_component

    let input_connector_names = []
    $: if ( (local_component !== false) && local_component.stretching_inputs ) {
        input_connector_names = Object.keys(local_component.stretching_inputs)
//console.log("INPUTS",input_connector_names)
    }

    let output_connector_names = []
    $: if ( (local_component !== false) && local_component.stretching_outputs ) {
        output_connector_names = Object.keys(local_component.stretching_outputs)
//console.log("OUTPUTS",output_connector_names)
    }

</script>
<div>

    {#if local_component === false }
        No connector selected
    {:else}
        <div>
            <span class="title-con">Component Properties: </span> <span class="title-con-id">{local_component.id}</span>
         </div>
         <div>
             <div>
                 <div>
                    <span class="title-con">Inputs: </span>
                 </div>
                 {#if local_component.stretching_inputs }
                    {#each input_connector_names as connect_id }
                    <div class="title-con-id">{connect_id}</div>
                    {/each}
                 {/if}
             </div>
             <div>
                <div>
                    <span class="title-con">Outputs: </span>
                 </div>
                 {#if local_component.stretching_outputs }
                    {#each output_connector_names as connect_id }
                    <div class="title-con-id">{connect_id}</div>
                    {/each}
                 {/if}
             </div>
         </div>
     
    {/if}

</div>
<style>

</style>