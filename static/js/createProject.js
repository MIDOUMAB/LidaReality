window.onload = init 
function init(){

    
    // $('.jsonFile').change(function(e){
    //     let formData = new FormData(); 
    //     let fileInput = document.getElementsByClassName('jsonFile')[0];
    //     const selectedFiles = [...fileInput.files];
        
    //     formData.append("jsonFile", selectedFiles[0]);
    //     var form_data = new FormData($('#projectForm')[0]);
    //     console.log(form_data)
    //     var projectObject = {};
    //     form_data.forEach(function(value, key){
    //         projectObject[key] = value;
    //     });

    //     $.ajax({
    //         type: 'POST',
    //         url: '/file',
    //         timeout: 0,
    //         data: [form_data,projectObject],
    //         body: formData,
    //         processData: false, 
    //         contentType: false,
    //         success: function(data) {
    //             console.log("SUCCESS !!: ", data);
    //         }
    //     });
    //     e.target.value = ''
    // });

    var index = 0
    const addScanBtn = $('.addScan');
    const scansForm = $('#scansForm')[0]
    addScanBtn.on('click',function(e){
        index += 1;
        const div = document.createElement('div')
        div.className = 'scan';
        div.innerHTML = '<div class="field"><label for="scanFile">Scan file (.xyz)</label><input class="scanFile" type="file" name="scanFile'+index+'"></div><div class="field"><label for="scanImage">Scan image (.jpg)</label><input class="scanImage" type="file" name="scanImage'+index+'"></div><div class="field"><label for="scanPosition">Scan position (x,y,z) (m)</label><input class="scanPosition x" type="text" name="scanPosition" placeholder="X"><input class="scanPosition y" type="text" name="scanPosition" placeholder="Y"><input class="scanPosition z" type="text" name="scanPosition" placeholder="Z"></div><button class="deleteScan" type="button"> X </button>'
        scansForm.appendChild(div)
    })

    const deleteScanBtn = $('.deleteScan');
    $(document).ready(function(){
        $(document).on('click','.deleteScan',function(e){
            e.target.parentElement.remove()
        })
    })

    const submitNewProject = $('.submitBtn')
    submitNewProject.on('click',function(e){
        const loadingPopup = $('.loadingPopup')
        const loadingAnim = $('.loadingPopup .loading')
        const completedAnim = $('.loadingPopup .completed')
        loadingPopup[0].style.display = 'block' 
        var projectForm = new FormData($('#projectForm')[0]);
        var projectObject = {};
        projectForm.forEach(function(value, key){
            projectObject[key] = value;
        });
        var jsonFile = $('.jsonFile')[0].files[0]
        let formData = new FormData(); 
        formData.append("jsonFile",jsonFile);
        $.ajax({
                    type: 'POST',
                    url: '/admin/new_Project',
                    timeout: 0,
                    dataType:'json',
                    cashe:false,
                    data: JSON.stringify({"projectForm":JSON.stringify(projectObject)}),
                    processData: false, 
                    contentType: 'application/json',
                    success: function(data) {
                        console.log("SUCCESS !!: ", data);
                    }
        });
        $.ajax({
            type: 'POST',
            url: '/admin/new_ProjectFile/'+projectObject['folder'],
            timeout: 0,
            data: projectForm,
            body: formData,
            processData: false, 
            contentType: false,
            success: setTimeout(function(data) {
                console.log("SUCCESS !!: ", data);   
                completedAnim[0].style.visibility = 'visible'
                completedAnim[0].style.opacity = 1
                loadingAnim[0].style.opacity = 0
                loadingAnim[0].style.visibility = 'hidden'
            },2000)
        });
        e.target.value = ''
    })

    const continueBtn = $('.continue')
    continueBtn.on('click',function(e){
        window.location.href = 'http://127.0.0.1:5000/admin';
        e.target.value = '';
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