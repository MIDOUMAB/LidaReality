import * as THREE from '../../static/dist/three.js';
import {
    CSS2DRenderer,
    CSS2DObject,
} from '../../static/dist/CSS2DRenderer.js'

let camera,controls, scene, renderer,clock,points,labelRenderer,viewer;
init();
animate();
function init() {

    

    const main3D = document.getElementById('3d')

    var mapContainer = document.getElementById('map');

 
    proj4.defs('EPSG:32630', '+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs +type=crs ');
    ol.proj.proj4.register(proj4);

    // Create the map
    const map = new ol.Map({
        view: new ol.View({
            projection: 'EPSG:32630',
            center: ol.proj.fromLonLat([10, 33]), // Set the initial center coordinates
            zoom: 7 // Set the initial zoom level
        }),
        target: mapContainer,
        moveTolerance:2
    });
    const ImageSat = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
        }),
        visible: false,
        title:"ImageSat",
      })
    //   map.addLayer(ImageSat)
      
      const OSMStandard = new ol.layer.Tile({
        source: new ol.source.OSM({
        }),
        visible: true,
        title:"OSMStandard",
      })
    //   map.addLayer(OSMStandard) 

    const baseLayers = new ol.layer.Group({
        title:'Base Maps',
        fold:true,
        layers:[OSMStandard,ImageSat]
    });

    map.addLayer(baseLayers);

    var redStyle = new ol.style.Style({
            image: new ol.style.Icon({
              anchor: [0.5, 1],
              src: 'http://maps.google.com/mapfiles/kml/paddle/red-circle.png',
              scale: 0.5
            })
    })
    var blueStyle = new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          src: 'http://maps.google.com/mapfiles/kml/paddle/blu-circle.png',
          scale: 0.5
        })
})
    var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: '../.'+folderName+'/file.json',
            format: new ol.format.GeoJSON({ dataProjection:'EPSG:32630' ,featureProjection: 'EPSG:32630' }),
        }),
        
        style:function(feature, resolution) {
            if (feature.getProperties().id == id) {
                return blueStyle;
            }
            else {
                return redStyle;
            }
        },
        name:'points',
        title:'points'
      });
      map.addLayer(vectorLayer);
      
    const vectorSource  = vectorLayer.getSource()
    vectorSource.on('change', function() {
        map.getView().fit(vectorSource.getExtent() ,{ duration: 1000 });
    });

    var vectorLine = new ol.source.Vector({});
    var vectorLineLayer = new ol.layer.Vector({
        source: vectorLine,
        style: new ol.style.Style({
            fill: new ol.style.Fill({ color: '#00FF00', weight: 4 }),
            stroke: new ol.style.Stroke({ color: '#00FF00', width: 2 })
        })
    });
    map.addLayer(vectorLineLayer);
        
function rotateVectorX(vector, theta) {
    var y = vector.y;
    var z = vector.z;
    vector.y = y * Math.cos(theta) - z * Math.sin(theta);
    vector.z = y * Math.sin(theta) + z * Math.cos(theta);
}

// Function to rotate a vector around the y-axis
function rotateVectorY(vector, theta) {
    var x = vector.x;
    var z = vector.z;
    vector.x = x * Math.cos(theta) + z * Math.sin(theta);
    vector.z = -x * Math.sin(theta) + z * Math.cos(theta);
}

// Function to rotate a vector around the z-axis
function rotateVectorZ(vector, theta) {
    var x = vector.x;
    var y = vector.y;
    vector.x = x * Math.cos(theta) - y * Math.sin(theta);
    vector.y = x * Math.sin(theta) + y * Math.cos(theta);
}

// Function to transform coordinates with arbitrary angles
function transformCoordinates(x, y, z, thetaX, thetaY, thetaZ) {
    var vector = new THREE.Vector3(x, y, z);
    rotateVectorX(vector, thetaX);
    rotateVectorY(vector, thetaY);
    rotateVectorZ(vector, thetaZ);
    return vector;
}

