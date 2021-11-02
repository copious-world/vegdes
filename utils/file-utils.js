import { writable } from 'svelte/store';


export const file_store = writable({
    "file_name" : "",
    "file_ready" : false,
    "file_action" : (link) => {}
});



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
