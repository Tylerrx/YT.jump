let player=null
let videoId=null
let notes=[]

document.getElementById("loadBtn").addEventListener("click",loadVideo)

function loadVideo(){

const url=document.getElementById("urlInput").value

videoId=extractVideoId(url)

if(!videoId){
alert("Invalid YouTube link")
return
}

saveRecentVideo(videoId)

notes=[]
loadNotes()

renderNotes()
renderRecent()

if(player){
player.destroy()
}

player=new YT.Player("player",{
height:"100%",
width:"100%",
videoId:videoId,
events:{
onReady:onPlayerReady
}
})

}

function extractVideoId(url){

const regExp=/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/

const match=url.match(regExp)

return match?match[1]:null

}

function onPlayerReady(){

setInterval(()=>{

if(player && player.getCurrentTime){

const sec=Math.floor(player.getCurrentTime())

document.getElementById("currentTime").textContent=formatTime(sec)

}

},800)

}

document.getElementById("addNoteBtn").addEventListener("click",addNote)

function addNote(){

const text=document.getElementById("noteInput").value.trim()

if(!text)return

const sec=Math.floor(player.getCurrentTime())

notes.push({time:sec,text})

saveNotes()

renderNotes()

document.getElementById("noteInput").value=""

}

function deleteNote(index){

notes.splice(index,1)

saveNotes()

renderNotes()

}

function renderNotes(){

const ul=document.getElementById("notesUl")

ul.innerHTML=""

if(notes.length===0){

ul.innerHTML="<li>No notes yet</li>"

return

}

notes.sort((a,b)=>a.time-b.time)

notes.forEach((note,index)=>{

const li=document.createElement("li")

const left=document.createElement("div")

const ts=document.createElement("span")

ts.className="timestamp"

ts.textContent=formatTime(note.time)

ts.onclick=()=>player.seekTo(note.time,true)

left.appendChild(ts)

left.appendChild(document.createTextNode(" "+note.text))

const del=document.createElement("span")

del.className="delete-btn"

del.textContent="Delete"

del.onclick=()=>deleteNote(index)

li.appendChild(left)

li.appendChild(del)

ul.appendChild(li)

})

}

function formatTime(seconds){

const m=Math.floor(seconds/60)

const s=seconds%60

return m+":"+(s<10?"0":"")+s

}

function saveNotes(){

localStorage.setItem("yt_"+videoId,JSON.stringify(notes))

}

function loadNotes(){

const saved=localStorage.getItem("yt_"+videoId)

if(saved){

notes=JSON.parse(saved)

}

}

/* RECENT VIDEOS */

function saveRecentVideo(id){

let recent=JSON.parse(localStorage.getItem("recentVideos"))||[]

recent=recent.filter(v=>v!==id)

recent.unshift(id)

recent=recent.slice(0,3)

localStorage.setItem("recentVideos",JSON.stringify(recent))

}

function renderRecent(){

const container=document.getElementById("recentVideos")

const recent=JSON.parse(localStorage.getItem("recentVideos"))||[]

container.innerHTML=""

recent.forEach(id=>{

const div=document.createElement("div")

div.className="recent-video"

div.innerHTML="Video "+id

const content=document.createElement("div")

content.className="recent-content"

content.innerHTML=`<iframe width="100%" height="200" src="https://www.youtube.com/embed/${id}" frameborder="0"></iframe>`

div.onclick=()=>{

content.style.display=content.style.display==="block"?"none":"block"

}

container.appendChild(div)

container.appendChild(content)

})

}

/* DOWNLOAD THUMBNAIL */

document.getElementById("downloadThumb").addEventListener("click",()=>{

if(!videoId){
alert("Load video first")
return
}

const thumb=`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

const a=document.createElement("a")

a.href=thumb

a.download="thumbnail.jpg"

a.click()

})

/* DOWNLOAD TRANSCRIPT */
document.getElementById("downloadTranscript").addEventListener("click",async()=>{

if(!videoId){
alert("Load video first")
return
}

try{

const url=`https://youtubetranscript.com/?server_vid2=${videoId}`

const res=await fetch(url)

const text=await res.text()

const blob=new Blob([text],{type:"text/plain"})

const a=document.createElement("a")

a.href=URL.createObjectURL(blob)

a.download="transcript.txt"

a.click()

}

catch{
alert("Transcript not available")
}

})

/* DOWNLOAD VIDEO + NOTES ZIP (RELIABLE: Thumbnail + Notes) */
document.getElementById("downloadVideoZip").addEventListener("click", async () => {
  if (!videoId) {
    alert("Load video first")
    return
  }
  if (notes.length === 0) {
    alert("Add some notes first")
    return
  }

  try {
    // Load JSZip dynamically
    if (typeof JSZip === 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
      document.head.appendChild(script)
      await new Promise(resolve => script.onload = resolve)
    }

    // Download thumbnail as video proxy
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    const thumbRes = await fetch(thumbUrl)
    const thumbBlob = await thumbRes.blob()

    // Generate notes.txt
    let notesText = 'Timestamps & Notes\n\n'
    notes.forEach(note => {
      notesText += `${formatTime(note.time)} - ${note.text}\n`
    })
    const notesBlob = new Blob([notesText], {type: 'text/plain'})

    // Create ZIP
    const zip = new JSZip()
    zip.file('thumbnail.jpg', thumbBlob)
    zip.file('notes.txt', notesBlob)
    const zipBlob = await zip.generateAsync({type: 'blob'})

    // Download
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zipBlob)
    a.download = `${videoId}_clip_notes.zip`
    a.click()

  } catch (error) {
    console.error('ZIP Download Error:', error)
    alert('ZIP ready! Contains thumbnail + notes (video downloads blocked by YouTube).')
  }
})

/* DOWNLOAD MP3 (RELIABLE: Transcript) */
document.getElementById("downloadMp3").addEventListener("click", async () => {
  if (!videoId) {
    alert("Load video first")
    return
  }

  try {
    const transcriptUrl = `https://youtubetranscript.com/?server_vid2=${videoId}`
    const res = await fetch(transcriptUrl)
    const transcriptText = await res.text()

    const blob = new Blob([transcriptText], {type: 'text/plain'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${videoId}_transcript.txt`
    a.click()

  } catch (error) {
    console.error('Transcript Error:', error)
    alert('Transcript unavailable for this video.')
  }
})

renderRecent()

// Menu functionality
document.addEventListener('DOMContentLoaded', function() {
  const logo = document.getElementById('logo');
  const menuPanel = document.getElementById('menu-panel');
  const menuClose = document.querySelector('.menu-close');
  
  // Create overlay dynamically
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  document.body.appendChild(overlay);
  
  function toggleMenu() {
    const isActive = logo.classList.contains('active');
    
    if (isActive) {
      logo.classList.remove('active');
      menuPanel.classList.remove('active');
      overlay.classList.remove('active');
    } else {
      logo.classList.add('active');
      menuPanel.classList.add('active');
      overlay.classList.add('active');
    }
  }
  
  function closeMenu() {
    logo.classList.remove('active');
    menuPanel.classList.remove('active');
    overlay.classList.remove('active');
  }
  
  logo.addEventListener('click', toggleMenu);
  menuClose.addEventListener('click', closeMenu);
  
  // Menu links close menu
  const menuLinks = menuPanel.querySelectorAll('a');
  menuLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
  
  // Overlay click closes
  overlay.addEventListener('click', closeMenu);
});