function createInfospots(id_proj,position,rotaton,arr){
    arr.forEach((item)=>{
        var dx = item['coordinates'][0] - position[0];
        var dy = item['coordinates'][1] - position[1];
        var dz = item['coordinates'][2] - position[2];
        var spritePos = transformCoordinates(dx, dy, dz, 0, 0, -(Math.PI+rotaton[2]*Math.PI/180));
        let new_infospot = new PANOLENS.Infospot(200, PANOLENS.DataImage.Arrow);
        new_infospot.position.set(100*spritePos.x, 100*spritePos.z, 100*spritePos.y);
        new_infospot.addEventListener('click', function () {
            window.location.href = 'http://127.0.0.1:5000/admin/'+id_proj+'/'+item['id']+'?x='+new_infospot.position.x+'&y='+new_infospot.position.y+'&z='+new_infospot.position.z;              
        });
        panoramaImage.add(new_infospot);
    })
}


    function createInfoBox(data,position){
        const boxDiv = document.createElement( 'div' );
        boxDiv.className = 'informationDiv';
        boxDiv.id = 'box'+data.id;

        const boxCloser = document.createElement( 'a' );
        boxCloser.id="box-closer" 
        boxCloser.className="boxCloser"
        boxCloser.style.pointerEvents = 'auto'
        boxCloser.addEventListener('pointerdown', () => {
            boxCloser.parentElement.style.visibility = 'hidden'
        })

        const objImg = document.createElement( 'div' );
        objImg.className = 'objImg';
        objImg.style.backgroundImage = 'url("../../static/icons/'+data.imgName+'")'

        const objInfo = document.createElement( 'div' );
        objInfo.className = 'objInfo';

        const objId = document.createElement( 'h3' );
        objId.className = 'objId';
        objId.textContent = data.id;

        const objName = document.createElement( 'h4' );
        objName.className = 'objName';
        objName.textContent = data.name;

        const objDesc = document.createElement( 'p' );
        objDesc.className = 'objDesc';
        objDesc.textContent = data.description;
        
        objInfo.appendChild(objId)
        objInfo.appendChild(objName)
        objInfo.appendChild(objDesc)

        boxDiv.appendChild(boxCloser)
        boxDiv.appendChild(objImg)
        boxDiv.appendChild(objInfo)
        const label = new CSS2DObject( boxDiv );
        label.position.set(position[0],position[1],position[2]);
        
        return label
    }

    function createObjects(arr){
        arr.forEach((item)=>{
            var geom = new window.THREE.Geometry();
            var points = item['points']
            var center = [0,0,0]
            for ( var i = 0; i< points.length; i++) {
                geom.vertices.push(new window.THREE.Vector3(points[i][0],points[i][1],points[i][2])); 
                center[0] = center[0]+points[i][0]/points.length
                center[1] = center[1]+points[i][1]/points.length
                center[2] = center[2]+points[i][2]/points.length
            }
            for ( var i = 0; i< points.length-2; i++) {
                geom.faces.push( new window.THREE.Face3(0,i+1,i+2)); 
            }
            geom.computeFaceNormals();

            var object = new window.THREE.Mesh( geom, new window.THREE.MeshBasicMaterial({ color: 0xffff00, side: window.THREE.DoubleSide,opacity : 0.4  }) );
            object.material.opacity = 0.4;
            object.material.transparenitemt = true;
            object.material.transparent = true;
            object.userData.id = item['id'];
            object.userData.name = item['name'];
            object.userData.description = item['description'];
            object.userData.imgName = item['imgName'];
            group.add( object );  
            const box = createInfoBox(object.userData,center)
            box.element.style.visibility = 'hidden'
            box.element.style.pointerEvents = 'auto'
            // box.element.addEventListener('pointerdown', () => { alert(1) })
            viewer.scene.add(box)
        })
    }
    function line(idPoint1,idPoint2){
        var point1,point2;
        var linePoints = [];
        const features = vectorSource.getFeatures();
        const lineFeatures = vectorLine.getFeatures();
        var exist = false;
        lineFeatures.forEach((ln)=>{
            if(ln.getProperties().properties.some((id) => id == idPoint1) && ln.getProperties().properties.some((id) => id == idPoint2)){
                console.log('contaaaaainnnsss')
                exist = true
            }            
        })
        if(exist == false){
            features.forEach((feat)=>{
                if(feat.getProperties().id === idPoint1){
                    point1 = feat.getProperties().geometry.getCoordinates()
                    linePoints.push(point1)
                }
                else if(feat.getProperties().id === idPoint2){
                    point2 = feat.getProperties().geometry.getCoordinates()
                    linePoints.push(point2)
                }
            })
            var featureLine = new ol.Feature({
                geometry: new ol.geom.LineString(linePoints),
                properties:[idPoint1,idPoint2]
            });
            vectorLine.addFeature(featureLine);
        }
        
    }
    function createLines(arr){
        arr.forEach((item)=>{
            if(item[1].length != 0){
                item[1].forEach((i)=>{
                    line(item[0],i)
                })
            }
        })
    }

    const panoramaImage = new PANOLENS.ImagePanorama('../.'+imageUrl);
    panoramaImage.name = 'panoramaImage';
    const panoramaImageColor = new PANOLENS.ImagePanorama('../.'+imageColor);
    panoramaImageColor.name = 'panoramaImageColor';
    viewer = new PANOLENS.Viewer({
        container: main3D,
        controlBar: false,
    });
    viewer.add(panoramaImage,panoramaImageColor);
    viewer.addUpdateCallback(function(){});
    viewer.animate()

    viewer.OrbitControls.minFov= 5;
    viewer.OrbitControls.maxFov= 85;

    const group = new window.THREE.Group();
    viewer.scene.add(group);

    panoramaImage.addEventListener( 'enter-fade-start', function(){
        const parameters = new URLSearchParams(window.location.search);
        console.log(parameters);
        console.log(parameters.get("x"));
        if(parameters.size != 0){
            viewer.tweenControlCenter( new THREE.Vector3(parseFloat(parameters.get("x")), parseFloat(parameters.get("y")), parseFloat(parameters.get("z"))), 2 );        
        }
});

    panoramaImage.addEventListener('load', function(e){
        $.ajax({
            type: 'POST',
            url: '/infospots',
            timeout: 0,
            contentType: "application/json",
            dataType: 'json',
            success: function(data) {
                // console.log("SUCCESS !!: ", data);
                createInfospots(data['id'],imagePos,imageRot,data['infospots'])
            },
      
            error: function(e) {
              console.log('Failuuuuure!!')
              console.log("ERROR : ", e.responseText);
              alert("ERROR : " + e.responseText);
            }
        });
        $.ajax({
            type: 'POST',
            url: '/objects',
            timeout: 0,
            contentType: "application/json",
            dataType: 'json',
            success: function(data) {
                // console.log("SUCCESS !!: ", data);
                createObjects(data['objects'])
            },
      
            error: function(e) {
              console.log('Failuuuuure!!')
              console.log("ERROR : ", e.responseText);
              alert("ERROR : " + e.responseText);
            }
        });
        $.ajax({
            type: 'POST',
            url: '/allInfospots',
            timeout: 0,
            contentType: "application/json",
            dataType: 'json',
            success: function(data) {
                console.log("SUCCESS !!: ", data);
                createLines(data['infospots'])
            },
      
            error: function(e) {
              console.log('Failuuuuure!!')
              console.log("ERROR : ", e.responseText);
              alert("ERROR : " + e.responseText);
            }
        });
    });

    const panocanvas = $('.threed .panolens-canvas');
    panocanvas[0].style.width = '100%';
    panocanvas[0].style.height = '100%';

    console.log(panocanvas[0])
    labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( panocanvas[0].width, panocanvas[0].height );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.zIndex = 20;
    labelRenderer.domElement.id = 'labelObject';
    labelRenderer.visible = true;
    main3D.appendChild( labelRenderer.domElement );
    
    const fullscreen = $('.toolbar #fullscreen');
    fullscreen[0].addEventListener('click', () => {
            const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
        
            if (!fullscreenElement) {
                if (panocanvas[0].requestFullscreen) {
                    panocanvas[0].requestFullscreen()
                }
                else if (renderer.domElement.webkitRequestFullscreen) {
                    panocanvas[0].webkitRequestFullscreen()
                }
            }
            else {
                if (panocanvas[0].exitFullscreen) {
                    panocanvas[0].exitFullscreen()
                }
                else if (panocanvas[0].webkitExitFullscreen) {
                    panocanvas[0].webkitExitFullscreen()
                }
                panocanvas[0].style.width = '100%';
                panocanvas[0].style.height = '100%';
            }
    })

    const panorama = $('.toolbar #panorama');
    panorama.on('click', () => {
        if(viewer.panorama.name === 'panoramaImage'){
            viewer.setPanorama(panoramaImageColor)
        }
        else{
            viewer.setPanorama(panoramaImage) 
        }
    })

    const popup = $('.popup')[0]
    const popupCloser = $('.popupCloser')
    const popupX = $('.popup .content .x')[0]
    const popupY = $('.popup .content .y')[0]
    const popupZ = $('.popup .content .z')[0]
    const popupD = $('.popup .content .distance')[0]

    popupCloser.on('click',function(){
        popup.style.display = 'none';
    })
    
    function createPositionPopup(){
        const popupDiv = document.createElement( 'div' );
        popupDiv.className = 'popup';
        popupDiv.id = 'popup';
        popupDiv.style.visibility = 'hidden'
        popupDiv.style.pointerEvents = 'auto'

        const popupCloser = document.createElement( 'a' );
        popupCloser.className = 'popupCloser';
        popupCloser.id = 'popup-closer';
        popupCloser.style.pointerEvents = 'auto'
        popupCloser.addEventListener('pointerdown', () => {
            popupCloser.parentElement.style.visibility = 'hidden'
        })

        const popupContent = document.createElement( 'div' );
        popupContent.className = 'content'

        const xp = document.createElement( 'p' );
        xp.className = 'x'
        xp.innerHTML = '<span>X = </span>No data'
        const yp = document.createElement( 'p' );
        yp.className = 'y'
        yp.innerHTML = '<span>Y = </span>No data'
        const zp = document.createElement( 'p' );
        zp.className = 'z'
        zp.innerHTML = '<span>Z = </span>No data'
        const distp = document.createElement( 'p' );
        distp.className = 'distance'
        distp.innerHTML = '<span>Distance = </span>No data'

        popupContent.appendChild(xp)
        popupContent.appendChild(yp)
        popupContent.appendChild(zp)
        popupContent.appendChild(distp)

        popupDiv.appendChild(popupCloser)
        popupDiv.appendChild(popupContent)

        const ppp = new CSS2DObject( popupDiv );
        return ppp
    }

    const ppp = createPositionPopup()
    viewer.scene.add(ppp)

   const errorNot = $('.main .error')
    let rayCaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    function positionEvent(event){
        
                mouse.x =((event.clientX-viewer.renderer.domElement.offsetLeft)/viewer.renderer.domElement.width)*2-1;
                mouse.y =-((event.clientY-viewer.renderer.domElement.offsetTop)/viewer.renderer.domElement.height)*2+1;
                rayCaster.setFromCamera(mouse, viewer.camera);
                let intersections = rayCaster.intersectObject(panoramaImage);
                const uv = intersections[0].uv;
                viewer.scene.add(ppp)
                $.ajax({
                    type: 'POST',
                    url: '/coordinates',
                    data: JSON.stringify(uv),
                    timeout: 0,
                    contentType: "application/json",
                    dataType: 'json',
              
                    success: function(data) {
                        // console.log("SUCCESS !!: ", data);
                        ppp.element.children[1].children[0].lastChild.data = data['coordinates'][0]
                        ppp.element.children[1].children[1].lastChild.data = data['coordinates'][1]
                        ppp.element.children[1].children[2].lastChild.data = data['coordinates'][2]
                        ppp.element.children[1].children[3].lastChild.data = data['distance']
                        ppp.position.set(intersections[0].point.x,intersections[0].point.y,intersections[0].point.z)
                        ppp.element.style.visibility = 'visible'
                    },
              
                    error: function(e) {
                      errorNot[0].style.visibility = 'visible'
                      errorNot[0].style.opacity = 1
                      setTimeout(()=>{
                        errorNot[0].style.opacity = 0
                        errorNot[0].style.visibility = 'hidden'
                      },2000)
                    }
                });
        
                panocanvas.off("click")  
                panocanvas[0].style.cursor = 'default'    
    }

    const positionClick = $('.toolbar #position')
    positionClick.on('click',function(){
        if(positionClick[0].classList.contains('activate')== false){
            panocanvas.on("click",(evt)=>positionEvent(evt)) 
            panocanvas[0].style.cursor = 'crosshair'    
        }
        else{
            positionClick[0].classList.remove('activate');
            panocanvas.off("click")  
            panocanvas[0].style.cursor = 'default' 
        }
    })


    function getCenter(vectorA, vectorB){
        var center = new THREE.Vector3((vectorA.x+vectorB.x)/2,(vectorA.y+vectorB.y)/2,(vectorA.z+vectorB.z)/2)
        return center
    }

    function getText(dist,vector){
        const textDiv = document.createElement( 'div' );
        textDiv.className = 'measurementLabel';
        textDiv.visible = true;

        const dh = document.createElement( 'p' );
        dh.className = 'dh';
        dh.textContent = 'DH = '+dist.DH+'m';

        const di = document.createElement( 'p' );
        di.className = 'di';
        di.textContent = 'DI = '+dist.DI+'m';

        const dz = document.createElement( 'p' );
        dz.className = 'dz';
        dz.textContent = 'DZ = '+dist.DZ+'m';

        textDiv.appendChild(dh)
        textDiv.appendChild(di)
        textDiv.appendChild(dz)
        
        const label = new CSS2DObject( textDiv );
        label.position.set(vector.x,vector.y,vector.z);
        
        return label
    }

    function getPoint(vector){
        var marker = new window.THREE.Mesh( 
            new window.THREE.SphereGeometry( 30, 40, 40 ),
            new window.THREE.MeshBasicMaterial( { color: 0x141E46 } ) 
        );
        marker.position.set(vector.x,vector.y,vector.z);
        return marker
    }

    function getLine( vectorA, vectorB ) {
        var geometry = new window.THREE.Geometry();
        geometry.vertices.push(vectorA);
        geometry.vertices.push(vectorB);
        var material = new window.THREE.LineBasicMaterial({ 
            color: 0xFFFFFF ,
            linewidth:4});
        var line = new window.THREE.Line(geometry, material, window.THREE.LineSegments );
            return line;
    }
    
    const distanceClick = $('.toolbar #distance')
    distanceClick.on('click',function(){
        if(distanceClick[0].classList.contains('activate')== false){
            let countClick = 0;
            var clickPointsXYZ = [];
            var clickPointsUV = [];
            panocanvas[0].style.cursor = 'crosshair' 
            panocanvas.on("click",(event)=>{
                countClick += 1;
                mouse.x =((event.clientX-viewer.renderer.domElement.offsetLeft)/viewer.renderer.domElement.width)*2-1;
                mouse.y =-((event.clientY-viewer.renderer.domElement.offsetTop)/viewer.renderer.domElement.height)*2+1;
                rayCaster.setFromCamera(mouse, viewer.camera);
                let intersections = rayCaster.intersectObject(panoramaImage);
                clickPointsXYZ.push(intersections[0].point);
                clickPointsUV.push(intersections[0].uv);
                var marker = getPoint(intersections[0].point);
                viewer.scene.add(marker);
        
                switch(countClick){
                    case 1:{
                        console.log('add the second point')
                        break;
                    }
                    case 2:{
                        var line = getLine(clickPointsXYZ[0],clickPointsXYZ[1])
                        viewer.scene.add(line)
        
                        $.ajax({
                            type: 'POST',
                            url: '/distance',
                            data: JSON.stringify(clickPointsUV),
                            timeout: 0,
                            contentType: "application/json",
                            dataType: 'json',
                      
                            success: function(data) {
                                console.log("SUCCESS !!: ", data);
                                var centerVect = getCenter(clickPointsXYZ[1],clickPointsXYZ[0])
                                console.log(clickPointsXYZ[0],clickPointsXYZ[1],centerVect)
                                var text = getText(data.distance,centerVect)
                                viewer.scene.add(text)
                                clickPointsXYZ = []
                                clickPointsUV = []
                                countClick = 0;
                                // deleteElements = setTimeout(()=>{
                                //     viewer.scene.children.splice(viewer.scene.children.length - 4,4)
                                //     console.log(viewer.scene.children)
                                //     $('#labelObject')[0].innerHTML = ''
                                //     distanceClick[0].classList.remove('activate');
                                // },5000)
                                
                            },
                      
                            error: function(e) {
                              console.log('Failuuuuure!!')
                              console.log("ERROR : ", e.responseText);
                              alert("ERROR : " + e.responseText);
                            }
                        });
                        
                        panocanvas.off("click")
                        panocanvas[0].style.cursor = 'default' 
                        break;
                    }
                }
                
            })
        }
        else{
            // clearTimeout(deleteElements);
            // distanceClick[0].classList.remove('activate');
            panocanvas.off("click")
            console.log( viewer.scene.children)
            // viewer.scene.children.splice(viewer.scene.children.length - 4,4)
            $('#labelObject')[0].innerHTML = ''
        }
    })


    







