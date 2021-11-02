


import { writable } from 'svelte/store';


export const db_store = writable({
    "project_name" : "",
    "project_ready" : false,
    "author" : "no one",
    "action" : (link) => {}
});


