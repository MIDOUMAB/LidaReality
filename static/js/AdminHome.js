window.onload = init 
function init(){

    const createProjectBtn = $('.createProject')
    createProjectBtn.on('click',function(e){
        window.location.href = 'http://127.0.0.1:5000/admin/createProject';
        e.target.value = '';
    })

    $(document).ready(function(){
        $(document).on('click','.boxProject #modifyBtn',function(e){
            var id = e.target.parentElement.parentElement.parentElement.id
            window.location.href = 'http://127.0.0.1:5000/admin/modifyProject/'+id;
            e.target.value = '';
        })
    })

    $(document).ready(function(){
        $(document).on('click','.boxProject #enterBtn',function(e){
            var id = e.target.parentElement.parentElement.parentElement.id
            window.location.href = 'http://127.0.0.1:5000/admin/'+id+'/0';
            e.target.value = '';
        })
    })



    const myProfileBtn = $('.navbar .navbarContainer .account .profileInfo')
    const profileList = $('.navbar .navbarContainer .account .profileList')
    myProfileBtn.on('click',function(e){
        if(profileList[0].classList.contains('activated')){
            profileList[0].classList.remove('activated')
        }
        else{
            profileList[0].classList.add('activated')
        }
    })



    const title = $('.navbar .title')
    title.on('click',function(){
        window.location.href = 'http://127.0.0.1:5000/';
    })
}

const projectsContainer = $('.main .bottom')[0]

function loadProjects(arr){
    arr['project'].forEach((item)=>{
        console.log(item)
        var div = document.createElement('div')
        div.className = 'boxProject';
        div.id = item['properties']['id'];
        div.innerHTML = '<div class="infoProject"><div class="aboutProject"><h3>'+item['properties']['name']+'</h3><p>'+item['properties']['address']+'</p></div><div class="btnProject"><img class="imageIcon white" id="modifyBtn" src="../../static/icons/gear-solid.svg" ><img class="imageIcon white" id="enterBtn" src="../../static/icons/play-solid.svg" ></div></div>'
        div.style.backgroundImage = "url('"+item['properties']['img']+"')"
        projectsContainer.appendChild(div)
    })
}


window.addEventListener('load', function(e){
    $.ajax({
        type: 'POST',
        url: '/loadProjects',
        timeout: 0,
        contentType: "application/json",
        dataType: 'json',
        success: function(data) {
            loadProjects(data)
        },
  
        error: function(e) {
          console.log('Failuuuuure!!')
          console.log("ERROR : ", e.responseText);
          alert("ERROR : " + e.responseText);
        }
    });
});