var pointsPolygon
const selectClick = $('.selectBtn')
const objInfoPoints = $('.objForm input[name="pointsList"]')[0]
selectClick.on('click',function(e){

    var geom = new window.THREE.Geometry(); 
    pointsPolygon = []
    var cnt = 0
    panocanvas.on("click",(event)=>{
        
        mouse.x =((event.clientX-viewer.renderer.domElement.offsetLeft)/viewer.renderer.domElement.width)*2-1;
        mouse.y =-((event.clientY-viewer.renderer.domElement.offsetTop)/viewer.renderer.domElement.height)*2+1;
        rayCaster.setFromCamera(mouse, viewer.camera);
        let intersections = rayCaster.intersectObject(panoramaImage);
        var marker = getPoint(intersections[0].point);
        viewer.scene.add(marker);
        if (cnt == 0){
            pointsPolygon.push(intersections[0].point);
            geom.vertices.push(intersections[0].point);
            cnt += 1;
        }
        else{
            var line = getLine(pointsPolygon[cnt-1],intersections[0].point)
            viewer.scene.add(line)
            pointsPolygon.push(intersections[0].point);
            geom.vertices.push(intersections[0].point);
            cnt += 1;
        }
    })

    window.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            console.log('polygon created')
            var line = getLine(pointsPolygon[cnt-1],pointsPolygon[0])
            viewer.scene.add(line)
            event.preventDefault();
            panocanvas.off("click")
            for ( var i = 0; i< pointsPolygon.length-2; i++) {
                geom.faces.push( new window.THREE.Face3(0,i+1,i+2)); 
            }
            objInfoPoints.value ='';
            for ( var i = 0; i< pointsPolygon.length; i++) {
                objInfoPoints.value += '['+pointsPolygon[i].x +','+pointsPolygon[i].y +','+pointsPolygon[i].z +']';
                if(i !== pointsPolygon.length-1){
                    objInfoPoints.value += ','
                }
            }
            geom.computeFaceNormals();
            var object = new window.THREE.Mesh( geom, new window.THREE.MeshBasicMaterial({ color: 0xff0000, side: window.THREE.DoubleSide  }) );
            object.material.opacity = 0.4;
            object.material.transparent = true;
            group.add( object );
        }
    }); 
})


