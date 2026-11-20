
const projectInputs = $('.newProjectForm input') 
function fillForm(data,inputs){
    for (let i=0;i<inputs.length;i++){
        console.log(inputs[i].name)
        if(inputs[i].name === 'coordinates'){
            inputs[i].value = data['geometry']['coordinates']
        }
        else{
            inputs[i].value = data['properties'][inputs[i].name]
        }
    }
    
}


const saveBtn = $('.saveBtn') 
saveBtn.on('click',function(e){
        const loadingPopup = $('.loadingPopup')
        const loadingAnim = $('.loadingPopup .loading')
        const completedAnim = $('.loadingPopup .completed')
        loadingPopup[0].style.display = 'block' 
        var projectForm = new FormData($('#projectForm')[0]);
        var projectObject = {};
        projectForm.forEach(function(value, key){
            projectObject[key] = value;
        });
        $.ajax({
                    type: 'POST',
                    url: '/admin/saveProject',
                    timeout: 0,
                    dataType:'json',
                    cashe:false,
                    data: JSON.stringify({"projectForm":JSON.stringify(projectObject)}),
                    processData: false, 
                    contentType: 'application/json',
                    success: setTimeout(function(data) {
                        console.log("SUCCESS !!: ", data);   
                        completedAnim[0].style.visibility = 'visible'
                        completedAnim[0].style.opacity = 1
                        loadingAnim[0].style.opacity = 0
                        loadingAnim[0].style.visibility = 'hidden'
                    },2000)
        });
})


const continueBtn = $('.continue')
continueBtn.on('click',function(e){
    window.location.href = 'http://127.0.0.1:5000/admin';
    e.target.value = '';
})






window.addEventListener('load', function(e){
    $.ajax({
        type: 'POST',
        url: '/admin/modifyProject/'+id,
        timeout: 0,
        contentType: "application/json",
        dataType: 'json',
        success: function(data) {
            console.log(data)
            fillForm(data,projectInputs)
        },
  
        error: function(e) {
          console.log('Failuuuuure!!')
          console.log("ERROR : ", e.responseText);
          alert("ERROR : " + e.responseText);
        }
    });
});

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