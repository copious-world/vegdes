import { writable } from 'svelte/store';


export const file_store = writable({
    "file_name" : "",
    "ready" : false,
    "action" : (link) => {}
});


function ext_of_file(file_name) {
	let idx = file_name.lastIndexOf('.')
	let ext = file_name.substr(idx+1)
	return ext
}


var downloader_url = null
export async function download_session_record(data,contentType,file_name,downloadlink) {
  if ( !(downloadlink) ) return false
  if ( data ) {
    // //
    let file_data = new Blob([data], {type: contentType});
    //
    let f_url = URL.createObjectURL(file_data);
    //
    if ( downloader_url !== null ) {
      URL.revokeObjectURL(downloader_url)  // cleaning up from the past... keeping it around for racing after the click
    }
    downloader_url = f_url
    //
    downloadlink.href = f_url
    downloadlink.download = file_name
    downloadlink.click();
    //
    return true
  }
  return false
}

// called in response to a file selection through the system file browser
//
export function get_file(file_el) {
	let p = new Promise((resolve,reject) => {
		file_el.addEventListener('change',(ev) => {
			//
			let file = file_el.files[0]
			let mtype = file.type
			if ( (ext_of_file(file.name) === 'json') || (ext_of_file(file.name) === 'svg') ) {
				let reader = new FileReader();
        reader.onload = (e) => {
          resolve({ "data" : e.target.result, "name" : file.name, "mime" : mtype })
        };
        reader.readAsText(file);
			}
			//
		})
		file_el.click()
	})
	//
	return p
}