const saveBtn = $('.objBar .saveBtn')
saveBtn.on('click',function(e){
    console.log('clicked')
    var objForm = new FormData($('#objForm')[0]);
    var objObject = {};
    objForm.forEach(function(value, key){
        if(key !== 'pointsList'){
            objObject[key] = value;
        }
    });
    $.ajax({
        type: 'POST',
        url: '/admin/saveObject',
        timeout: 0,
        dataType:'json',
        cashe:false,
        data: JSON.stringify({"objForm":JSON.stringify(objObject),"pointsPolygon":JSON.stringify(pointsPolygon)}),
        processData: false, 
        contentType: 'application/json',
        success: function(data) {
            console.log("SUCCESS !!: ", data);
        }
    });
})


const infoClick = $('.toolbar #information')
infoClick.on('click',function(){
        if(infoClick[0].classList.contains('activate')== false){
            infoClick[0].classList.add('activate');
            panocanvas.on("click",function(event){
                mouse.x =((event.clientX-viewer.renderer.domElement.offsetLeft)/viewer.renderer.domElement.width)*2-1;
                mouse.y =-((event.clientY-viewer.renderer.domElement.offsetTop)/viewer.renderer.domElement.height)*2+1;
                rayCaster.setFromCamera(mouse, viewer.camera);
                let intersections = rayCaster.intersectObject(group);
                var objId = intersections[0].object.userData.id
                var objClicked = document.getElementById('box'+objId)
                objClicked.style.visibility = 'visible'
                labelRenderer.domElement.style.pointerEvents = 'click';
            })            
        }
        else{
            infoClick[0].classList.remove('activate');
            panocanvas.off("click")  
        }
})

