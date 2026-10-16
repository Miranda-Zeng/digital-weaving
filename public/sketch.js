let socket = io();

const weavingSpace = document.getElementById("weaving-space");
const warpCount = 15;
const spacing = 32;
const warpWidth = 16;
const weavingWidth = (warpCount - 1) * spacing + warpWidth;
const startX = (600 - weavingWidth) / 2;

let currentRow = 0;

const patternInput = document.getElementById("pattern-input");
const weaveButton = document.getElementById("weave-button");

let previewWeft = null;

for (let i=0;i<warpCount;i++){
    let warp=document.createElement("div");
    warp.classList.add("warp");
    warp.style.left = startX + i*spacing + "px";
    weavingSpace.appendChild(warp);
}

// const pattern = "010101010101";

function createWeft(pattern, row){ 
    const weft = document.createElement("div");
    weft.classList.add("weft");
    weft.style.top = 50 + row*22 + "px";
    weft.style.left =  startX + warpWidth / 2 - spacing / 2 + "px";

    for (let i = 0; i < pattern.length;i++){
        let segment = document.createElement("div");
        segment.classList.add("segment");

        if(pattern[i] === "0"){
            segment.classList.add("under");
        } else{
            segment.classList.add("over");
        }
        weft.appendChild(segment);
    }
    weavingSpace.appendChild(weft);
    return weft;
}

const galleryItems = document.getElementById("gallery-items");

function exportPiece(){
    if (previewWeft){
        previewWeft.remove();
        previewWeft = null;
    } 
    htmlToImage.toPng(weavingSpace).then(function(dataUrl) {
        socket.emit("savePiece", dataUrl);
        clearWeaving();
    });
}

function addGalleryImage(dataUrl) {
    const img = document.createElement("img");
    img.src = dataUrl;
    img.classList.add("gallery-image");
    galleryItems.appendChild(img);
}

function clearWeaving(){
    weavingSpace.querySelectorAll(".weft").forEach(function(weft) {
        weft.remove();
    });

    previewWeft = null;
    currentRow = 0;
}

patternInput.addEventListener("input", function(){
    let pattern = patternInput.value;
    if (previewWeft){
        previewWeft.remove();
        previewWeft = null;
    } 
    if(pattern.length > 0){
        previewWeft = createWeft(pattern, currentRow);
    }
});

weaveButton.addEventListener("click", function(){
    let pattern = patternInput.value;
    if (!/^[01]{15}$/.test(pattern)) {
        alert("Please enter exactly 15 binary digits!");
        return;
    }
    socket.emit("weave",pattern);
    if (previewWeft){
        previewWeft.remove();
        previewWeft = null;
    }    
    patternInput.value = "";
});

socket.on("weaveResponse",function(data){
    if (previewWeft){
        previewWeft.remove();
        previewWeft = null;
    }    
    createWeft(data.pattern,data.row);
    // decide the preview row，when another user submit the pattern, put the preview to the next row
    currentRow = data.row +1;
    if(patternInput.value.length >0){
        previewWeft = createWeft(patternInput.value, currentRow);
    }
})

socket.on("weavingHistory", function(history){
    history.forEach(function(data){
        createWeft(data.pattern, data.row);
    })
    currentRow = history.length;
});
 
socket.on("pieceCompleted", function(uploaderId){
    if (previewWeft) {
        previewWeft.remove();
        previewWeft = null;
    }
    if (socket.id === uploaderId) {
        exportPiece();
    } else {
        clearWeaving();
    }
});

socket.on("newGalleryImage", function(dataUrl) {
    addGalleryImage(dataUrl);
});

socket.on("galleryHistory", function(images) {
    images.forEach(function(dataUrl) {
        addGalleryImage(dataUrl);
    });
});
