<script>
    export let selected_connector = false

    let local_connector = false

    $: local_connector = selected_connector

</script>
<div>

    {#if local_connector === false }
        No connector selected
    {:else}
    <div>
       <span class="title-con">Connector Properties: </span> <span class="title-con-id">{local_connector.id}</span>
    </div>
    <div>
        <div>
            {#if local_connector.input }
            <span class="title-con">Input: </span> <span class="title-con-id">{local_connector.input.id}</span>
            {/if}
        </div>
        <div>
            {#if local_connector.output }
            <span class="title-con">Output: </span><span class="title-con-id">{local_connector.output.id}</span>
            {/if}
        </div>
    </div>
    {/if}

</div>
<style>

    .title-con {
        font-weight: bold;
        color: darkgreen;
    }
    .title-con-id {
        font-weight: bold;
        color: darkblue;
    }

    
</style>