const deleteClick = $('.objBar #delete')
console.log(deleteClick)
deleteClick.on('click',function(){    
    
    panocanvas.on("click",function(event){
        console.log('intersections')
        mouse.x =((event.clientX-viewer.renderer.domElement.offsetLeft)/viewer.renderer.domElement.width)*2-1;
        mouse.y =-((event.clientY-viewer.renderer.domElement.offsetTop)/viewer.renderer.domElement.height)*2+1;
        rayCaster.setFromCamera(mouse, viewer.camera);
        let intersections = rayCaster.intersectObject(group);
        console.log(intersections)
        var objId = intersections[0].object.userData.id
        var objClicked = document.getElementById('box'+objId)
        viewer.scene.children.filter((item)=>{
            if(item.type === 'Group'){
                item.children.filter((x)=>{
                    if(x.userData.id === objId){
                        console.log('remove it ')
                        item.remove(x)

                        $.ajax({
                            type: 'POST',
                            url: '/admin/deleteObject',
                            timeout: 0,
                            dataType:'json',
                            cashe:false,
                            data: JSON.stringify({"objId":objId}),
                            processData: false, 
                            contentType: 'application/json',
                            success: function(data) {
                                console.log("SUCCESS !!: ", data);
                            }
                        });

                    }
                    
                })
            }
            else if (item.type === 'Object3D'){
                if(item.element.id === 'box'+objId){
                    viewer.scene.remove(item)
                }
                
            }
            
        })
        panocanvas.off("click")
    })            

      
})


