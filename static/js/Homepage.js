window.onload = init
function init(){
    const panoramaImage = new PANOLENS.ImagePanorama("../../static/projects/image1.jpg");
    const imageContainer = document.querySelector(".imageContainer");
    imageContainer.style.pointerEvents = 'none';
    const viewer = new PANOLENS.Viewer({
    container: imageContainer,
    autoRotate: true,
    autoRotateSpeed: 0.3,
    });
    viewer.add(panoramaImage);
    viewer.OrbitControls.noZoom = false
    viewer.OrbitControls.minFov= 60;
    viewer.OrbitControls.maxFov= 60;
    viewer.OrbitControls.noPan = true;

    var items = $('.item')
    $( document ).ready(function() {
        items.on('click', function(e){
            var sectionID = e.target.parentElement.attributes['href'].value
            for(let i=0;i<items.length;i++){
                if(items[i] === e.target){
                    console.log(e.target)
                    e.target.classList.add('activated')
                }
                else{
                    items[i].classList.remove('activated')
                }
            }
            $('html, body').animate({
                scrollTop: $(sectionID).offset().top
            }, 500);
        });
        
    });
    
    var panels = $('.panel')
    window.addEventListener('scroll', function(e) {
        for(let i=0;i<panels.length;i++){
            var position = panels[i].getBoundingClientRect();
        
            // checking whether fully visible
            // if(position.top >= 0 && position.bottom <= window.innerHeight) {
            //     console.log(panels[i]+' Element is fully visible in screen');
            //     for(let j=0;j<panels.length;j++){
            //         if(panels[i] === panels[j]){
            //             console.log(panels[j])
            //             panels[i].classList.add('activated')
            //         }
            //         else{
            //             panels[j].classList.remove('activated')
            //         }
            //     }
            // }
        
            // checking for partial visibility
            if(position.top < window.innerHeight/3 && position.bottom >= 0) {
                for(let j=0;j<panels.length;j++){
                    if(panels[i] === panels[j]){
                        items[i].classList.add('activated')
                    }
                    else{
                        items[j].classList.remove('activated')
                    }
                }
            }
        }


        const title = $('.navbar .title')
        title.on('click',function(){
            window.location.href = 'http://127.0.0.1:5000/';
        })
        
    });


    const icons = document.querySelectorAll(".icons .icon")
    const boxes = document.querySelectorAll(".process .container .bottom .box")
    console.log(icons)
    console.log(boxes)
    let currentSlide = 1
    
    var sliderNav = function(manual){
        
        icons.forEach((icon) => {
            icon.classList.remove('activated')
        })
        boxes.forEach((boxe) => {
            boxe.classList.remove('activated')
        })
    
        icons[manual].classList.add('activated')
        boxes[manual].classList.add('activated')
        boxes[manual].classList.add('show')
        setInterval(()=>{
            boxes[manual].classList.remove('show')
        },1500)
    }
    icons.forEach((icon, i) =>{
        icon.addEventListener("click",() => {
            sliderNav(i);
            currentSlide = i
        });
    })





    // window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });






}