const chooseBtns = $('.main .rightBar .choose  div')
chooseBtns.on('click',function(e){
    if(e.target.classList.contains('activated') == false){
        console.log(e.target.classList)
        e.target.classList.add('activated') 
        if(e.target.classList.contains('objects')){
            $('.main .rightBar .choose  .infospots')[0].classList.remove('activated')
            $('.main .threed')[0].style.visibility = 'visible'
            $('.main .objBar')[0].style.visibility = 'visible'
            $('.main .infospotBar')[0].style.visibility = 'hidden'
            $('.main .mapContainer')[0].style.visibility = 'hidden'
        }
        else{
            $('.main .rightBar .choose  .objects')[0].classList.remove('activated')
            $('.main .mapContainer')[0].style.visibility = 'visible'
            $('.main .infospotBar')[0].style.visibility = 'visible'
            $('.main .threed')[0].style.visibility = 'hidden'
            $('.main .objBar')[0].style.visibility = 'hidden'
        }
    }
})


var idpoints
const addRelationBtn = $('.main .infospotBar .addRelationBtn')
addRelationBtn.on('click',function(e){
    var cnt = 0;
    idpoints = []
    $('.firstScan')[0].value = ''
    $('.secondScan')[0].value =''
    function addLine(evt){
        var pixel = map.getEventPixel(evt.originalEvent)
        var feature = map.forEachFeatureAtPixel(pixel,function(feat){
          return feat;
        })
        idpoints.push(feature.getProperties()['id'])
        cnt += 1;
        switch(cnt){
            case 1:{
                console.log('add the second point')
                $('.firstScan')[0].value = feature.getProperties()['id'] 
                break;
            }
            case 2:{
                line(idpoints[0],idpoints[1]) 
                $('.secondScan')[0].value = feature.getProperties()['id'] 
                map.un('click', addLine)
                break;
            }
        }
    }
    map.on('click', addLine)
})

const saveRelationBtn = $('.infospotBar .saveBtn')
saveRelationBtn.on('click',function(e){
                var infospotForm = new FormData($('#infospotForm')[0]);
                var infospotObject = {};
                infospotForm.forEach(function(value, key){
                    infospotObject[key] = value;
                });
                $.ajax({
                    type: 'POST',
                    url: '/admin/saveInfospot',
                    timeout: 0,
                    dataType:'json',
                    cashe:false,
                    data: JSON.stringify({"infospotForm":JSON.stringify(infospotObject)}),
                    processData: false, 
                    contentType: 'application/json',
                    success: function(data) {
                        console.log("SUCCESS !!: ", data);
                    }
                });
})

const deleteRelationBtn = $('.infospotBar .deleteRelationBtn')
deleteRelationBtn.on('click',function(){
    console.log('clicked')
    let selected = null;
    var hoverStyle = (e)=>{
        if (selected !== null) {
            selected.setStyle(undefined);
            selected = null;
        }
            map.forEachFeatureAtPixel(e.pixel, function (f) {
                selected = f;
                if(f.get('shape') == undefined){
                    f.setStyle(selectStyle);
                    return true;
                }
                
            });
    }
    map.on('pointermove',hoverStyle);
    function deleteLine(evt){
        var points
        var pixel = map.getEventPixel(evt.originalEvent)
        var feature = map.forEachFeatureAtPixel(pixel,function(feat){
          return feat;
        })
        if(feature.get('shape') == undefined){
            points = feature.getProperties('properties').properties
            vectorLine.removeFeature(feature);
            map.un('singleclick', deleteLine)
            map.un('pointermove',hoverStyle)
            $.ajax({
                type: 'POST',
                url: '/admin/deleteInfospot',
                timeout: 0,
                dataType:'json',
                cashe:false,
                data: JSON.stringify({"deletedInfospots":JSON.stringify(points)}),
                processData: false, 
                contentType: 'application/json',
                success: function(data) {
                    console.log("SUCCESS !!: ", data);
                }
            });
        }
    }
    map.on('singleclick', deleteLine)
})

const selectStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: '#00ff00',
    }),
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 255, 0, 0.7)',
      width: 2,
    }),
  });

    const title = $('.navbar .title')
    title.on('click',function(){
        window.location.href = 'http://127.0.0.1:5000/';
    })


// panocanvas.on("click",(event)=>{
        
//     mouse.x =((event.clientX-viewer.renderer.domElement.offsetLeft)/viewer.renderer.domElement.width)*2-1;
//     mouse.y =-((event.clientY-viewer.renderer.domElement.offsetTop)/viewer.renderer.domElement.height)*2+1;
//     rayCaster.setFromCamera(mouse, viewer.camera);
//     let intersections = rayCaster.intersectObject(group);
//     console.log(intersections)
// })




































}

function animate() {

    requestAnimationFrame( animate );


    render();

}

function render() {
    labelRenderer.render( viewer.scene, viewer.camera );
}












